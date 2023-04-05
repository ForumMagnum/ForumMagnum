import { generateAtlasSchema } from "../server/scripts/generateAtlasSchema";
import { readFile } from "fs/promises";

describe('Schema check', () => {
  it('Has an up-to-date atlas schema', async () => {
    require("../server");
    const committed = await readFile("./schema/atlas_schema.sql");
    const generated = generateAtlasSchema();
    expect(generated).toBe(committed.toString());
  });
});
