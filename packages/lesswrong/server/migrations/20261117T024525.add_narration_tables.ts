import NarrationScripts from "../collections/narrationScripts/collection";
import NarrationSegments from "../collections/narrationSegments/collection";
import NarrationSegmentAudios from "../collections/narrationSegmentAudios/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, NarrationScripts);
  await createTable(db, NarrationSegments);
  await createTable(db, NarrationSegmentAudios);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, NarrationSegmentAudios);
  await dropTable(db, NarrationSegments);
  await dropTable(db, NarrationScripts);
}
