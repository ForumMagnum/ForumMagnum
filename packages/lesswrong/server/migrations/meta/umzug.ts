/* eslint-disable no-console */
/* eslint-disable import/no-dynamic-require */
import { Umzug } from "@centreforeffectivealtruism/umzug";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";
import { rename } from "node:fs/promises";
import * as readline from "node:readline/promises";
import PgStorage from "./PgStorage";
import { safeRun } from "../../manualMigrations/migrationUtils"

declare global {
  interface MigrationTimer {
    start: Date;
    end: Date;
  }

  interface MigrationContext {
    db: SqlClient;
    dbOutsideTransaction: SqlClient;
    timers: Record<string, Partial<MigrationTimer>>;
    hashes: Record<string, string>;
  }
}

const root = "./packages/lesswrong/server/migrations";

const migrationNameToDate = (name: string): Date => {
  const s = name.split(".")[0];
  if (s.length !== 15 || s[8] !== "T") {
    throw new Error(`Invalid migration name: '${s}'`);
  }
  if (name.match(/^.*\.auto\.ts$/)) {
    throw new Error(`You must rename the migration from 'auto' to something more recognizable: ${name}`);
  }
  const stamp = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}.000Z`;
  return new Date(stamp);
}

const migrationNameToTime = (name: string): number =>
  migrationNameToDate(name).getTime();

const createMigrationPrefix = () => new Date().toISOString().replace(/[-:]/g, "").split(".")[0];

const getLastMigration = async (storage: PgStorage, context: MigrationContext): Promise<string | undefined> => {
  // Make sure timers and hashes aren't written to here
  const executed = (await storage.executed({ context: { ...context, timers: {}, hashes: {} } })) ?? [];
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

export const createMigrator = async (dbInTransaction: SqlClient, dbOutsideTransaction: SqlClient) => {
  const storage = new PgStorage();
  await storage.setupEnvironment(dbInTransaction);

  const context: MigrationContext = {
    db: dbInTransaction,
    dbOutsideTransaction,
    timers: {},
    hashes: {},
  };

  const migrator = new Umzug({
    migrations: {
      glob: `${root}/*.ts`,
      resolve: ({name, path, context: ctx}) => {
        if (!path) {
          throw new Error("Missing migration path");
        }
        const code = readFileSync(path).toString();
        ctx.hashes[name] = createHash("md5").update(code).digest("hex");
        return {
          name,
          up: async () => {
            ctx.timers[name] = {start: new Date()};
            await safeRun(ctx.db, `remove_lowercase_views`) // Remove any views before we change the underlying tables
            const result = await require(path).up(ctx);
            await safeRun(ctx.db, `refresh_lowercase_views`) // add the views back in
            ctx.timers[name].end = new Date();
            return result;
          },
          down: async () => {
            const migration = require(path);
            if (migration.down) {
              await safeRun(ctx.db, `remove_lowercase_views`) // Remove any views before we change the underlying tables
              const result = await migration.down(ctx);
              await safeRun(ctx.db, `refresh_lowercase_views`) // add the views back in
              return result;
            } else {
              console.warn(`Migration '${name}' has no down step`);
            }
          },
        };
      },
    },
    context,
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

  const lastMigration = await getLastMigration(storage, context);
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
