import { Umzug } from "@centreforeffectivealtruism/umzug";
import { readFileSync } from "fs";
import { createHash } from "crypto";
import PgStorage from "./PgStorage";

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

const migrationNameToTime = (name: string): number => {
  const s = name.split(".")[0];
  if (s.length !== 15 || s[8] !== "T") {
    throw new Error(`Invalid migration name: '${s}'`);
  }
  const stamp = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}.000Z`;
  return new Date(stamp).getTime();
}

const getLastMigration = async (storage: PgStorage, db: SqlClient): Promise<string | undefined> => {
  const context = {db, timers: {}, hashes: {}};
  const executed = await storage.executed({context}) ?? [];
  return executed[0];
}

const reportOutOfOrderRun = (lastMigrationName: string, currentMigrationName: string) => {
  console.log("Warning: Out-of-order migrations detected");
  console.log(`Trying to run '${currentMigrationName}' after '${lastMigrationName}'`);
}

const root = "./packages/lesswrong/server/migrations";

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
            // eslint-disable-next-line import/no-dynamic-require
            const result = await require(path).up(context);
            context.timers[name].end = new Date();
            return result;
          },
          down: () => {
            // eslint-disable-next-line import/no-dynamic-require
            const migration = require(path);
            if (migration.down) {
              return migration.down(context);
            } else {
              // eslint-disable-next-line no-console
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
      prefix: () => new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
      template: (filepath: string) => [
        [`${filepath}.ts`, readFileSync(`${root}/meta/template.ts`).toString()],
      ],
      folder: root,
    },
  });

  const lastMigration = await getLastMigration(storage, db);
  if (lastMigration) {
    const lastMigrationTime = migrationNameToTime(lastMigration);
    migrator.on("migrating", ({name}) => {
      const time = migrationNameToTime(name);
      if (time < lastMigrationTime) {
        reportOutOfOrderRun(lastMigration, name);
        throw new Error("Aborting due to out-of-order run");
      }
    });
  }

  return migrator;
}
