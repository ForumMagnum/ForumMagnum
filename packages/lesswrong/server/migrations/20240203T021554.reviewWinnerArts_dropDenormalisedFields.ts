export const acceptsSchemaHash = "429a40ce07bbbf7a69080fd4269efae1";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection"
import { dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  void dropField(db, ReviewWinnerArts, "reviewYear")
  void dropField(db, ReviewWinnerArts, "reviewRanking")
  void dropField(db, ReviewWinnerArts, "postIsAI")
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
