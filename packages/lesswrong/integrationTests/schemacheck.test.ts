import "./integrationTestSetup";
import { Vulcan } from "../lib/vulcan-lib";
import path from "path";

describe('SchemaCheck', () => {
  it('has an accepted_schema.sql file which matches the schema defined in code', async () => {
    Vulcan.makeMigrations({write: false, rootPath: path.join(__dirname, "../../../../")});
  });
});
