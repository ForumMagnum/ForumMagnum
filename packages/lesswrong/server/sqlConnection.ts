import pgp, { IDatabase, IEventContext } from "pg-promise";
import Query from "../lib/sql/Query";
import { isAnyTest } from "../lib/executionEnvironment";
import { queryWithLock } from "./queryWithLock";

const pgPromiseLib = pgp({
  pgNative: true,
  noWarnings: isAnyTest,
  error: (err, ctx) => {
    // If it's a syntax error, print the bad query for debugging
    if (typeof err.code === "string" && err.code.startsWith("42")) {
      // eslint-disable-next-line no-console
      console.error("SQL syntax error:", err.message, ctx.query);
    }
  },
  // Uncomment to log executed queries for debugging, etc.
  // query: (context: IEventContext) => {
    // console.log("SQL:", context.query);
  // },
});

/**
 * The postgres default for max_connections is 100 - you can view the current setting
 * with `show max_connections`. When increasing max_connections, you also need to increase
 * shared_buffers and kernel.shmmax. Typical values are anything up to ~1/4 of the system
 * memory for shared_buffers, and slightly more than this for kernel.shmmax.
 *
 * max_connections and shared_buffers are located in /var/lib/pgsql/{version_number}/data/postgresql.conf
 * kernel.shmmax is in /etc/sysctl.conf
 *
 * AWS RDS automatically sets sensible defaults based on the instance size.
 *
 * Make sure you take into account that this is per server instance (so 4 instances of 25
 * connections will hit a limit of 100), and you probably want to leave a couple free
 * for connecting extenal clients for debugging/testing/migrations/etc.
 */
const MAX_CONNECTIONS = parseInt(process.env.PG_MAX_CONNECTIONS ?? "25");

declare global {
  type RawSqlClient = IDatabase<{}>;
  type SqlClient = RawSqlClient & {
    // We can't use `T extends DbObject` here because DbObject isn't available to the
    // migration bootstrapping code - `any` will do for now
    concat: (queries: Query<any>[]) => string;
    isTestingClient: boolean;
  };
}

/**
 * When a new database connection is created we run these queries to
 * ensure the environment is setup correctly. The order in which they
 * are run is undefined.
 */
const onConnectQueries: string[] = [
  // The default TOAST compression in PG uses pglz - here we switch to lz4 which
  // uses slightly more disk space in exchange for _much_ faster compression and
  // decompression times
  `SET default_toast_compression = lz4`,
  // Enable to btree_gin extension - this allows us to use a lot of BTREE operators
  // with GIN indexes that otherwise wouldn't work
  `CREATE EXTENSION IF NOT EXISTS "btree_gin" CASCADE`,
  // Enable the earthdistance extension - this is used for finding nearby events
  `CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE`,
  // Enable the intarray extension - this is used for collab filtering recommendations
  `CREATE EXTENSION IF NOT EXISTS "intarray" CASCADE`,
  // Build a nested JSON object from a path and a value - this is a dependency of
  // fm_add_to_set below
  `CREATE OR REPLACE FUNCTION fm_build_nested_jsonb(
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
  // Implement Mongo's $addToSet for native PG arrays
  `CREATE OR REPLACE FUNCTION fm_add_to_set(ANYARRAY, ANYELEMENT)
    RETURNS ANYARRAY LANGUAGE sql IMMUTABLE AS
   'SELECT CASE WHEN ARRAY_POSITION($1, $2) IS NULL THEN $1 || $2 ELSE $1 END;'
  `,
  // Implement Mongo's $addToSet for JSON fields - this requires a lot more work
  // than for native PG arrays...
  `CREATE OR REPLACE FUNCTION fm_add_to_set(
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
  // Calculate the similarity between the tags on two posts from 0 to 1, where 0 is
  // totally dissimilar and 1 is identical. The algorithm used here is a weighted
  // Jaccard index.
  `CREATE OR REPLACE FUNCTION fm_post_tag_similarity(
    post_id_a TEXT,
    post_id_b TEXT
  )
    RETURNS FLOAT LANGUAGE sql IMMUTABLE AS
   'SELECT
      COALESCE(SUM(LEAST(a, b))::FLOAT / SUM(GREATEST(a, b))::FLOAT, 0) AS similarity
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
];

export const createSqlConnection = async (
  url?: string,
  isTestingClient = false,
): Promise<SqlClient> => {
  url = url ?? process.env.PG_URL;
  if (!url) {
    throw new Error("PG_URL not configured");
  }

  const db = pgPromiseLib({
    connectionString: url,
    max: MAX_CONNECTIONS,
  });
  
  // eslint-disable-next-line no-console
  console.log(`Connecting to postgres with a connection-pool max size of ${MAX_CONNECTIONS}`);

  const client: SqlClient = {
    ...db,
    $pool: db.$pool, // $pool is accessed with magic and isn't copied by spreading
    concat: (queries: Query<any>[]): string => {
      const compiled = queries.map((query) => {
        const {sql, args} = query.compile();
        return {query: sql, values: args};
      });
      return pgPromiseLib.helpers.concat(compiled);
    },
    isTestingClient,
  };

  try {
    await Promise.all(onConnectQueries.map((query) => queryWithLock(client, query)));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to run Postgres onConnectQuery:", e);
  }

  return client;
}
