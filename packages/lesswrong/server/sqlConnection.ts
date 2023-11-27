import pgp, { IDatabase, IEventContext } from "pg-promise";
import type { IClient, IResult } from "pg-promise/typescript/pg-subset";
import Query from "../lib/sql/Query";
import { isAnyTest } from "../lib/executionEnvironment";
import { PublicInstanceSetting } from "../lib/instanceSettings";

const pgConnIdleTimeoutMsSetting = new PublicInstanceSetting<number>('pg.idleTimeoutMs', 10000, 'optional')

let vectorTypeOidPromise: Promise<number | null> | null = null;

const getVectorTypeOid = async (client: IClient): Promise<number | null> => {
  const result: IResult<{oid: number}> = await client.query(
    "SELECT oid FROM pg_type WHERE typname = 'vector'",
  );
  if (result.rowCount < 1) {
    // eslint-disable-next-line no-console
    console.warn("vector type not found in the database");
    return null;
  }
  return result.rows[0].oid;
}

export const pgPromiseLib = pgp({
  noWarnings: isAnyTest,
  connect: async ({client}) => {
    if (!vectorTypeOidPromise) {
      vectorTypeOidPromise = getVectorTypeOid(client);
    }
    const oid = await vectorTypeOidPromise;
    if (typeof oid === "number") {
      (client as AnyBecauseHard).setTypeParser(oid, "text", (value: string) => {
        return value.substring(1, value.length - 1).split(",").map((v) => parseFloat(v));
      });
    }
  },
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
    idleTimeoutMillis: pgConnIdleTimeoutMsSetting.get(),
  });

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

  return client;
}
