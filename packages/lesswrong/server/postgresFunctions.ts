import { allUserProfileFields } from "./userProfileUpdates";

export type PostgresFunction = {
  /**
   * The SQL source of the function.
   */
  source: string,
  /**
   * Postgres supports function overloading, but we need unique names to
   * identify each function in the schema (including overloads). The `overload`
   * field can be used to add an overload-specific suffix for overloaded
   * functions, preventing naming collisions.
   */
  overload?: string,
  /**
   * List of dependencies that must be declared in the schema before this
   * function.
   */
  dependencies?: SchemaDependency[],
}

/**
 * List of the Postgres functions required to run ForumMagnum. After editing
 * this list you must run `makemigrations` to generate a new schema hash and a
 * migration in which you should call `updateFunctions`.
 */
export const postgresFunctions: PostgresFunction[] = [
  {
    // Build a nested JSON object from a path and a value - this is a dependency of
    // fm_add_to_set below
    source: `
      CREATE OR REPLACE FUNCTION fm_build_nested_jsonb(
        target_path TEXT[],
        terminal_element JSONB
      )
      RETURNS JSONB LANGUAGE sql IMMUTABLE AS
      'SELECT JSONB_BUILD_OBJECT(
        target_path[1],
        CASE
          WHEN CARDINALITY(target_path) = 1 THEN terminal_element
          ELSE fm_build_nested_jsonb(
            target_path[2:CARDINALITY(target_path)],
            terminal_element
          )
        END
      );'
    `,
  },
  {
    // Implement Mongo's $addToSet for native PG arrays
    source: `
      CREATE OR REPLACE FUNCTION fm_add_to_set(ANYARRAY, ANYELEMENT)
      RETURNS ANYARRAY LANGUAGE sql IMMUTABLE AS
     'SELECT CASE WHEN ARRAY_POSITION($1, $2) IS NULL THEN $1 || $2 ELSE $1 END;'
    `,
    overload: "native",
  },
  {
    // Implement Mongo's $addToSet for JSON fields - this requires a lot more work
    // than for native PG arrays...
    source: `
      CREATE OR REPLACE FUNCTION fm_add_to_set(
        base_field JSONB,
        target_path TEXT[],
        value_to_add ANYELEMENT
      )
      RETURNS JSONB LANGUAGE sql IMMUTABLE AS
     'SELECT CASE
      WHEN base_field #> target_path IS NULL
        THEN COALESCE(base_field, ''{}''::JSONB) || fm_build_nested_jsonb(
          target_path,
          JSONB_BUILD_ARRAY(value_to_add)
        )
      WHEN EXISTS (
        SELECT *
        FROM JSONB_ARRAY_ELEMENTS(base_field #> target_path) AS elem
        WHERE elem = TO_JSONB(value_to_add)
      )
        THEN base_field
      ELSE JSONB_INSERT(
        base_field,
        (SUBSTRING(target_path::TEXT FROM ''(.*)}.*$'') || '', -1}'')::TEXT[],
        TO_JSONB(value_to_add),
        TRUE
      )
      END;'
    `,
    overload: "json",
  },
  {
    // Calculate the similarity between the tags on two posts from 0 to 1, where
    // 0 is totally dissimilar and 1 is identical. The algorithm used here is a
    // weighted Jaccard index.
    source: `
      CREATE OR REPLACE FUNCTION fm_post_tag_similarity(
        post_id_a TEXT,
        post_id_b TEXT
      )
        RETURNS FLOAT LANGUAGE sql IMMUTABLE AS
       'SELECT
          COALESCE(SUM(LEAST(a, b))::FLOAT / SUM(GREATEST(a, b))::FLOAT, 0)
            AS similarity
        FROM (
          SELECT
            GREATEST((a."tagRelevance"->"tagId")::INTEGER, 0) AS a,
            GREATEST((b."tagRelevance"->"tagId")::INTEGER, 0) AS b
          FROM (
            SELECT JSONB_OBJECT_KEYS("tagRelevance") AS "tagId"
            FROM "Posts"
            WHERE "_id" IN (post_id_a, post_id_b)
          ) "allTags"
          JOIN "Posts" a ON a."_id" = post_id_a
          JOIN "Posts" b ON b."_id" = post_id_b
        ) "tagRelevance";'
    `,
  },
  {
    // Check if candidate is a subset of target, where both are of the type
    // Record<string, string>
    source: `
      CREATE OR REPLACE FUNCTION fm_jsonb_subset(target jsonb, candidate jsonb)
      RETURNS BOOLEAN AS $$
      DECLARE
        key text;
      BEGIN
        FOR key IN SELECT jsonb_object_keys(candidate)
        LOOP
          IF NOT (target ? key AND target->>key = candidate->>key) THEN
            RETURN FALSE;
          END IF;
        END LOOP;

        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql;
    `,
  },
  {
    // Extract an array of strings containing all of the tag ids that are
    // attached to a post. Only tags with a relevance score >= 1 are included.
    source: `
      CREATE OR REPLACE FUNCTION fm_post_tag_ids(post_id TEXT)
      RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS
     'SELECT ARRAY_AGG(tags."tagId")
      FROM "Posts" p
      JOIN (
        SELECT JSONB_OBJECT_KEYS("tagRelevance") AS "tagId"
        FROM "Posts"
        WHERE "_id" = post_id
      ) tags ON p."_id" = post_id
      WHERE (p."tagRelevance"->tags."tagId")::INTEGER >= 1;'
    `,
    dependencies: [{type: "collection", name: "Posts"}],
  },
  {
    // Compute a sortable score for a document based on the number of upvotes and
    // downvotes, with an optional downvote-weighting parameter. This is done with
    // a Wilson score interval:
    // https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval
    source: `
      CREATE OR REPLACE FUNCTION fm_confidence_sort(
        ups INTEGER,
        downs INTEGER,
        downvote_multiplier FLOAT DEFAULT 1
      ) RETURNS FLOAT LANGUAGE PLPGSQL IMMUTABLE AS $$
      DECLARE
        n INTEGER;
        z FLOAT;
        p FLOAT;
        l FLOAT;
        r float;
        u FLOAT;
      BEGIN
        n := ups + (downs * downvote_multiplier);
        IF n = 0 THEN
          RETURN n;
        END IF;
        z := 1.281551565545;
        p := ups::FLOAT / n::FLOAT;
        l := p + 1 / (2 * n) * z * z;
        r := z * SQRT(p * (1 - p) / n + z * z / (4 * n * n));
        u := 1 + 1 / n * z * z;
        RETURN (l - r) / u;
      END $$
    `,
  },
  {
    // Calculate a confidence sorting score (see above) for a comment.
    source: `
      CREATE OR REPLACE FUNCTION fm_comment_confidence(
        comment_id TEXT,
        downvote_multiplier FLOAT DEFAULT 1
      ) RETURNS FLOAT LANGUAGE sql AS $$
        SELECT
          fm_confidence_sort(
            COALESCE(
              SUM(v."power") FILTER
                (WHERE v."voteType" IN ('bigUpvote', 'smallUpvote')),
              0
            )::INTEGER,
            COALESCE(
              -SUM(v."power") FILTER
                (WHERE v."voteType" IN ('bigDownvote', 'smallDownvote')),
              0
            )::INTEGER,
            downvote_multiplier
          )
        FROM "Comments" c
        JOIN "Votes" v ON
          v."documentId" = c."_id" AND
          v."collectionName" = 'Comments' AND
          v."isUnvote" IS NOT TRUE AND
          v."cancelled" IS NOT TRUE AND
          v."extendedVoteType" IS NULL
        WHERE c."_id" = comment_id;
      $$
    `,
    dependencies: [{type: "collection", name: "Comments"}],
  },
  {
    // Returns true if the given vote added a specific emoji, false if the
    // given vote did not add that emoji, or null if the given vote does not
    // exist (currently only works for EA emojis)
    source: `
      CREATE OR REPLACE FUNCTION fm_vote_added_emoji(
        vote_id TEXT,
        emoji_name TEXT
      ) RETURNS BOOLEAN LANGUAGE sql AS $$
        SELECT
          COALESCE(target."extendedVoteType"->emoji_name = TO_JSONB(TRUE), FALSE) AND
          COALESCE(v."extendedVoteType"->emoji_name <> TO_JSONB(TRUE), TRUE)
        FROM "Votes" target
        LEFT JOIN "Votes" v ON
          v."votedAt" < target."votedAt" AND
          v."userId" = target."userId" AND
          v."documentId" = target."documentId" AND
          v."collectionName" = target."collectionName"
        WHERE
          target."_id" = vote_id
        ORDER BY v."votedAt" DESC
        LIMIT 1
      $$
    `,
    dependencies: [{type: "collection", name: "Votes"}],
  },
  {
    // Checks a user has a verified email, from their `emails`.
    source: `
      CREATE OR REPLACE FUNCTION fm_has_verified_email(emails jsonb[])
        RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
        DECLARE
          item jsonb;
        BEGIN
          FOR item IN SELECT unnest(emails)
          LOOP
            IF (item->>'verified')::boolean THEN
              RETURN true;
            END IF;
          END LOOP;
          RETURN false;
        END;
      $$
    `,
  },
  {
    // Fetches user by hashed login token. First attempts to read from the cached
    // version in the `UserLoginTokens` materialized view, otherwise falls back
    // to reading directly from the user object (which is slower).
    source: `
      CREATE OR REPLACE FUNCTION fm_get_user_by_login_token(hashed_token TEXT)
        RETURNS SETOF "Users" LANGUAGE plpgsql AS $$
        DECLARE
        BEGIN
          RETURN QUERY
            SELECT u.*
            FROM "Users" u
            JOIN "UserLoginTokens" lt ON lt."userId" = u."_id"
            WHERE lt."hashedToken" = hashed_token;
          IF (FOUND = FALSE) THEN
            RETURN QUERY
              SELECT *
              FROM "Users"
              WHERE "services"->'resume'->'loginTokens' @>
                ('[{"hashedToken": "' || hashed_token || '"}]')::JSONB;
          END IF;
        END
      $$
    `,
    dependencies: [
      {type: "collection", name: "Users"},
      {type: "view", name: "UserLoginTokens"},
    ],
  },
  {
    // Calculate the last date user updated their profile. This is very slow - you
    // should generally use the denormalized value in the user's `profileUpdatedAt`
    // field. This function is just used for updating that value.
    source: `
      CREATE OR REPLACE FUNCTION fm_get_user_profile_updated_at(userid TEXT)
        RETURNS TIMESTAMPTZ LANGUAGE sql AS $$
          SELECT COALESCE(
            (SELECT "createdAt"
            FROM (
              SELECT JSONB_OBJECT_KEYS("properties"->'after') AS "key", "createdAt"
              FROM "LWEvents"
              WHERE "documentId" = userid AND "name" = 'fieldChanges'
            ) q
            WHERE "key" IN (${allUserProfileFields.map((f) => `'${f}'`).join(", ")})
            ORDER BY "createdAt" DESC
            LIMIT 1),
            (SELECT "createdAt" FROM "Users" WHERE "_id" = userid),
            TO_TIMESTAMP(0)
          )
      $$
    `,
    dependencies: [{type: "collection", name: "LWEvents"}],
  },
];
