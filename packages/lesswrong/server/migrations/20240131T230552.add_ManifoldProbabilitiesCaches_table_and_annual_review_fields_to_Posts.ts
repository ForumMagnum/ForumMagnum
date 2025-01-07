export const acceptsSchemaHash = "44cc1cc66be79573b597f5f1168df8ec";

import ManifoldProbabilitiesCaches from "../../lib/collections/manifoldProbabilitiesCaches/collection";
import { Posts } from "../../lib/collections/posts";
import { StringType } from "../sql/Type";

import { addField, addRemovedField, createTable, dropField, dropRemovedField, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ManifoldProbabilitiesCaches)

  await addField(db, Posts, "manifoldReviewMarketId")
  await addRemovedField(db, Posts, "annualReviewMarketCommentId", new StringType())
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ManifoldProbabilitiesCaches)

  await dropField(db, Posts, "manifoldReviewMarketId")
  await dropRemovedField(db, Posts, "annualReviewMarketCommentId")
}
