import { MigrationParams, UmzugStorage } from "@centreforeffectivealtruism/umzug";

/**
 * We use umzug for orchestrating migrations which is agnostic to any particular
 * logging medium. This is a simple interface to store migration logs in a custom
 * `migration_log` table in Postgres.
 */
class PgStorage implements UmzugStorage<MigrationContext> {
  /**
   * Ensure the database is setup correctly - this should be called globally before
   * using any of the other methods
   */
  async setupEnvironment(db: SqlClient): Promise<void> {
    await db.none(`
      CREATE TABLE IF NOT EXISTS migration_log(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        hash TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        unlog_time TIMESTAMPTZ
      )
    `);
    await db.none(`
      CREATE INDEX IF NOT EXISTS idx_migration_log_name
      ON migration_log (name)
    `);
  }

  /**
   * Logs a migration to be considered as executed
   */
  async logMigration({name, context}: MigrationParams<MigrationContext>): Promise<void> {
    const {db, timers, hashes} = context;
    await db.none(`
      INSERT INTO migration_log (name, hash, start_time, end_time)
      VALUES ($1, $2, $3, $4)
    `, [name, hashes[name], timers[name]?.start, timers[name]?.end]);
  }

  /**
   * Logs a migration to be considered as pending (ie; not executed)
   */
  async unlogMigration({name, context}: MigrationParams<MigrationContext>): Promise<void> {
    const {db} = context;
    await db.none(`
      UPDATE migration_log
      SET unlog_time = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT id FROM migration_log
        WHERE name = $1 AND unlog_time IS NULL
        ORDER BY end_time DESC LIMIT 1
        FOR UPDATE
      )
    `, [name]);
  }

  /**
   * Gets a a list of already executed migrations
   */
  async executed({context}: Pick<MigrationParams<MigrationContext>, "context">): Promise<string[]> {
    const {db} = context;
    const result: {name: string}[] = await db.any(
      "SELECT name FROM migration_log WHERE unlog_time IS NULL ORDER BY name DESC",
    );
    return result.map(({name}) => name);
  }
}

export default PgStorage;
