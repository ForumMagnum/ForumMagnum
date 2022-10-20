import { exec } from 'child_process';
import { fs } from 'mz';
import path from 'path';
import { promisify } from 'util';
import { migrationsPath } from '../packages/lesswrong/server/scripts/acceptMigrations';

const run = async () => {
  const rootPath = path.join(__dirname, "../")

  const migrationFilesBefore = (
    (await fs.readdir(migrationsPath(rootPath), { withFileTypes: true }))
      .filter(dirent => dirent.isFile())
      .map(dirent => path.join(migrationsPath(rootPath), dirent.name))
  );
  
  const runExec = promisify(exec)
  await runExec("./scripts/serverShellCommand.sh --wait \"Vulcan.makeMigrations({})\"")
  
  const migrationFilesAfter = (
    (await fs.readdir(migrationsPath(rootPath), { withFileTypes: true }))
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