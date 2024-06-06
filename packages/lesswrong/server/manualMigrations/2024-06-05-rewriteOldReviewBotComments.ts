import { Comments } from "@/lib/collections/comments";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { createAdminContext, updateMutator } from "../vulcan-lib";
import { registerMigration } from "./migrationUtils";

registerMigration({
  name: "rewriteOldReviewBotComments",
  dateWritten: "2024-06-05",
  idempotent: true,
  action: async () => {
    const sql = getSqlClientOrThrow()

    const context = createAdminContext()

    const oldReviewBotComments: DbComment[] = await sql.many(`
      SELECT * FROM "Comments"
      WHERE "userId" = 'tBchiz3RM7rPwujrJ' AND "deleted" = FALSE
    `);

    const reviewBotUser: DbUser = await sql.one(`
      SELECT * FROM "Users"
      WHERE "_id" = 'tBchiz3RM7rPwujrJ'
    `);

    for (const comment of oldReviewBotComments) {
      if (!comment.contents?.html) throw new Error("oh no!", String(comment.contents));
      const manifoldIframeMatch = comment.contents.html.match(`data-oembed-url="([^"]+)"`);
      if (!manifoldIframeMatch || manifoldIframeMatch.length < 2) continue
      const manifoldUrl = manifoldIframeMatch[1];

      // Some comments have already been edited, and we don't want to edit them again
      const unlinkedQuestionIndex = comment.contents.html.indexOf('Will this post make the top fifty?</p>');
      const newContent = unlinkedQuestionIndex > 0 ? comment.contents.html.slice(0, unlinkedQuestionIndex) + `<a href="${manifoldUrl}">Will this post make the top fifty?</a></p>` : comment.contents.html;

      if (newContent === comment.contents.html) continue;

      await updateMutator({
        collection: Comments,
        documentId: comment._id,
        currentUser: reviewBotUser,
        context,
        data: {
          contents: {
            originalContents: {
              type: "html",
              data: newContent,
            }
          },
        }
      })
    }
  },
});
