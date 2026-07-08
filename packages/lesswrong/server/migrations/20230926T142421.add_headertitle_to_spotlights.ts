import Spotlights from "../../server/collections/spotlights/collection"
import { StringType } from "../sql/Type";
import { addRemovedField, dropField } from "./meta/utils"

export const acceptsSchemaHash = "498e064c609716f4a0b3dd145dab50b2";

export const up = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await addRemovedField(db, Spotlights, "headerTitle", new StringType());
    await addRemovedField(db, Spotlights, "headerTitleLeftColor", new StringType());
    await addRemovedField(db, Spotlights, "headerTitleRightColor", new StringType());
  });
}

export const down = async ({db}: MigrationContext) => {
  await db.tx(async (db) => {
    await dropField(db, Spotlights, "headerTitle");
    await dropField(db, Spotlights, "headerTitleLeftColor");
    await dropField(db, Spotlights, "headerTitleRightColor");
  });
}
