import DoppelCommentVotes from "@/lib/collections/doppelCommentVotes/collection";
import { updateIndexes } from "./meta/utils";

export const acceptsSchemaHash = "218b88dd1bf697da99eb6b8823ff6931";

export const up = async ({db}: MigrationContext) => {
  updateIndexes(DoppelCommentVotes)
}

export const down = async ({db}: MigrationContext) => {
  updateIndexes(DoppelCommentVotes)
}
