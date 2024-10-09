/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */

import { existsSync } from "node:fs";
import type { ITask } from "pg-promise";

// @ts-ignore This is a javascript file without a .d.ts
import { getDatabaseConfig, startSshTunnel } from "./scripts/startup/buildUtil";

const initGlobals = (args: Record<string, unknown>, isProd: boolean) => {
  Object.assign(global, {
    bundleIsServer: true,
    bundleIsTest: false,
    bundleIsE2E: false,
    bundleIsProduction: isProd,
    bundleIsMigrations: true,
    defaultSiteAbsoluteUrl: "",
    serverPort: 5001,
    estrellaPid: -1,
  });

  const { getInstanceSettings } = require("./packages/lesswrong/lib/executionEnvironment");
  getInstanceSettings(args); // These args will be cached for later
}

const fetchImports = (args: Record<string, unknown>, isProd: boolean) => {
  initGlobals(args, isProd);

  const { getSqlClientOrThrow, setSqlClient } = require("./packages/lesswrong/server/sql/sqlClient");
  const { createSqlConnection } = require("./packages/lesswrong/server/sqlConnection");
  return { getSqlClientOrThrow, setSqlClient, createSqlConnection };
}

type ForumType = "lw" | "ea" | "none";

const detectForumType = async (): Promise<ForumType> => {
  const base = process.env.GITHUB_WORKSPACE ?? "..";
  if (existsSync(`${base}/LessWrong-Credentials`)) {
    return "lw";
  }
  if (existsSync(`${base}/ForumCredentials`)) {
    return "ea";
  }
  return "none";
}

const credentialsPath = (forumType: ForumType) => {
  const memorizedBases = {
    lw: "..",
    ea: "..",
    none: ".",
  };
  const base = process.env.GITHUB_WORKSPACE ?? memorizedBases[forumType];
  const memorizedRepoNames = {
    lw: '/LessWrong-Credentials',
    ea: '/ForumCredentials',
    none: "",
  };
  const repoName = memorizedRepoNames[forumType];
  return `${base}${repoName}`;
}

const settingsFilePath = (fileName: string, forumType: ForumType) => {
  return `${credentialsPath(forumType)}/${fileName}`;
}

type DatabaseConfig = {
  postgresUrl?: string,
  sshTunnelCommand?: string[],
}

const databaseConfig = (mode: string, forumType: ForumType): DatabaseConfig => {
  if (!mode) {
    return {};
  }
  const memorizedConfigPaths = {
    lw: {
      db: `${credentialsPath(forumType)}/connectionConfigs/${mode}.json`,
    },
    ea: {
      postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
    },
    none: {
      postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
    },
  };
  const configPath = memorizedConfigPaths[forumType];
  return getDatabaseConfig(configPath) as DatabaseConfig;
};

const settingsFileName = (mode: string, forumType: string) => {
  if (!mode) {
    // With the state of the code when this comment was written, this indicates
    // an error condition, but it will be handled later, around L60
    return '';
  }
  if (forumType === 'lw') {
    if (mode === 'prod') {
      return 'settings-production-lesswrong.json';
    }
    return 'settings-local-dev-devdb.json'
  }
  return `settings-${mode}.json`;
};

(async () => {
  const command = process.argv[2];
  if (["dev", "development", "staging", "production", "prod"].includes(command)) {
    console.error("Please specify the command before the mode");
    process.exit(1);
  }
  const isRunCommand = ["up", "down"].includes(command);

  let mode = process.argv[3];
  if (mode === "development") {
    mode = "dev";
  } else if (mode === "production") {
    mode = "prod";
  } else if (!["up", "down", "pending", "executed"].includes(command)) {
    mode = "dev";
  }

  const forumType = await detectForumType();
  const forumTypeIsSpecified = forumType !== "none";
  console.log(`Running with forum type "${forumType}"`);

  const dbConf = databaseConfig(mode, forumType);
  if (dbConf.postgresUrl) {
    process.env.PG_URL = dbConf.postgresUrl;
  }
  const args = {
    postgresUrl: process.env.PG_URL,
    settingsFileName: process.env.SETTINGS_FILE || settingsFileName(mode, forumType),
    shellMode: false,
  };

  await startSshTunnel(databaseConfig(mode, forumType).sshTunnelCommand);

  if (["dev", "staging", "prod", "xpost"].includes(mode)) {
    console.log('Running migrations in mode', mode);
    args.settingsFileName = settingsFilePath(settingsFileName(mode, forumType), forumType);
    if (command !== "create") {
      process.argv = process.argv.slice(0, 3).concat(process.argv.slice(forumTypeIsSpecified ? 5 : 4));
    }
  } else if (args.postgresUrl && args.settingsFileName) {
    console.log('Using PG_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL and SETTINGS_FILE)');
  }

  const { getSqlClientOrThrow, setSqlClient, createSqlConnection } = fetchImports(args, mode === "prod");

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
      setSqlClient(transaction);
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

  await db.$pool.end();
  process.exit(exitCode);
})();
