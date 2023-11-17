import md5 from "md5";

/**
 * pg_advisory_xact_lock takes a 64-bit integer as an argument. Generate this from the
 * query string to ensure that each query gets a unique lock key.
 */
const getLockKey = (query: string) => parseInt(md5(query), 16) / 1e20;

export const queryWithLock = (
  db: SqlClient,
  query: string,
  timeoutSeconds = 10,
) => {
  return db.tx(async (transaction) => {
    if (db.isTestingClient) {
      // When creating testing databases we create the tables _after_ running the
      // `onConnectQueries` which is a problem because some of the functions need
      // to reference tables that don't exist yet. This tells Postgres to chill
      // out - everything will be fine.
      await transaction.none("SET LOCAL check_function_bodies TO FALSE;");
    }
    // Set advisory lock to ensure only one server runs each query at a time
    await transaction.none(`SET LOCAL lock_timeout = '${timeoutSeconds}s';`);
    await transaction.one(`SELECT pg_advisory_xact_lock(${getLockKey(query)});`);
    await transaction.any(query);
  })
}
