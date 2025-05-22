import Comments from "../collections/comments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "draft");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "draft");
}
