import { join } from "path";
import { readFile } from "fs/promises";
import pgp, { IDatabase } from "pg-promise";

const pgPromiseLib = pgp();

type Database = IDatabase<{}>;

const modes = ["dev", "prod", "staging", "testing", "xpost-dev"] as const;

type Mode = typeof modes[number];

type Settings = {
  databasePublicSettings: Record<string, any>;
  databaseServerSettings: Record<string, any>;
}

const isMode = (value: string): value is Mode =>
  modes.includes(value as Mode);

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const makeCredentialsPath = (fileName: string) =>
  join("..", "..", "ForumCredentials", fileName);

const readSettingsFile = (mode: Mode): Settings => {
  if (mode === "xpost-dev") {
    mode = "dev";
  }
  const path = makeCredentialsPath(`load${capitalize(mode)}DbSettings.js`);
  const data = require(path);
  if (!data.databasePublicSettings || !data.databaseServerSettings) {
    throw new Error("Malformed settings file");
  }
  return data;
}

const readPgUrl = async (mode: Mode) => {
  const path = makeCredentialsPath(`${mode}-pg-conn.txt`);
  const data = await readFile(path);
  const url = data.toString().trim();
  if (!url) {
    throw new Error(`Invalid Postgres URL: ${url}`);
  }
  return url;
}

const insert = (db: Database, id: string, name: string, data: Record<string, any>) =>
  db.none(`
    INSERT INTO "DatabaseMetadata" ("_id", "name", "value")
    VALUES ($1, $2, $3)
    ON CONFLICT (COALESCE("name", ''::text)) DO UPDATE SET "value" = $3
  `, [ id, name, data ]);

const deleteByName = (db: Database, name: string) =>
  db.none(`
    DELETE FROM "DatabaseMetadata"
    WHERE "name" = $1
  `, [ name ]);

(async () => {
  process.chdir(__dirname);

  (global as any).bundleIsServer = false;
  const { randomId } = require("../packages/lesswrong/lib/random");

  const mode = process.argv[2];
  if (!isMode(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  const settings = readSettingsFile(mode);
  const connectionString = await readPgUrl(mode);

  const db = pgPromiseLib({
    connectionString,
    max: 3,
  });

  await Promise.all([
    insert(db, randomId(), "publicSettings", settings.databasePublicSettings),
    insert(db, randomId(), "serverSettings", settings.databaseServerSettings),
    deleteByName(db, "databaseId"),
  ]);
})();
