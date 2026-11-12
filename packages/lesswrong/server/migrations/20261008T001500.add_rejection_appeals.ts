import RejectionAppeals from "../collections/rejectionAppeals/collection";
import Conversations from "../collections/conversations/collection";
import Posts from "../collections/posts/collection";
import Comments from "../collections/comments/collection";
import { addField, createTable, dropField, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, RejectionAppeals);
  await addField(db, Conversations, "awaitingModeratorReply");
  await addField(db, Posts, "rejectionConversationId");
  await addField(db, Comments, "rejectionConversationId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "rejectionConversationId");
  await dropField(db, Posts, "rejectionConversationId");
  await dropField(db, Conversations, "awaitingModeratorReply");
  await dropTable(db, RejectionAppeals);
}
