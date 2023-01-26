import { Comments } from "../../lib/collections/comments";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Comments.isPostgres()) {
    addField(db, Comments, "relevantTagIds");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Comments.isPostgres()) {
    dropField(db, Comments, "relevantTagIds");
  }
}
