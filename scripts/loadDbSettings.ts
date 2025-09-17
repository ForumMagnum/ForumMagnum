import { join } from "path";
import { readFile } from "fs/promises";
import pgp, { IDatabase } from "pg-promise";

const pgPromiseLib = pgp();

type Database = IDatabase<{}>;

const modes = ["dev", "prod", "staging", "testing", "xpost"] as const;

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

const readSettingsFile = (mode: Mode, settingsPath: string|undefined): Settings => {
  if (mode === "xpost") {
    mode = "dev";
  }
  // We are in root/scripts
  const path = settingsPath ? join('..', settingsPath) : makeCredentialsPath(`load${capitalize(mode)}DbSettings.js`);
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

const insert = async (db: Database, id: string, name: string, data: Record<string, any>) => {
  await db.none(`
    INSERT INTO "DatabaseMetadata" ("_id", "name", "value")
    VALUES ($1, $2, $3)
    ON CONFLICT (name) DO UPDATE SET "value" = $3
  `, [ id, name, data ]);
}

const setDatabaseId = async (db: Database, id: string, databaseId: string) => {
  await db.none(`
    INSERT INTO "DatabaseMetadata" ("_id", "name", "value")
    VALUES ($1, $2, TO_JSONB($3::TEXT))
    ON CONFLICT (name) DO UPDATE
    SET "value" = TO_JSONB($3::TEXT)
  `, [ id, "databaseId", databaseId ]);
}

const deleteByName = async (db: Database, name: string) => {
  await db.none(`
    DELETE FROM "DatabaseMetadata"
    WHERE "name" = $1
  `, [ name ]);
}

(async () => {
  process.chdir(__dirname);

  (global as any).bundleIsServer = false;
  const { randomId } = require("../packages/lesswrong/lib/random");

  const mode = process.argv[2];
  if (!isMode(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const settingsPath = process.argv[3] // optional

  const settings = readSettingsFile(mode, settingsPath);
  const connectionString = process.argv[4] ?? await readPgUrl(mode);

  const db = pgPromiseLib({
    connectionString,
    max: 3,
  });

  let databaseIdPromise: Promise<void>;
  if (mode === "prod") {
    databaseIdPromise = Promise.resolve();
  } else if (mode === "staging") {
    databaseIdPromise = setDatabaseId(db, randomId(), "ea-staging");
  } else if (mode === "dev") {
    databaseIdPromise = setDatabaseId(db, randomId(), "ea-dev");
  } else {
    databaseIdPromise = deleteByName(db, "databaseId");
  }

  await Promise.all([
    insert(db, randomId(), "publicSettings", settings.databasePublicSettings),
    insert(db, randomId(), "serverSettings", settings.databaseServerSettings),
    databaseIdPromise,
  ]);
})();
