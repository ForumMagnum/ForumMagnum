import { Votes } from "@/lib/collections/votes";
import { dropIndexByName } from "./meta/utils";

export const acceptsSchemaHash = "061c49894f51ba693c8441dcf221d3bf";

export const up = async ({db}: MigrationContext) => {
  await dropIndexByName(db, Votes, "idx_Votes_collectionName_userId_cancelled_isUnvote_voteType_ext");
}

export const down = async ({db}: MigrationContext) => {
}
