import { Umzug } from "umzug";
import { readFileSync } from "fs";
import { dirname, basename, join } from "path";
import { createHash } from "crypto";
import { createSqlConnection } from "../../sqlConnection";
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

const root = "./packages/lesswrong/server/migrations";

export const createMigrator = async () => {
  const db = await createSqlConnection();

  const storage = new PgStorage();
  await storage.setupEnvironment(db);

  return new Umzug({
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
}
