/* eslint-disable no-console */
import { format } from 'pg-formatter'; // FIXME this requires perl to be installed, make sure it's installed in CI
import { Vulcan, getCollection } from "../vulcan-lib";
import { getAllCollections } from "../../lib/vulcan-lib/getCollection";
import Table from "../../lib/sql/Table";
import CreateTableQuery from "../../lib/sql/CreateTableQuery";
import md5 from 'md5';
import { fs } from 'mz';
import path from 'path';
import { exec } from 'child_process';
import { acceptMigrations, migrationsPath } from './acceptMigrations';

const ROOT_PATH = path.join(__dirname, "../../../");
const acceptedSchemePath = (rootPath: string) => path.join(rootPath, "schema/accepted_schema.sql");
const schemaToAcceptPath = (rootPath: string) => path.join(rootPath, "schema/schema_to_accept.sql");

const migrationTemplateHeader = `/**
 * Generated on %TIMESTAMP% by \`yarn makemigrations\`
 * The following schema changes were detected:
`

const migrationTemplateFooter = `
 * (run \`git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql\` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment \`acceptsSchemaHash\` below
 * - [ ] Run \`yarn acceptmigrations\` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "%HASH%";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
`

const generateMigration = async ({
  acceptedSchemaFile, toAcceptSchemaFile, toAcceptHash, rootPath
}: {acceptedSchemaFile: string, toAcceptSchemaFile: string, toAcceptHash: string, rootPath: string
}) => {
  const execRun = (cmd) => {
    return new Promise((resolve, reject) => {
      // git diff exits with an error code if there are differences, ignore that and just always return stdout
      exec(cmd, (error, stdout, stderr) => resolve(stdout))
    })
  }
  
  // bit of a hack but using `git diff` for everything makes the changes easy to read
  const diff: string = await execRun(`git diff --no-index ${acceptedSchemaFile} ${toAcceptSchemaFile} --unified=1`) as string;
  const paddedDiff = diff.replace(/^/gm, ' * ');

  let contents = "";
  contents += migrationTemplateHeader.replace("%TIMESTAMP%", new Date().toISOString());
  contents += paddedDiff.length < 1500 ? paddedDiff : ` * ***Diff too large to display***`;
  contents += migrationTemplateFooter.replace("%HASH%", toAcceptHash);
  
  const fileTimestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
  const fileName = `${fileTimestamp}.auto.ts`;
  
  await fs.writeFile(path.join(migrationsPath(rootPath), fileName), contents);
}

/**
 *
 * @param collectionName
 * @returns {string} The SQL required to create the table for this collection
 */
const getCreateTableQueryForCollection = (collectionName: string): string => {
  const collection = getCollection(collectionName as any);
  if (!collection) throw new Error(`Invalid collection: ${collectionName}`);
  
  const table = Table.fromCollection(collection);
  const createTableQuery = new CreateTableQuery(table);
  const compiled = createTableQuery.compile();

  const sql = compiled.sql;
  const args = createTableQuery.compile().args;
  
  if (args.length) throw new Error(`Unexpected arguments: ${args}`);
  
  return sql;
}

/**
 * Update the `./schema/` files to match the current database schema, and generate a migration if there are changes which need to be accepted.
 *
 * Implementation details which may be useful to know:
 * This function (and `acceptMigrations`) generates a hash of the current schema (as defined in code) and uses it to maintain three files
 * in the `./schema` directory, `schema_changelog.json`, `accepted_schema.sql`, `schema_to_accept.sql`:
 * - `schema_changelog.json`: This is the file that actually determines whether the current schema is "accepted" or not.
 *   It contains a list of hashes of schema files that have been accepted. If the current schema hash is the most recent entry in this file, then the schema is accepted.
 * - `accepted_schema.sql`: This is a SQL view of the schema that has been accepted.
 * - `schema_to_accept.sql`: If the current schema is not accepted, this file will be generated to contain a SQL view of the "unaccepted" schema.
 *   This is useful for comparing against the accepted schema to see what changes need to be made in the migration that is generated. It is automatically deleted when the schema is accepted.
 *
 * @param {boolean} writeSchemaChangelog - If true, update the schema_changelog.json file before checking for changes
 * @param {boolean} writeAcceptedSchema - If true, update the `accepted_schema.sql` and `schema_to_accept.sql`
 * @param {boolean} generateMigrations - If true, generate a template migration file if the schema has changed
 * @param {boolean} rootPath - The root path of the project, this is annoying but required because this script is sometimes run from the server bundle, and sometimes from a test.
 */
export const makeMigrations = async ({
  writeSchemaChangelog=true, writeAcceptedSchema=true, generateMigrations=true, rootPath=ROOT_PATH
}: {writeSchemaChangelog: boolean, writeAcceptedSchema: boolean, generateMigrations: boolean, rootPath: string}) => {
  console.log(`=== Checking for schema changes ===`);
  // Get the most recent accepted schema hash from `schema_changelog.json`
  const {acceptsSchemaHash: acceptedHash, acceptedByMigration, timestamp} = await acceptMigrations({write: writeSchemaChangelog, rootPath});

  const currentHashes: Partial<Record<CollectionNameString, string>> = {};
  let schemaFileContents = "";

  // Sort collections by name, so that the order of the output is deterministic
  const collectionNames = getAllCollections().map(c => c.collectionName).sort();
  let failed: string[] = [];

  for (const collectionName of collectionNames) {
    try {
      const sql = getCreateTableQueryForCollection(collectionName);

      const hash = md5(sql.toLowerCase());
      currentHashes[collectionName] = hash;
      
      // Include the hash of every collection to make it easier to see what changed
      schemaFileContents += `-- Schema for "${collectionName}", hash: ${hash}\n`
      schemaFileContents += `${format(sql)}\n`;
    } catch (e) {
      console.error(`Failed to check schema for collection ${collectionName}`);
      failed.push(collectionName);
      console.error(e);
    }
  }

  if (failed.length) throw new Error(`Failed to generate schema for ${failed.length} collections: ${failed}`)
  
  const overallHash = md5(Object.values(currentHashes).sort().join());
  let schemaFileHeader = `-- Overall schema hash: ${overallHash}\n\n`;
  
  const toAcceptSchemaFile = schemaToAcceptPath(rootPath);
  const acceptedSchemaFile = acceptedSchemePath(rootPath);

  if (overallHash !== acceptedHash) {
    if (writeAcceptedSchema) {
      fs.writeFileSync(toAcceptSchemaFile, schemaFileHeader + schemaFileContents);
    }
    if (generateMigrations) {
      await generateMigration({acceptedSchemaFile, toAcceptSchemaFile, toAcceptHash: overallHash, rootPath});
    }
    throw new Error(`Schema has changed, write a migration to accept the new hash: ${overallHash}`);
  }

  if (writeAcceptedSchema) {
    schemaFileHeader = `-- Accepted on ${timestamp}${acceptedByMigration ? " by " + acceptedByMigration : ''}\n` + schemaFileHeader;
    await fs.writeFile(acceptedSchemaFile, schemaFileHeader + schemaFileContents);
    if (fs.existsSync(toAcceptSchemaFile)) {
      await fs.unlink(toAcceptSchemaFile);
    }
  }

  console.log("=== Done ===");
}

Vulcan.makeMigrations = makeMigrations;
