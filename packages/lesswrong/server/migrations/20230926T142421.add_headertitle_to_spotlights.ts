import Spotlights from "../../server/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "498e064c609716f4a0b3dd145dab50b2";

export const up = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await addField(db, Spotlights, "headerTitle");
    await addField(db, Spotlights, "headerTitleLeftColor");
    await addField(db, Spotlights, "headerTitleRightColor");
  });
}

export const down = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await dropField(db, Spotlights, "headerTitle");
    await dropField(db, Spotlights, "headerTitleLeftColor");
    await dropField(db, Spotlights, "headerTitleRightColor");
  });
}
