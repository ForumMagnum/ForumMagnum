import { exec } from "child_process";
import { readFile } from "node:fs/promises";
import path from "path";
import { promisify } from "util";
import type { ForumTypeString } from "../../lib/instanceSettings";
import { Globals } from "../vulcan-lib";
import { makeMigrations } from "./makeMigrations";

interface RebaseMigrationParams {
  migrationName: string;
  migrationFileName: string;
  rootPath?: string;
  forumType?: ForumTypeString;
}

const ROOT_PATH = path.join(__dirname, '../../../');

const rebaseMigration = async ({
  migrationName,
  migrationFileName,
  rootPath = ROOT_PATH,
  forumType
}: RebaseMigrationParams) => {
  const migrationFileContents = await readFile(migrationFileName, { encoding: 'utf8' });
  const fileLines = migrationFileContents.split('\n');
  const fileImports = fileLines.filter(line => line.startsWith('import '));
  const fileAcceptedSchemaHashLineIdx = fileLines.findIndex(line => line.startsWith('export const acceptsSchemaHash'));
  if (fileAcceptedSchemaHashLineIdx === -1) {
    throw new Error('No uncommented acceptedSchemaHash found in specified migration file.');
  }

  const fileLogic = fileLines.slice(fileAcceptedSchemaHashLineIdx + 1);
  
  const runExec = promisify(exec)

  // const acceptedSchemaPath = path.join(rootPath, 'schema/accepted_schema.sql');
  // const schemaChangelogPath = path.join(rootPath, 'schema/schema_changelog.json');
  
  // await runExec(`git restore --source origin/master ${acceptedSchemaPath}`);
  // await runExec(`git restore --source origin/master ${schemaChangelogPath}`);
  // await runExec(`git merge origin/master`);
  await runExec(`git rm ${migrationFileName}`);

  const rebasedMigration = {
    importLines: fileImports,
    logicLines: fileLogic,
    migrationName
  };

  await makeMigrations({ forumType, rebasedMigration })
};

Globals.rebaseMigration = rebaseMigration;