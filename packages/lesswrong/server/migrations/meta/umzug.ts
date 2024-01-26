/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
import { Umzug } from "@centreforeffectivealtruism/umzug";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";
import { rename } from "node:fs/promises";
import * as readline from "node:readline/promises";
import PgStorage from "./PgStorage";
import { migrationNameToTime } from "../../scripts/acceptMigrations";
import { safeRun } from "../../manualMigrations/migrationUtils"

declare global {
  interface MigrationTimer {
    start: Date;
    end: Date;
  }

  interface MigrationContext {
    db: SqlClient;
    timers: Record<string, Partial<MigrationTimer>>;
    hashes: Record<string, string>;
  }
}

const root = "./packages/lesswrong/server/migrations";

const createMigrationPrefix = () => new Date().toISOString().replace(/[-:]/g, "").split(".")[0];

const getLastMigration = async (storage: PgStorage, db: SqlClient): Promise<string | undefined> => {
  const context = {db, timers: {}, hashes: {}};
  const executed = await storage.executed({context}) ?? [];
  return executed[0];
}

const reportOutOfOrderRun = async (lastMigrationName: string, currentMigrationName: string) => {
  if (process.env.FORUM_MAGNUM_MIGRATE_CI) {
    throw new Error("Aborting due to out-of-order migration run");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\nWarning: Out-of-order migrations detected");
  console.log(`Trying to run '${currentMigrationName}' after '${lastMigrationName}'`);

  try {
    const response = await rl.question("\nDo you want to automatically update the migration date? [n] [y] [force]: ");
    const strategy = response.toLowerCase();
    if (["y", "yes"].includes(strategy)) {
      const tokens = currentMigrationName.split(".");
      tokens[0] = createMigrationPrefix();
      const newName = tokens.join(".");
      const oldPath = resolve(root, currentMigrationName);
      const newPath = resolve(root, newName);
      await rename(oldPath, newPath);
      console.log(`\nMigration renamed to '${newName}' - rerun your last command to try again`);
      process.exit(0);
    } else if (strategy === "force") {
      // Do nothing - let the migration run continue
    } else { // Default to 'no'
      throw new Error("Aborting due to out-of-order migration run");
    }
  } finally {
    rl.close();
  }
}

export const createMigrator = async (db: SqlClient) => {
  const storage = new PgStorage();
  await storage.setupEnvironment(db);

  const migrator = new Umzug({
    migrations: {
      glob: `${root}/*.ts`,
      resolve: ({name, path, context}) => {
        if (!path) {
          throw new Error("Missing migration path");
        }
        const code = readFileSync(path).toString();
        context.hashes[name] = createHash("md5").update(code).digest("hex");
        return {
          name,
          up: async () => {
            context.timers[name] = {start: new Date()};
            await safeRun(context.db, `remove_lowercase_views`) // Remove any views before we change the underlying tables
            const result = await require(path).up(context);
            await safeRun(context.db, `refresh_lowercase_views`) // add the views back in
            context.timers[name].end = new Date();
            return result;
          },
          down: async () => {
            const migration = require(path);
            if (migration.down) {
              await safeRun(context.db, `remove_lowercase_views`) // Remove any views before we change the underlying tables
              const result = await migration.down(context);
              await safeRun(context.db, `refresh_lowercase_views`) // add the views back in
              return result;
            } else {
              console.warn(`Migration '${name}' has no down step`);
            }
          },
        };
      },
    },
    context: {
      db,
      timers: {},
      hashes: {},
    },
    storage,
    logger: console,
    create: {
      prefix: createMigrationPrefix,
      template: (filepath: string) => [
        [`${filepath}.ts`, readFileSync(resolve(root, "meta/template.ts")).toString()],
      ],
      folder: root,
    },
  });

  const lastMigration = await getLastMigration(storage, db);
  if (lastMigration) {
    const lastMigrationTime = migrationNameToTime(lastMigration);
    migrator.on("migrating", async ({name}) => {
      const time = migrationNameToTime(name);
      if (time < lastMigrationTime) {
        await reportOutOfOrderRun(lastMigration, name);
      }
    });
  }

  return migrator;
}
