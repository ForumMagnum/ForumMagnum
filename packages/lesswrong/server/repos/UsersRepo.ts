import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";
import { UpvotedUser } from "../../components/users/DialogueMatchingPage";
import { calculateVotePower } from "../../lib/voting/voteTypes";
import { ActiveDialogueServer } from "../../components/hooks/useUnreadNotifications";
import { recordPerfMetrics } from "./perfMetricWrapper";
import { isEAForum } from "../../lib/instanceSettings";
import { getPostgresViewByName } from "../postgresView";
import { getDefaultFacetFieldSelector, getFacetField } from "../search/facetFieldSearch";

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
    await getPostgresViewByName("UserLoginTokens").refresh(this.getRawDb());
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
      -- UsersRepo.getSearchDocumentQuery
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
        u."slug",
        NULLIF(TRIM(u."jobTitle"), '') AS "jobTitle",
        NULLIF(TRIM(u."organization"), '') AS "organization",
        u."careerStage",
        NULLIF(TRIM(u."website"), '') AS "website",
        u."groups",
        u."groups" @> ARRAY['alignmentForum'] AS "af",
        (SELECT jsonb_agg(jsonb_build_object('_id', _id, 'slug', slug, 'name', name)) FROM "Tags" WHERE _id = ANY(u."profileTagIds")) AS "tags",
        (SELECT ARRAY_AGG(name) FROM "Tags" WHERE _id = ANY(u."profileTagIds")) AS "tagNames",
        NULLIF(JSONB_STRIP_NULLS(JSONB_BUILD_OBJECT(
          'website', NULLIF(TRIM(u."website"), ''),
          'github', NULLIF(TRIM(u."githubProfileURL"), ''),
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

  async getUsersTopUpvotedUsers(user: DbUser, limit = 20, recencyLimitDays = 10): Promise<UpvotedUser[]> {
    const karma = user?.karma ?? 0
    const smallVotePower = calculateVotePower(karma, "smallUpvote");
    const bigVotePower = calculateVotePower(karma, "bigUpvote");
    
    return this.getRawDb().any(`
      -- UsersRepo.getUsersTopUpvotedUsers
      WITH "CombinedVotes" AS (
      -- Joining Users with Posts and Votes
      SELECT
          v.power AS vote_power,
          u._id AS user_id,
          u.username AS user_username,
          u."displayName" AS user_displayName,
          CASE
              WHEN v."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -$3
              WHEN v."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -$2
              WHEN v."extendedVoteType"->>'agreement' = 'neutral' THEN 0
              WHEN v."extendedVoteType"->>'agreement' = 'smallUpvote' THEN $2
              WHEN v."extendedVoteType"->>'agreement' = 'bigUpvote' THEN $3
              ELSE 0
          END AS agreement_value
        FROM "Users" u
        INNER JOIN "Posts" p ON u._id = p."userId"
        INNER JOIN "Votes" v ON p._id = v."documentId"
        WHERE
            v."userId" = $1
            AND u._id != $1
            AND v."votedAt" > NOW() - INTERVAL '1.5 years'
            AND v."cancelled" IS NOT TRUE

        UNION ALL
    
        -- Joining Users with Comments and Votes
        SELECT
            v.power AS vote_power,
            u._id AS user_id,
            u.username AS user_username,
            u."displayName" AS user_displayName,
            CASE
                WHEN v."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -$3
                WHEN v."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -$2
                WHEN v."extendedVoteType"->>'agreement' = 'neutral' THEN 0
                WHEN v."extendedVoteType"->>'agreement' = 'smallUpvote' THEN $2
                WHEN v."extendedVoteType"->>'agreement' = 'bigUpvote' THEN $3
                ELSE 0
            END AS agreement_value
        FROM "Users" u
        INNER JOIN "Comments" c ON u._id = c."userId"
        INNER JOIN "Votes" v ON c._id = v."documentId"
        WHERE
            v."userId" = $1
            AND u._id != $1
            AND v."votedAt" > NOW() - INTERVAL '1.5 years'
            AND v."cancelled" IS NOT TRUE
    ),

    "UserChecks" AS (
      SELECT
          u._id,
          COALESCE(
              EXISTS (
                  SELECT 1
                  FROM "DialogueChecks" as dc
                  WHERE
                      dc."userId" = u._id
                      AND "checkedAt" > NOW() - INTERVAL '$5 days'
              ),
              FALSE
          ) AS recently_active_matchmaking
      FROM "Users" as u
    )
  
    SELECT
      user_id AS _id,
      user_username AS username,
      user_displayName AS "displayName",
      SUM(vote_power) AS total_power,
      ARRAY_AGG(vote_power) AS power_values,
      COUNT(vote_power) AS vote_counts,
      SUM(agreement_value) AS total_agreement,
      ARRAY(
          SELECT val
          FROM UNNEST(ARRAY_AGG(agreement_value)) AS val
          WHERE val != 0
      ) AS agreement_values,
      uc.recently_active_matchmaking
    FROM "CombinedVotes" as cv
    LEFT JOIN "UserChecks" AS uc ON cv.user_id = uc._id
    GROUP BY 
      user_id, 
      user_username, 
      user_displayName,
      uc.recently_active_matchmaking
    HAVING SUM(vote_power) > 1
    ORDER BY total_power DESC
    LIMIT $4;
      `, [user._id, smallVotePower, bigVotePower, limit, recencyLimitDays])
  }

  async getDialogueMatchedUsers(userId: string): Promise<DbUser[]> {
    return this.any(`
      -- UsersRepo.getDialogueMatchedUsers
      SELECT DISTINCT(u.*)
      FROM "DialogueChecks" other_users_checks
      JOIN "DialogueChecks" current_user_checks
      -- Join such that there must exist reciprocal checks
      ON (
        other_users_checks."targetUserId" = current_user_checks."userId"
        AND current_user_checks."targetUserId" = other_users_checks."userId"
        AND other_users_checks.checked IS TRUE
        AND current_user_checks.checked IS TRUE
      )
      JOIN "Users" u
      -- Given those, join for users who've created checks on you
      ON (
        other_users_checks."userId" = u._id
        AND other_users_checks."targetUserId" = $1
        AND current_user_checks."userId" = $1
      )
    `, [userId]);
  }

  async getDialogueRecommendedUsers(userId: string, upvotedUsers: UpvotedUser[], limit = 100): Promise<DbUser[]> {
    const upvotedUserIds = upvotedUsers.map(user => user._id);

    return this.any(`
    -- UsersRepo.getDialogueRecommendedUsers
    (
      SELECT u.*
      FROM unnest($2::text[]) AS uv(_id)
      INNER JOIN "Users" AS u ON uv._id = u._id
      WHERE
      -- Exclude users that the current user has already checked

        (
          SELECT COUNT(*)
          FROM "DialogueChecks"
          WHERE "userId" = $1 AND "targetUserId" = uv._id AND ("checked" IS TRUE OR "hideInRecommendations" IS TRUE)
        ) = 0
        AND
        (
          -- Don't recommend users who've never commented on your posts

          (
            SELECT COUNT(*)
            FROM public."Comments" AS c
            INNER JOIN "Posts" AS p ON c."postId" = p._id
            WHERE c."userId" = uv._id AND p."userId" = $1
          ) >= 1
          OR 
          -- Don't recommend users who've never replied to your comments 

          (
            SELECT COUNT(*)
            FROM public."Comments"
            WHERE
              "userId" = uv._id
              AND "parentCommentId" IN (
                SELECT _id
                FROM "Comments"
                WHERE "userId" = $1
              )
          ) >= 1
        )
      LIMIT $3
    )
    -- If the above query doesn't return enough users, then fill in the rest with users who you've upvoted
      UNION
      (
        SELECT u.*
        FROM unnest($2::text[]) AS uv(_id)
        INNER JOIN "Users" AS u ON uv._id = u._id
        WHERE
          (
            SELECT COUNT(*)
            FROM "DialogueChecks"
            WHERE "userId" = $1 AND "targetUserId" = uv._id AND ("checked" IS TRUE OR "hideInRecommendations" IS TRUE)
          ) = 0
        LIMIT $3
      )
    `, [userId, upvotedUserIds, limit]);
  }

  async getActiveDialogueMatchSeekers(limit: number): Promise<DbUser[]> {
    return this.manyOrNone(`
      -- UsersRepo.getActiveDialogueMatchSeekers
      SELECT  
        u.*,
        MAX(dc."checkedAt") AS "mostRecentCheckedAt"
      FROM public."Users" AS u
      LEFT JOIN public."DialogueChecks" AS dc ON u._id = dc."userId"
      WHERE dc."userId" IS NOT NULL
      GROUP BY u._id
      ORDER BY "mostRecentCheckedAt" DESC
      LIMIT $1;
    `, [limit])
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
      LIMIT 8
    `, [query]);

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
