import { Comments } from "@/lib/collections/comments/collection.ts";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { registerMigration } from "./migrationUtils";
import { createAdminContext } from "../vulcan-lib/query";
import { updateMutator } from "../vulcan-lib/mutators";

export default registerMigration({
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
      const manifoldUrl = comment.contents.html.match(/https:\/\/manifold.markets\/LessWrong\/([A-Za-z\d-])+/)?.[0];
      const year = comment.contents.html.match(`but will be at the end of (\\d+)`)?.[1];
      if (!manifoldUrl || !year) {
        // eslint-disable-next-line no-console
        console.warn("Skipping comment", comment._id, "because we didn't find a manifold URL or year", comment.contents.html)
        continue
      }

      const newContent = `<p>The <a href="https://www.lesswrong.com/bestoflesswrong">LessWrong Review</a> runs every year to select the posts that have most stood the test of time. This post is not yet eligible for review, but will be at the end of ${year}. The top fifty or so posts are featured prominently on the site throughout the year.</p><p>Hopefully, the review is better than karma at judging enduring value. If we have accurate prediction markets on the review results, maybe we can have better incentives on LessWrong today. <a href="${manifoldUrl}">Will this post make the top fifty?</a></p>`;

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
