import Posts from "../collections/posts/collection";
import Comments from "../collections/comments/collection";
import { dropIndexByName, updateIndexes } from "./meta/utils";

export const up = async (_: MigrationContext) => {
  await updateIndexes(Posts);
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
  await dropIndexByName(db, Posts, "idx_posts_rejectionConversationId_createdAt");
  await dropIndexByName(db, Comments, "idx_comments_rejectionConversationId_createdAt");
}
