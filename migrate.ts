/**
 * Usage: yarn migrate up|down|pending|executed [dev|local|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */

import type { ITask } from "pg-promise";

// @ts-ignore This is a javascript file without a .d.ts
import { startSshTunnel } from "./scripts/startup/buildUtil";
import { detectForumType, getDatabaseConfigFromModeAndForumType, getSettingsFileName, getSettingsFilePath, initGlobals, isEnvironmentType, normalizeEnvironmentType } from "./scripts/scriptUtil";
import { loadEnvConfig } from "@next/env";
import { runQueuedMigrationTasksSequentially } from "./packages/lesswrong/server/migrations/meta/migrationTaskQueue";

(async () => {
  const command = process.argv[2];
  if (isEnvironmentType(normalizeEnvironmentType(command))) {
    console.error("Please specify the command before the mode");
    process.exit(1);
  }
  const isRunCommand = ["up", "down"].includes(command);
  let mode = normalizeEnvironmentType(process.argv[3]);
  if (!["up", "down", "pending", "executed"].includes(command)) {
    mode = "dev";
  }

  const forumType = detectForumType();
  const forumTypeIsSpecified = forumType !== "none";
  console.log(`Running with forum type "${forumType}"`);

  loadEnvConfig(process.cwd());
  if (!process.env.ENV_NAME) {
    throw new Error("ENV_NAME is not set when loading .env config");
  }

  const envName = process.env.ENV_NAME;

  if (!envName.toLowerCase().includes(mode) && (mode === 'test' && !envName.toLowerCase().includes('dev'))) {
    throw new Error(`Tried to run REPL in mode ${mode} but ENV_NAME is ${process.env.ENV_NAME}`);
  }

  const dbConf = getDatabaseConfigFromModeAndForumType(mode, forumType);
  if (dbConf.postgresUrl) {
    process.env.PG_URL = dbConf.postgresUrl;
  }
  const args = {
    postgresUrl: process.env.PG_URL,
    settingsFileName: process.env.SETTINGS_FILE || getSettingsFileName(mode, forumType),
    shellMode: false,
  };

  await startSshTunnel(getDatabaseConfigFromModeAndForumType(mode, forumType).sshTunnelCommand);

  if (["dev", "local", "staging", "prod", "xpost"].includes(mode)) {
    console.log('Running migrations in mode', mode);
    args.settingsFileName = getSettingsFilePath(getSettingsFileName(mode, forumType), forumType);
    if (command !== "create") {
      process.argv = process.argv.slice(0, 3).concat(process.argv.slice(forumTypeIsSpecified ? 5 : 4));
    }
  } else if (args.postgresUrl && args.settingsFileName) {
    console.log('Using PG_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL and SETTINGS_FILE)');
  }

  initGlobals(args, mode==="prod");
  const { getSqlClientOrThrow, setSqlClient }: typeof import("./packages/lesswrong/server/sql/sqlClient") = require("./packages/lesswrong/server/sql/sqlClient");
  const { createSqlConnection }: typeof import("./packages/lesswrong/server/sqlConnection") = require("./packages/lesswrong/server/sqlConnection");

  if (isRunCommand) {
    const {initServer} = require("./packages/lesswrong/server/serverStartup");
    await initServer(args);
  }

  let exitCode = 0;

  const db = isRunCommand
    ? getSqlClientOrThrow()
    : await createSqlConnection(args.postgresUrl);

  try {
    await db.tx(async (transaction: ITask<{}>) => {
      setSqlClient(transaction as unknown as SqlClient, "read", process.env.PG_URL);
      setSqlClient(db, "noTransaction");
      const { createMigrator }  = require("./packages/lesswrong/server/migrations/meta/umzug");
      const migrator = await createMigrator(transaction, db);

      if (command === "create") {
        const name = process.argv[3];
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
