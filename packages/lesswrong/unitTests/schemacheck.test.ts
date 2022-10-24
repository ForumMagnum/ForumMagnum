import path from "path";
import { makeMigrations } from "../server/scripts/makeMigrations";


describe('Schema check', () => {
  it('Has an accepted_schema.sql file which matches the schema defined in code', async () => {
    require('../server.ts');
    await makeMigrations({writeSchemaChangelog: true, writeAcceptedSchema: true, generateMigrations: false, rootPath: path.join(__dirname, "../../../")});
  }, 15000);
})
