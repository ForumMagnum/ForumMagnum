import { Posts } from "../../server/collections/posts/collection";
import Users from "../../server/collections/users/collection";
import groupBy from "lodash/groupBy";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { computeContextFromUser } from "../vulcan-lib/apollo-server/context";
import { updateMutator } from "../vulcan-lib/mutators";
import { createConversation } from "../collections/conversations/mutations";
import { createMessage } from "../collections/messages/mutations";

export const cleanUpDuplicatePostAutosaves = async (adminUserId: string) => {
  const db = getSqlClientOrThrow();
  const adminUser = await Users.findOne(adminUserId);
  if (!adminUser?.isAdmin) {
    throw new Error('Admin user id provided does not find an admin account!');
  }

  const adminContext = await computeContextFromUser({user: adminUser, isSSR: false});

  const query = `
    WITH duplicate_posts AS (
      SELECT "userId", (SELECT slug FROM "Users" WHERE _id = "userId") AS slug, "title", "postedAt", _id, draft, "deletedDraft"
      FROM "Posts"
      WHERE "postedAt" > NOW() - INTERVAL '4 days'
      AND ("userId", title) IN (
        SELECT "userId", title
        FROM "Posts"
        WHERE "postedAt" > NOW() - INTERVAL '4 days'
        GROUP BY "userId", title
        HAVING COUNT(*) > 1
      )
      AND "deletedDraft" IS NOT TRUE
      ORDER BY "userId", "title", "postedAt" DESC
    )
    SELECT "userId", slug AS "userSlug", title, _id AS "postId", "postedAt", draft, "deletedDraft"
    FROM duplicate_posts
    WHERE (slug, "postedAt") NOT IN (
      SELECT slug, MAX("postedAt")
      FROM duplicate_posts
      GROUP BY slug
    )
  `;

  const posts = await db.any<{ userId: string, userSlug: string, title: string, postId: string, postedAt: Date, draft: boolean, deletedDraft: boolean }>(query);

  const postsByUsers = groupBy(posts, (row) => row.userId);

  for (let [userId, userPosts] of Object.entries(postsByUsers)) {
    for (let duplicatePost of userPosts) {
      await updateMutator({
        collection: Posts,
        context: adminContext,
        currentUser: adminUser,
        documentId: duplicatePost.postId,
        data: {
          draft: true,
          deletedDraft: true
        }
      })
    }

    const conversationData = {
      participantIds: [userId, adminUser._id],
      title: `Bug fix - cleaning up duplicated posts`,
    };

    const conversation = await createConversation({
      data: conversationData
    }, adminContext, true);

    const messageContents = `
      <p>There was recently a bug related to new post auto-saving functionality which caused some duplicate posts.  You were one of the users affected by this.</p>
      <p>I've gone ahead and automatically archived all but the most recent copy of any posts of yours caused by this bug.  If this was a mistake or you want to access them for other reasons, you can see all your drafts (including archived ones) here: <a href="https://www.lesswrong.com/drafts?includeArchived=true">https://www.lesswrong.com/drafts?includeArchived=true</a></p>
      <p>Please let me know if you run into any other issues.</p>
    `;

    const messageData = {
      userId: adminUser._id,
      contents: {
        originalContents: {
          type: "html",
          data: messageContents
        }
      },
      conversationId: conversation._id,
      noEmail: true
    };

    await createMessage({
      data: messageData
    }, adminContext, true);
  }
};
