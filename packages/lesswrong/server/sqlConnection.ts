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
    concat: <T extends DbObject>(queries: Query<T>[]) => string;
  };
}

export const createSqlConnection = async (url?: string): Promise<SqlClient> => {
  url = url ?? process.env.PG_URL;
  if (!url) {
    throw new Error("PG_URL not configured");
  }

  const db = pgPromiseLib({
    connectionString: url,
    max: MAX_CONNECTIONS,
  });
  await db.none("SET default_toast_compression = lz4");
  try {
    await db.none("CREATE EXTENSION IF NOT EXISTS \"btree_gin\" CASCADE");
    await db.none("CREATE EXTENSION IF NOT EXISTS \"earthdistance\" CASCADE");
  } catch (e) {
    // eslint-disable-next-line
    console.error("Failed to create Postgres extensions:", e);
  }

  return {
    ...db,
    $pool: db.$pool, // $pool is accessed with magic and isn't copied by spreading
    concat: <T extends DbObject>(queries: Query<T>[]): string => {
      const compiled = queries.map((query) => {
        const {sql, args} = query.compile();
        return {query: sql, values: args};
      });
      return pgPromiseLib.helpers.concat(compiled);
    },
  };
}
