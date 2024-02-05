export const acceptsSchemaHash = "429a40ce07bbbf7a69080fd4269efae1";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection"
import { dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  void dropRemovedField(db, ReviewWinnerArts, "reviewYear")
  void dropRemovedField(db, ReviewWinnerArts, "reviewRanking")
  void dropRemovedField(db, ReviewWinnerArts, "postIsAI")
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
