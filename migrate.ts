/**
 * Usage: yarn migrate up|down|pending|executed [dev|local|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */

import type { ITask } from "pg-promise";

import { initGlobals } from "./scripts/scriptUtil";
import { runQueuedMigrationTasksSequentially } from "./packages/lesswrong/server/migrations/meta/migrationTaskQueue";
import { loadMigrateEnv } from "./scripts/runWithVercelEnv";
import { initConsole } from "./packages/lesswrong/server/serverStartup";

(async () => {
  const migrateOptions = await loadMigrateEnv();
  const { environment, forumType, command } = migrateOptions;
  const isRunCommand = ["up", "down"].includes(command);

  const postgresUrl = process.env.PG_URL;

  initGlobals(environment === "prod");
  const { getSqlClientOrThrow, setSqlClient } = await import("./packages/lesswrong/server/sql/sqlClient");
  const { createSqlConnection } = await import("./packages/lesswrong/server/sqlConnection");

  if (isRunCommand) {
    initConsole();
  }

  let exitCode = 0;

  const db = isRunCommand
    ? getSqlClientOrThrow()
    : createSqlConnection(postgresUrl);

  // Remove the environment and forum type from the command line arguments,
  // so that umzug doesn't complain when we call `runAsCLI`
  process.argv = process.argv.filter(arg => arg !== environment && arg !== forumType);

  try {
    await db.tx(async (transaction: ITask<{}>) => {
      setSqlClient(transaction as unknown as SqlClient, "read", postgresUrl);
      setSqlClient(db, "noTransaction");
      const { createMigrator } = require("./packages/lesswrong/server/migrations/meta/umzug");
      const migrator = await createMigrator(transaction, db);

      if (command === "create") {
        const name = migrateOptions.name;
        if (!name) {
          throw new Error("No name provided for new migration");
        }
        console.log(`Creating new migration with name "${name}"`);
        await migrator.create({name});
      } else {
        const result = await migrator.runAsCLI();
        if (!result) {
          // If the migration throws an error it will have already been reported,
          // but we need to manually propagate it to the exitCode
          exitCode = 1;
        }
      }
    });
  } catch (e) {
    console.error("An error occurred while running migrations:", e);
    exitCode = 1;
  }

  // Wait for any migrations pushed into background tasks (generally indexes created concurrently) finish
  // before shutting down all the connections.
  await runQueuedMigrationTasksSequentially();

  await db.$pool.end();
  process.exit(exitCode);
})();
