import Spotlights from "../../server/collections/spotlights/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "1907632649f70f5e77f6e6de79357d74";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "imageFadeColor");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "imageFadeColor");
}
