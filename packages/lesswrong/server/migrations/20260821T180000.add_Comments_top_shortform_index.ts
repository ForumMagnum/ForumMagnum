import Comments from "../collections/comments/collection";
import { updateIndexes } from "./meta/utils";

export const up = async (_: MigrationContext) => {
  return updateIndexes(Comments);
}

export const down = async (_: MigrationContext) => {
}
