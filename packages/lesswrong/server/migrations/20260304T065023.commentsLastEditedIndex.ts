import Comments from "../collections/comments/collection";
import { updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
}
