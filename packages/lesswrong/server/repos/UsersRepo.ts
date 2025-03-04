import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";
import { calculateVotePower } from "../../lib/voting/voteTypes";
import { ActiveDialogueServer } from "../../components/hooks/useUnreadNotifications";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { isEAForum } from "../../lib/instanceSettings";
import { userLoginTokensView } from "../postgresView";
import { getDefaultFacetFieldSelector, getFacetField } from "../search/facetFieldSearch";
import { MULTISELECT_SUGGESTION_LIMIT } from "@/components/hooks/useSearchableMultiSelect";
import { getViewablePostsSelector } from "./helpers";

const GET_USERS_BY_EMAIL_QUERY = `
-- UsersRepo.GET_USERS_BY_EMAIL_QUERY 
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)`;

const GET_USER_BY_USERNAME_OR_EMAIL_QUERY = `
-- UsersRepo.GET_USER_BY_USERNAME_OR_EMAIL_QUERY
SELECT *
FROM "Users"
WHERE username = $1
UNION
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)
LIMIT 1
`;

export type MongoNearLocation = { type: "Point", coordinates: number[] }

class UsersRepo extends AbstractRepo<"Users"> {
  constructor() {
    super(Users);
  }

  getUserByLoginToken(hashedToken: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      -- UsersRepo.getUserByLoginToken
      SELECT * FROM fm_get_user_by_login_token($1)
    `, [hashedToken]);
  }

  getUsersWhereLocationIsInNotificationRadius(location: MongoNearLocation): Promise<Array<DbUser>> {
    // the notification radius is in miles, so we convert the EARTH_DISTANCE from meters to miles
    return this.any(`
      -- UsersRepo.getUsersWhereLocationIsInNotificationRadius
      SELECT *
      FROM "Users"
      WHERE (
        EARTH_DISTANCE(
          LL_TO_EARTH(
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->0)::FLOAT8,
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->1)::FLOAT8
          ),
          LL_TO_EARTH($1, $2)
        ) * 0.000621371
      ) < "nearbyEventsNotificationsRadius"
    `, [location.coordinates[0], location.coordinates[1]])
  }

  getUserByEmail(email: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      -- UsersRepo.getUserByEmail
      ${GET_USERS_BY_EMAIL_QUERY}
      LIMIT 1
    `, [email]);
  }

  getAllUsersByEmail(email: string): Promise<DbUser[]> {
    return this.any(GET_USERS_BY_EMAIL_QUERY, [email]);
  }

  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<DbUser | null> {
    return this.oneOrNone(GET_USER_BY_USERNAME_OR_EMAIL_QUERY, [usernameOrEmail]);
  }

  async clearLoginTokens(userId: string): Promise<void> {
    await this.none(`
      -- UsersRepo.clearLoginTokens
      UPDATE "Users"
      SET services = jsonb_set(
        services,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId]);
    await this.refreshUserLoginTokens();
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.none(`
      -- UsersRepo.resetPassword
      UPDATE "Users"
      SET services = jsonb_set(
        CASE WHEN services -> 'password' IS NULL THEN
          jsonb_set(
            COALESCE(services, '{}'::JSONB),
            '{password}'::TEXT[],
            jsonb_build_object('bcrypt', $2),
            true
          )
        ELSE
          jsonb_set(
            services,
            '{password, bcrypt}'::TEXT[],
            to_jsonb($2::TEXT),
            true
          )
        END,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId, hashedPassword]);
    await this.refreshUserLoginTokens();
  }

  private async refreshUserLoginTokens() {
    await userLoginTokensView.refresh(this.getRawDb());
  }

  verifyEmail(userId: string): Promise<null> {
    return this.none(`
      -- UsersRepo.verifyEmail
      UPDATE "Users"
      SET emails[1] = jsonb_set(emails[1], '{verified}', 'true'::JSONB, true)
      WHERE _id = $1
    `, [userId]);
  }

  setExpandFrontpageSection(userId: string, section: string, expanded: boolean): Promise<null> {
    return this.none(`
      -- UsersRepo.setExpandFrontpageSection
      UPDATE "Users"
      SET "expandedFrontpageSections" =
        COALESCE("expandedFrontpageSections", '{}'::JSONB) ||
          fm_build_nested_jsonb(('{' || $2 || '}')::TEXT[], $3::JSONB)
      WHERE "_id" = $1
    `, [userId, section, String(expanded)]);
  }

  removeAlignmentGroupAndKarma(userId: string, reduceAFKarma: number): Promise<null> {
    return this.none(`
      -- UsersRepo.removeAlignmentGroupAndKarma
      UPDATE "Users"
      SET
        "groups" = array_remove("groups", 'alignmentVoters'),
        "afKarma" = "afKarma" - $2
      WHERE _id = $1
    `, [userId, reduceAFKarma]);
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        u."_id",
        u."_id" AS "objectID",
        u."username",
        u."displayName",
        u."createdAt",
        EXTRACT(EPOCH FROM u."createdAt") * 1000 AS "publicDateMs",
        COALESCE(u."isAdmin", FALSE) AS "isAdmin",
        COALESCE(u."deleted", FALSE) AS "deleted",
        COALESCE(u."deleteContent", FALSE) AS "deleteContent",
        COALESCE(u."hideFromPeopleDirectory", FALSE) AS "hideFromPeopleDirectory",
        u."profileImageId",
        u."biography"->>'html' AS "bio",
        u."howOthersCanHelpMe"->>'html' AS "howOthersCanHelpMe",
        u."howICanHelpOthers"->>'html' AS "howICanHelpOthers",
        COALESCE(u."karma", 0) AS "karma",
        COALESCE(u."commentCount", 0) AS "commentCount",
        u."slug",
        NULLIF(TRIM(u."jobTitle"), '') AS "jobTitle",
        NULLIF(TRIM(u."organization"), '') AS "organization",
        u."careerStage",
        NULLIF(TRIM(u."website"), '') AS "website",
        u."groups",
        u."groups" @> ARRAY['alignmentForum'] AS "af",
        (SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          '_id', t."_id",
          'slug', t."slug",
          'name', t."name"
        )) FROM "Tags" t WHERE
          t."_id" = ANY(u."profileTagIds") AND
          t."deleted" IS NOT TRUE
        ) AS "tags",
        (SELECT ARRAY_AGG(JSONB_BUILD_OBJECT(
          '_id', p."_id",
          'slug', p."slug",
          'title', p."title"
        ) ORDER BY p."baseScore" DESC) FROM "Posts" p WHERE
          p."userId" = u."_id" AND
          p."shortform" IS NOT TRUE AND
          ${getViewablePostsSelector("p")}
        ) AS "posts",
        NULLIF(JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
          'website', NULLIF(TRIM(u."website"), ''),
          'github', NULLIF(TRIM(u."githubProfileURL"), ''),
          'bluesky', NULLIF(TRIM(u."blueskyProfileURL"), ''),
          'twitter', NULLIF(TRIM(u."twitterProfileURL"), ''),
          'linkedin', NULLIF(TRIM(u."linkedinProfileURL"), ''),
          'facebook', NULLIF(TRIM(u."facebookProfileURL"), '')
        )), '{}') AS "socialMediaUrls",
        CASE WHEN u."mapLocation"->'geometry'->'location' IS NULL THEN NULL ELSE
          JSONB_BUILD_OBJECT(
            'type', 'point',
            'coordinates', JSONB_BUILD_ARRAY(
              u."mapLocation"->'geometry'->'location'->'lng',
              u."mapLocation"->'geometry'->'location'->'lat'
          )) END AS "_geoloc",
        u."mapLocation"->'formatted_address' AS "mapLocationAddress",
        u."profileUpdatedAt",
        (
          CASE WHEN u."profileImageId" IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."jobTitle" IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."organization" IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."biography"->>'html' IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."howOthersCanHelpMe"->>'html' IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."howICanHelpOthers"->>'html' IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."careerStage" IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."website" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."githubProfileURL" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."blueskyProfileURL" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."twitterProfileURL" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."linkedinProfileURL" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."facebookProfileURL" IS NULL THEN 0 ELSE 0.25 END +
          CASE WHEN u."mapLocation"->'geometry'->'location' IS NULL THEN 0 ELSE 1 END +
          CASE WHEN u."commentCount" < 1 THEN 0 ELSE 1 END +
          CASE WHEN u."postCount" < 1 THEN 0 ELSE 2 END +
          CASE WHEN u."karma" IS NULL OR u."karma" <= 0 THEN 0 ELSE 1 - 1 / u."karma" END * 100
        ) AS "profileCompletion",
        NOW() AS "exportedAt"
      FROM "Users" u
    `;
  }

  getSearchDocumentById(id: string): Promise<SearchUser> {
    return this.getRawDb().one(`
      -- UsersRepo.getSearchDocumentById
      ${this.getSearchDocumentQuery()}
      WHERE u."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<SearchUser[]> {
    return this.getRawDb().any(`
      -- UsersRepo.getSearchDocuments
      ${this.getSearchDocumentQuery()}
      WHERE u."displayName" IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`
      -- UsersRepo.countSearchDocuments
      SELECT COUNT(*) FROM "Users"
    `);
    return count;
  }
  
  async getRandomActiveUser(): Promise<DbUser> {
    return this.one(`
      -- UsersRepo.getRandomActiveUser
      SELECT u.*
      FROM "Users" u
      JOIN (
        SELECT "userId", MAX("lastUpdated") AS max_last_updated
        FROM "ReadStatuses"
        GROUP BY "userId"
      ) rs
      ON rs."userId" = u."_id"
      WHERE COALESCE(u."deleted", FALSE) = FALSE
      AND rs.max_last_updated > NOW() - INTERVAL '1 month'
      ORDER BY RANDOM()
      LIMIT 1;
    `);
  }
  
  async getRandomActiveAuthor(): Promise<DbUser> {
    return this.one(`
      -- UsersRepo.getRandomActiveAuthor
      SELECT u.*
      FROM "Users" u
      JOIN (
        SELECT "userId", MAX("createdAt") AS max_created_at
        FROM "Comments"
        GROUP BY "userId"
      ) c
      ON c."userId" = u."_id"
      JOIN (
        SELECT "userId", MAX("postedAt") AS max_posted_at
        FROM "Posts"
        GROUP BY "userId"
      ) p
      ON p."userId" = u."_id"
      WHERE COALESCE(u."deleted", FALSE) = FALSE
      AND (c.max_created_at > NOW() - INTERVAL '1 month' OR p.max_posted_at > NOW() - INTERVAL '1 month')
      ORDER BY RANDOM()
      LIMIT 1;
    `);
  }

  async getUsersWhoHaveMadeDialogues(): Promise<DbUser[]> {
    return this.getRawDb().any(`
      -- UsersRepo.getUsersWhoHaveMadeDialogues
      WITH all_dialogue_authors AS
        (SELECT (UNNESTED->>'userId') AS _id
            FROM "Posts" p, UNNEST("coauthorStatuses") unnested
            WHERE p."collabEditorDialogue" IS TRUE 
            AND p."draft" IS FALSE
        UNION
        SELECT p."userId" as _id
            FROM "Posts" p
            WHERE p."collabEditorDialogue" IS TRUE
            AND p."draft" IS FALSE
        )
      SELECT u.*
      FROM "Users" u
      INNER JOIN all_dialogue_authors ON all_dialogue_authors._id = u._id
    `)
  }

  async getUsersWhoHaveOptedInToDialogueFacilitation(): Promise<DbUser[]> {
    return this.getRawDb().any(`
        -- UsersRepo.getUsersWhoHaveOptedInToDialogueFacilitation
        SELECT *
        FROM "Users" u
        WHERE u."optedInToDialogueFacilitation" IS TRUE
    `)
  }  

  async getUsersWithNewDialogueChecks(): Promise<DbUser[]> {
    return this.manyOrNone(`
      -- UsersRepo.getUsersWithNewDialogueChecks
      SELECT DISTINCT ON ("Users"._id) "Users".*
      FROM "Users"
      INNER JOIN "DialogueChecks" ON "Users"._id = "DialogueChecks"."targetUserId"
      WHERE
          "DialogueChecks".checked IS TRUE
          AND NOT EXISTS (
              SELECT 1
              FROM "DialogueChecks" AS dc
              WHERE
                  "DialogueChecks"."userId" = dc."targetUserId"
                  AND "DialogueChecks"."targetUserId" = dc."userId"
                  AND dc.checked IS TRUE
          )
          AND (
              "DialogueChecks"."checkedAt" > COALESCE((
                  SELECT MAX("checkedAt")
                  FROM "DialogueChecks"
                  WHERE "DialogueChecks"."userId" = "Users"._id
              ), '1970-01-01')
          )
          AND (
              "DialogueChecks"."checkedAt" > NOW() - INTERVAL '1 week'
              OR
              NOT EXISTS (
                  SELECT 1
                  FROM "Notifications"
                  WHERE
                      "userId" = "Users"._id
                      AND type = 'newDialogueChecks'
              )
          )
          AND (
            NOW() - INTERVAL '1 week' > COALESCE((
              SELECT MAX("createdAt")
              FROM "Notifications"
              WHERE
                "userId" = "Users"._id
                AND type = 'newDialogueChecks'
            ), '1970-01-01')
        )
    `)
  }

  async getActiveDialogues(userIds: string[]): Promise<ActiveDialogueServer[]> {
    const result = await this.getRawDb().any(`
    SELECT
        p._id,
        p.title,
        p."userId",
        p."coauthorStatuses",
        ARRAY_AGG(DISTINCT s."userId") AS "activeUserIds",
        MAX(r."editedAt") AS "mostRecentEditedAt"
    FROM "Posts" AS p
    INNER JOIN "Revisions" AS r ON p._id = r."documentId"
    INNER JOIN "CkEditorUserSessions" AS s ON p._id = s."documentId",
        unnest(p."coauthorStatuses") AS coauthors
    WHERE
        (
            coauthors ->> 'userId' = any($1)
            OR p."userId" = any($1)
        )
        AND s."endedAt" IS NULL
        AND (
          s."createdAt" > CURRENT_TIMESTAMP - INTERVAL '30 minutes'
          OR r."editedAt" > CURRENT_TIMESTAMP - INTERVAL '30 minutes'
        )
    GROUP BY p._id
    `, [userIds]);
  
    return result;
  }

  async isDisplayNameTaken({ displayName, currentUserId }: { displayName: string; currentUserId: string; }): Promise<boolean> {
    const result = await this.getRawDb().one(`
      -- UsersRepo.isDisplayNameTaken
      SELECT COUNT(*) > 0 AS "isDisplayNameTaken"
      FROM "Users"
      WHERE "displayName" = $1 AND NOT "_id" = $2
    `, [displayName, currentUserId]);
    return result.isDisplayNameTaken;
  }
  
  /**
   * Returns a list of users who haven't read a post in over 4 months
   * and who we want to email a feedback survey to.
   *
   * This excludes admins, deleted/deactivated users,
   * flagged or purged or removed from queue users,
   * users who were banned any time over the past 4 month period,
   * and users who have already been sent this email.
   */
  async getInactiveUsersToEmail(limit: number): Promise<DbUser[]> {
    return this.manyOrNone(`
      -- UsersRepo.getInactiveUsersToEmail
      SELECT
        u.*
      FROM public."Users" AS u
      LEFT JOIN (
        SELECT "userId", MAX("lastUpdated") AS max_last_updated
        FROM "ReadStatuses"
        WHERE "isRead" IS TRUE
        GROUP BY "userId"
      ) AS rs ON u._id = rs."userId"
      WHERE
        u."inactiveSurveyEmailSentAt" IS NULL
        AND u."unsubscribeFromAll" IS NOT TRUE
        AND u."isAdmin" IS NOT TRUE
        AND u.deleted IS NOT TRUE
        AND u."deleteContent" IS NOT TRUE
        AND u."sunshineFlagged" IS NOT TRUE
        AND (
          u.banned IS NULL
          OR u.banned < CURRENT_TIMESTAMP - INTERVAL '4 months'
        )
        AND (
          u."reviewedByUserId" IS NOT NULL
          OR u."sunshineNotes" IS NULL
          OR u."sunshineNotes" = ''
        )
        AND (
          (
            rs.max_last_updated IS NULL
            AND u."createdAt" < CURRENT_TIMESTAMP - INTERVAL '4 months'
          )
          OR (
            rs.max_last_updated IS NOT NULL
            AND rs.max_last_updated < CURRENT_TIMESTAMP - INTERVAL '4 months'
          )
        )
      ORDER BY u."createdAt" desc
      LIMIT $1;
    `, [limit])
  }
  
   /**
   * Returns a list of users to whom we want to send an email
   * asking them to fill in the annual EA Forum user survey.
   *
   * This excludes deleted/deactivated users,
   * flagged or purged or removed from queue users,
   * users who unsubscribed from all site emails,
   * users who were banned any time over the past 6 month period,
   * users who have less than -10 karma,
   * users who haven't been to the site in the past 2 years,
   * and users who have already been sent this email.
   */
   async getUsersForUserSurveyEmail(limit: number): Promise<DbUser[]> {
    return this.manyOrNone(`
      -- UsersRepo.getUsersForUserSurveyEmail
      SELECT
        u.*
      FROM public."Users" AS u
      LEFT JOIN (
        SELECT "userId", MAX("lastUpdated") AS max_last_updated
        FROM "ReadStatuses"
        WHERE "isRead" IS TRUE
        GROUP BY "userId"
      ) AS rs ON u._id = rs."userId"
      WHERE
        u."userSurveyEmailSentAt" IS NULL
        AND u."unsubscribeFromAll" IS NOT TRUE
        AND u.deleted IS NOT TRUE
        AND u."deleteContent" IS NOT TRUE
        AND u."sunshineFlagged" IS NOT TRUE
        AND (
          u.banned IS NULL
          OR u.banned < CURRENT_TIMESTAMP - INTERVAL '6 months'
        )
        AND (
          u."reviewedByUserId" IS NOT NULL
          OR u."sunshineNotes" IS NULL
          OR u."sunshineNotes" = ''
        )
        AND u.karma >= -10
        AND (
          (
            rs.max_last_updated IS NULL
            AND u."createdAt" > CURRENT_TIMESTAMP - INTERVAL '2 years'
          )
          OR (
            rs.max_last_updated IS NOT NULL
            AND rs.max_last_updated > CURRENT_TIMESTAMP - INTERVAL '2 years'
          )
        )
      ORDER BY u."createdAt" desc
      LIMIT $1;
    `, [limit])
  }

  async searchFacets(facetFieldName: string, query: string): Promise<string[]> {
    const {name, pgField} = getFacetField(facetFieldName);
    const normalizedFacetField = name === "mapLocationAddress"
      ? `TRIM(${pgField})`
      : `INITCAP(TRIM(${pgField}))`;

    // If you change this query you may also need to update the indexes
    // created for `allowedFacetFields` in `facetFieldSearch.ts`
    const results = await this.getRawDb().any(`
      -- UsersRepo.searchFacets
      SELECT
        DISTINCT ${normalizedFacetField} AS "result",
        TS_RANK_CD(
          TO_TSVECTOR('english', ${pgField}),
          WEBSEARCH_TO_TSQUERY($1),
          1
        ) * 5 + COALESCE(SIMILARITY(${pgField}, $1), 0) AS "rank"
      FROM "Users"
      WHERE
        (
          TO_TSVECTOR('english', ${pgField}) @@ WEBSEARCH_TO_TSQUERY($1) OR
          COALESCE(SIMILARITY(${pgField}, $1), 0) > 0.22 OR
          ${pgField} ILIKE ($1 || '%')
        ) AND
        ${getDefaultFacetFieldSelector(pgField)}
      ORDER BY "rank" DESC, ${normalizedFacetField} DESC
      LIMIT $2
    `, [query, MULTISELECT_SUGGESTION_LIMIT]);

    return results.map(({result}) => result);
  }

  async getCurationSubscribedUserIds(): Promise<string[]> {
    const verifiedEmailFilter = !isEAForum ? 'AND fm_has_verified_email(emails)' : '';

    const userIdRecords = await this.getRawDb().any<Record<'_id', string>>(`
      SELECT _id
      FROM "Users"
      WHERE "emailSubscribedToCurated" IS TRUE
        AND "deleted" IS NOT TRUE
        AND "email" IS NOT NULL
        AND "unsubscribeFromAll" IS NOT TRUE
        ${verifiedEmailFilter}
    `);

    return userIdRecords.map(({ _id }) => _id);
  }
  async getAllUserPostIds(userId: string): Promise<string[]> {
    const results = await this.getRawDb().any(`
      SELECT "_id" FROM "Posts" WHERE "userId" = $1
    `, [userId]);
    return results.map(({_id}) => _id);
  }

  async getAllUserCommentIds(userId: string): Promise<string[]> {
    const results = await this.getRawDb().any(`
      SELECT "_id" FROM "Comments" WHERE "userId" = $1
    `, [userId]);
    return results.map(({_id}) => _id);
  }

  async getAllUserSequenceIds(userId: string): Promise<string[]> {
    const results = await this.getRawDb().any(`
      SELECT "_id" FROM "Sequences" WHERE "userId" = $1
    `, [userId]);
    return results.map(({_id}) => _id);
  }

  async getSubscriptionFeedSuggestedUsers(userId: string, limit: number): Promise<DbUser[]> {
    return this.any(`
      WITH existing_subscriptions AS (
        SELECT DISTINCT 
          "documentId" AS "userId"
        FROM "Subscriptions" s
        WHERE s.deleted IS NOT TRUE
          AND "collectionName" = 'Users'
          AND "type" = 'newActivityForFeed'
          AND "userId" = $1
      ),
      votes AS (
        SELECT
          "authorIds"[1] AS "authorId",
          power,
          "votedAt"
        FROM "Votes"
        WHERE
          "userId" = $1
          AND cancelled IS FALSE
          AND NOT ("authorIds" @> ARRAY["userId"])
        ORDER BY "votedAt"
      ),
      most_upvoted_authors AS (
        SELECT
          "authorId",
          SUM(power) AS summed_power
        FROM votes
        GROUP BY "authorId"
        ORDER BY summed_power DESC
      ),
      reads AS (
        SELECT
          "postId",
          "lastUpdated",
        p."userId" AS "authorId"
        FROM "ReadStatuses" rs
        JOIN "Posts" p ON p."_id" = rs."postId"
        WHERE 
          rs."userId" = $1
          AND "isRead" IS TRUE
      ),
      most_read_authors AS (
        SELECT
          "authorId",
          COUNT(*) AS posts_read
        FROM reads
        GROUP BY "authorId"
        ORDER BY COUNT(*) DESC
      )
      SELECT
        u.*
      FROM most_upvoted_authors
      FULL OUTER JOIN most_read_authors USING ("authorId")
      JOIN "Users" u ON u."_id" = "authorId"
      LEFT JOIN existing_subscriptions es ON es."userId" = "authorId"
      WHERE
          (u.banned IS NULL OR u.banned < current_date)
          AND "authorId" != $1
          AND es."userId" IS NULL
          AND u."deleted" IS NOT TRUE
      ORDER BY (
        COALESCE(summed_power*3, 0) + COALESCE(posts_read*2, 0)
      ) DESC NULLS LAST
      LIMIT $2
    `, [userId, limit]);
  }
}

recordPerfMetrics(UsersRepo, { excludeMethods: ['getUserByLoginToken', 'getActiveDialogues'] });

export default UsersRepo;
