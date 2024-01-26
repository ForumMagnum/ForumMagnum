import { Vulcan } from "../vulcan-lib";
import { createSqlConnection } from "../sqlConnection";

/**
 * Delete all indexes on the PG database, so they can be rebuilt by the next server
 * restart. No effort is made to do this in a way that is compatible with keeping
 * the server running well - you almost certainly don't want to run this in prod, but
 * it's useful for debugging.
 */
export const deletePgIndexes = async () => {
  const sql = await createSqlConnection();
  const indexes = await sql.any(`
    SELECT
      indexname
    FROM
      pg_indexes
    WHERE
      tablename NOT LIKE 'pg_%'
      AND indexname NOT LIKE '%_pkey'
  `);
  for (const index of indexes) {
    const {indexname} = index;
    try {
      // eslint-disable-next-line no-console
      console.log(`Deleting index '${indexname}'`);
      await sql.none(`DROP INDEX "${indexname}"`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to delete index '${indexname}':`, e.message);
    }
  }
}

Vulcan.deletePgIndexes = deletePgIndexes;
