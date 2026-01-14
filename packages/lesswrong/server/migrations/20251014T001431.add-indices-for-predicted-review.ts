import { Posts } from "../collections/posts/collection";
import { updateIndexes } from "./meta/utils";

export const up = async (_: MigrationContext) => {
  return updateIndexes(Posts);
}

export const down = async (_: MigrationContext) => {
}
