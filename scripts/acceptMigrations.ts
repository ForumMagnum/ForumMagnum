import path from "path";
import {acceptMigrations} from "../packages/lesswrong/server/scripts/acceptMigrations"
import { exec } from 'child_process';
import { promisify } from 'util';
import { fs } from "mz";

const run = async () => {
  await acceptMigrations({write: true, rootPath: path.join(__dirname, "../")});

  const runExec = promisify(exec)
  await runExec("./scripts/serverShellCommand.sh --wait \"Vulcan.makeMigrations({generateMigrations: false, writeSchemaChangelog: false, forumType: 'EAForum'})\"")

  if (fs.existsSync('./schema/schema_to_accept.sql')) {
    console.error("Error: Not all schema changes have been accepted.");
    process.exit(1);
  }
}

void run();
