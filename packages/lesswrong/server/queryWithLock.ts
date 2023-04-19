import md5 from "md5";

/**
 * pg_advisory_xact_lock takes a 64-bit integer as an argument. Generate this from the
 * query string to ensure that each query gets a unique lock key.
 */
const getLockKey = (query: string) => parseInt(md5(query), 16) / 1e20;

export const queryWithLock = (
  db: RawSqlClient,
  query: string,
  timeoutSeconds = 10,
) => {
  return db.tx(async (transaction) => {
    // Set advisory lock to ensure only one server runs each query at a time
    await transaction.any(`SET LOCAL lock_timeout = '${timeoutSeconds}s';`);
    await transaction.any(`SELECT pg_advisory_xact_lock(${getLockKey(query)});`);
    await transaction.any(query)
  })
}
