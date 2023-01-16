import pgp, { IDatabase, IEventContext } from "pg-promise";
import Query from "../lib/sql/Query";

const pgPromiseLib = pgp({
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
  type SqlClient = IDatabase<{}> & {
    // We can't use `T extends DbObject` here because DbObject isn't available to the
    // migration bootstrapping code - `any` will do for now
    concat: (queries: Query<any>[]) => string;
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
  // Implement Mongo's $addToSet for native PG arrays
  `CREATE OR REPLACE FUNCTION fm_add_to_set(ANYARRAY, ANYELEMENT)
    RETURNS ANYARRAY LANGUAGE sql IMMUTABLE AS
   'SELECT CASE WHEN ARRAY_POSITION($1, $2) IS NULL THEN $1 || $2 ELSE $1 END;'
  `,
  // Implement Mongo's $addToSet for JSON fields - this requires a lot more work
  // than for native PG arrays
  `CREATE OR REPLACE FUNCTION fm_add_to_set(
    base_field JSONB,
    target_path TEXT[],
    value JSONB
  )
    RETURNS JSONB LANGUAGE sql IMMUTABLE AS
   'SELECT CASE WHEN EXISTS (
      SELECT *
      FROM JSONB_ARRAY_ELEMENTS(base_field #> target_path) AS elem
      WHERE elem = value
    )
    THEN base_field
    ELSE JSONB_INSERT(
      base_field,
      (SUBSTRING(target_path::TEXT FROM ''(.*)\}.*$'') || '', -1}'')::TEXT[],
      value,
      TRUE
    )
    END;'
  `,
];

export const createSqlConnection = async (url?: string): Promise<SqlClient> => {
  url = url ?? process.env.PG_URL;
  if (!url) {
    throw new Error("PG_URL not configured");
  }

  const db = pgPromiseLib({
    connectionString: url,
    max: MAX_CONNECTIONS,
  });

  try {
    await Promise.all(onConnectQueries.map((query) => db.any(query)));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to run Postgres onConnectQuery:", e);
  }

  return {
    ...db,
    $pool: db.$pool, // $pool is accessed with magic and isn't copied by spreading
    concat: (queries: Query<any>[]): string => {
      const compiled = queries.map((query) => {
        const {sql, args} = query.compile();
        return {query: sql, values: args};
      });
      return pgPromiseLib.helpers.concat(compiled);
    },
  };
}
