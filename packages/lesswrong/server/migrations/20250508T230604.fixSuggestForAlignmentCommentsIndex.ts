import { updateIndexes } from "./meta/utils";
import Comments from "../collections/comments/collection";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
}
