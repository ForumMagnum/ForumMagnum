import { Umzug, memoryStorage } from "umzug";
import { readFileSync } from "fs";
import { createSqlConnection } from "../../sqlConnection";

declare global {
  interface MigrationContext {
    db: SqlClient;
  }
}

const root = "./packages/lesswrong/server/migrations";

export const createMigrator = async () => {
  const db = await createSqlConnection();

  return new Umzug({
    migrations: {
      glob: `${root}/*.ts`,
      resolve: ({name, path, context}) => {
        const migration = require(path!);
        return {
          name,
          up: () => migration.up(context),
          down: () => {
            throw new Error("Down migrations are not supported");
          },
        };
      },
    },
    context: {
      db,
    },
    storage: memoryStorage(),
    logger: console,
    create: {
      template: (filepath: string) => [
        [filepath, readFileSync(`${root}/meta/template.ts`).toString()],
      ],
      folder: root,
    },
  });
}
