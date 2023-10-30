import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";

const GET_USERS_BY_EMAIL_QUERY = `
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

type UpvotedUser = {
  _id: string;
  username: string;
  displayName: string;
  total_power: number;
  power_values: string;
  vote_counts: number;
  total_agreement: number;
  agreement_values: string;
};

export type MongoNearLocation = { type: "Point", coordinates: number[] }
export default class UsersRepo extends AbstractRepo<DbUser> {
  constructor() {
    super(Users);
  }

  getUserByLoginToken(hashedToken: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      SELECT *
      FROM "Users"
      WHERE "services"->'resume'->'loginTokens' @> ('[{"hashedToken": "' || $1 || '"}]')::JSONB
    `, [hashedToken]);
  }
  
  getUsersWhereLocationIsInNotificationRadius(location: MongoNearLocation): Promise<Array<DbUser>> {
    // the notification radius is in miles, so we convert the EARTH_DISTANCE from meters to miles
    return this.any(`
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

  clearLoginTokens(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        services,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId]);
  }

  resetPassword(userId: string, hashedPassword: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        CASE WHEN services -> 'password' IS NULL THEN
          jsonb_set(
            services,
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
  }

  verifyEmail(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET emails[1] = jsonb_set(emails[1], '{verified}', 'true'::JSONB, true)
      WHERE _id = $1
    `, [userId]);
  }

  setExpandFrontpageSection(userId: string, section: string, expanded: boolean): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET "expandedFrontpageSections" =
        COALESCE("expandedFrontpageSections", '{}'::JSONB) ||
          fm_build_nested_jsonb(('{' || $2 || '}')::TEXT[], $3::JSONB)
      WHERE "_id" = $1
    `, [userId, section, String(expanded)]);
  }

  removeAlignmentGroupAndKarma(userId: string, reduceAFKarma: number): Promise<null> {
    return this.none(`
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
        u."profileImageId",
        u."biography"->>'html' AS "bio",
        u."howOthersCanHelpMe"->>'html' AS "howOthersCanHelpMe",
        u."howICanHelpOthers"->>'html' AS "howICanHelpOthers",
        COALESCE(u."karma", 0) AS "karma",
        u."slug",
        u."jobTitle",
        u."organization",
        u."careerStage",
        u."website",
        u."groups",
        u."groups" @> ARRAY['alignmentForum'] AS "af",
        u."profileTagIds" AS "tags",
        u."mapLocation"->'geometry'->'location' AS "_geoloc",
        u."mapLocation"->'formatted_address' AS "mapLocationAddress",
        NOW() AS "exportedAt"
      FROM "Users" u
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaUser> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE u."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaUser[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      WHERE u."displayName" IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Users"`);
    return count;
  }
  
  async getRandomActiveUser(): Promise<DbUser> {
    return this.one(`
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
    // return this.one(`SELECT * FROM "Users" WHERE _id = 'gXeEWGjTWyqgrQTzR'`
    // )
    return this.any(`SELECT "Users".*
      FROM "Users"
      INNER JOIN "Posts" ON "Users"._id = "Posts"."userId"
      WHERE "Posts"."collabEditorDialogue" = TRUE
    `)
  }

  

  async getUsersTopUpvotedUsers(userId:string): Promise<AnyBecauseTodo[]> {
    return this.getRawDb().any(
      `
      WITH "CombinedVotes" AS (
        -- Joining Users with Posts and Votes
        SELECT
            public."Users"._id,
            public."Users".username,
            public."Users"."displayName",
            public."Votes".power,
            CASE
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -6
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -2
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'neutral' THEN 0
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'smallUpvote' THEN 2
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'bigUpvote' THEN 6
                ELSE 0
            END AS agreement_value
        FROM public."Users"
        INNER JOIN public."Posts" ON public."Users"._id = public."Posts"."userId"
        INNER JOIN
            public."Votes"
            ON public."Posts"._id = public."Votes"."documentId"
        WHERE
            public."Votes"."userId" = '${userId}'
            AND public."Users"._id != '${userId}'
            AND public."Votes"."votedAt" > NOW() - INTERVAL '1.5 years'
    
        UNION ALL
    
        -- Joining Users with Comments and Votes
        SELECT
            public."Users"._id,
            public."Users".username,
            public."Users"."displayName",
            public."Votes".power,
            CASE
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -6
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -2
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'neutral' THEN 0
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'smallUpvote' THEN 2
                WHEN public."Votes"."extendedVoteType"->>'agreement' = 'bigUpvote' THEN 6
                ELSE 0
            END AS agreement_value
        FROM public."Users"
        INNER JOIN
            public."Comments"
            ON public."Users"._id = public."Comments"."userId"
        INNER JOIN
            public."Votes"
            ON public."Comments"._id = public."Votes"."documentId"
        WHERE
            public."Votes"."userId" = '${userId}'
            AND public."Users"._id != '${userId}'
            AND public."Votes"."votedAt" > NOW() - INTERVAL '1.5 years'
    )
    
    SELECT
        _id,
        username,
        "displayName",
        SUM(power) AS total_power,
        ARRAY_AGG(power) AS power_values,
        COUNT(power) AS vote_counts,
        SUM(agreement_value) AS total_agreement,
        ARRAY(
            SELECT val
            FROM UNNEST(ARRAY_AGG(agreement_value)) AS val
            WHERE val != 0
        ) AS agreement_values
    FROM "CombinedVotes"
    GROUP BY _id, username, "displayName"
    HAVING SUM(power) > 1
    ORDER BY total_power DESC
    LIMIT 50;
      `)
  }
  
  async getPreTopCommentersOfTopCommentedTags(topUsers: DbUser[], topCommentedTags: DbTag[]): Promise<any> {
    const topUserIds = topUsers.map(user => user._id);
    const topTagNames = topCommentedTags.map(tag => tag.name);
  
    // Use parameterized query to prevent SQL injection
    const query = `
      SELECT
        topCommentedTags.name,
        u.username,
        c."userId",
        COUNT(*) AS post_comment_count
      FROM unnest($1::text[]) AS topCommentedTags(name)
      INNER JOIN public."Tags" AS t ON topCommentedTags.name = t.name
      INNER JOIN public."TagRels" AS tr ON t._id = tr."tagId"
      INNER JOIN public."Comments" AS c ON tr."postId" = c."postId"
      INNER JOIN public."Users" AS u ON c."userId" = u._id
      WHERE c."userId" = ANY($2)
      GROUP BY topCommentedTags.name, c."userId", u.username
      HAVING COUNT(*) > 15
    `;
  
    try {
      return await this.any(query, [topTagNames, topUserIds]);
    } catch (error) {
      console.error('Error executing getAuthorsOfTopTags query:', error);
      throw error;
    }
  }

  async getTopCommentedTagsTopUsers(preTopCommentedTagTopUsers: any[], topUsers: any[]): Promise<any> {
    // Extract data from the preprocessed data
    const userData = preTopCommentedTagTopUsers.map(user => ({username: user.username, name: user.name, post_comment_count: user.post_comment_count}));
    const totalPowers = topUsers.map(user => ({username: user.username, total_power: user.total_power}));
  
    const query = `
      SELECT
        subquery.username,
        topUsers->>'total_power',
        json_object_agg(
          subquery.name,
          subquery.post_comment_count ORDER BY subquery.post_comment_count DESC
        ) AS tag_comment_counts
      FROM unnest($1::jsonb[]) AS subquery_json,
          jsonb_to_record(subquery_json) AS subquery(username TEXT, name TEXT, post_comment_count INTEGER)
      INNER JOIN unnest($2::jsonb[]) AS topUsers ON subquery.username = topUsers->>'username'
      GROUP BY subquery.username, topUsers->>'total_power'
      ORDER BY (topUsers->>'total_power')::integer DESC
    `;
  
    try {
      return await this.any(query, [userData, totalPowers]);
    } catch (error) {
      console.error('Error executing topCommentedTagTopUsers query:', error);
      throw error;
    }
  }
}
