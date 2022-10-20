import "../integrationTests/integrationTestSetup";
import { Vulcan } from "../lib/vulcan-lib";

describe('SchemaCheck', () => {
  it('has an accepted_schema.sql file which matches the schema defined in code', async () => {
    Vulcan.checkSchema();
  });
});
