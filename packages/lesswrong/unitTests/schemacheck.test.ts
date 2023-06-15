import path from "path";
import { readFile } from "fs/promises";
import { makeMigrations } from "../server/scripts/makeMigrations";

const rootPath = path.join(__dirname, "../../../");

describe('Schema check', () => {
  it('Has an accepted_schema.sql file which matches the schema defined in code', async () => {
    require('../server.ts');
    await makeMigrations({
      writeSchemaChangelog: false,
      writeAcceptedSchema: true,
      generateMigrations: false,
      rootPath,
      forumType: "EAForum",
      silent: true,
    });
  });
  it('accpeted_schema.sql overall hash matches most recent changelog item', async () => {
    const acceptedSchemaPath = path.join(rootPath, "schema/accepted_schema.sql");
    const acceptedData = await readFile(acceptedSchemaPath);
    const acceptedHashSearch = /.*hash: (.*)/.exec(acceptedData.toString());
    const acceptedHash = acceptedHashSearch?.[1];

    const changeLogPath = path.join(rootPath, "schema/schema_changelog.json");
    const changeLogData = await readFile(changeLogPath);
    const changeLog = JSON.parse(changeLogData.toString());
    const changeLogHash = changeLog[changeLog.length - 1].acceptsSchemaHash;

    expect(acceptedHash).toBe(changeLogHash);
  });
});
