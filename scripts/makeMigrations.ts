import { exec } from 'child_process';
import { readdir } from 'node:fs/promises'
import path from 'path';
import { promisify } from 'util';
import { migrationsPath } from '../packages/lesswrong/server/scripts/acceptMigrations';

/**
 * Entry point for `yarn makemigrations`
 *
 * This function is a simple wrapper around the `makeMigrations` script to provide some
 * feedback to the user (because it runs as a server script any log output it sent to the server stdout).
 * See `packages/lesswrong/server/scripts/makeMigrations.ts` for more complete documentation.
 * @returns
 */
const run = async () => {
  const rootPath = path.join(__dirname, "../")

  const migrationFilesBefore = (
    (await readdir(migrationsPath(rootPath), { withFileTypes: true }))
      .filter(dirent => dirent.isFile())
      .map(dirent => path.join(migrationsPath(rootPath), dirent.name))
  );
  
  const runExec = promisify(exec)
  console.log("Running makeMigrations script on server...");
  await runExec("./scripts/serverShellCommand.sh --wait \"Vulcan.makeMigrations({forumType: 'WakingUp'})\" > /dev/tty 2>&1")
  
  const migrationFilesAfter = (
    (await readdir(migrationsPath(rootPath), { withFileTypes: true }))
      .filter(dirent => dirent.isFile())
      .map(dirent => path.join(migrationsPath(rootPath), dirent.name))
  );

  const newMigrationFiles = migrationFilesAfter.filter(f => !migrationFilesBefore.includes(f));
  
  if (newMigrationFiles.length === 0) {
    console.log("No new migrations created");
    return
  }

  for (const newMigrationFile of newMigrationFiles) {
    console.log(`Created new migration: ${newMigrationFile}`);
    console.log(`Fill in this migration then run \`yarn acceptmigrations\``);
  }
}

void run();
