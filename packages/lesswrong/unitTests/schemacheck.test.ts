import path from "path";
import { makeMigrations } from "../server/scripts/makeMigrations";


describe('Schema check', () => {
  it('Has an accepted_schema.sql file which matches the schema defined in code', async () => {
    // TODO: Reenable this test when we migrate the first collection to Postgres
    /*
    require('../server.ts');
    await makeMigrations({
      writeSchemaChangelog: false,
      writeAcceptedSchema: false,
      generateMigrations: false,
      rootPath: path.join(__dirname, "../../../"),
      forumType: "EAForum",
    });
    */
  }, 15000);
})
