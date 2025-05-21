/* eslint-disable no-console */

import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { makeCrossSiteRequest } from "../fmCrosspost/resolvers";
import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { updatePost } from "../collections/posts/mutations";
import Posts from "../collections/posts/collection";
import Users from "../collections/users/collection";

export default registerMigration({
  name: "denormalizeCrossposts",
  dateWritten: "2025-05-21",
  idempotent: true,
  action: async () => {
    const missingContents: string[] = [];
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: {
        "fmCrosspost.isCrosspost": true,
        "fmCrosspost.hostedHere": false,
      },
      callback: async (batch) => {
        for (const post of batch) {
          try {
            const {foreignPostId} = post.fmCrosspost;
            if (!foreignPostId) {
              console.warn("Post", post._id, "has no foreignPostId");
              continue;
            }

            const user = await Users.findOne({_id: post.userId});
            if (!user) {
              console.warn("Post", post._id, "has valid user");
              continue;
            }

            const res = await makeCrossSiteRequest(
              "getCrosspost",
              {
                collectionName: "Posts",
                fragmentName: "PostsPage",
                documentId: foreignPostId,
              },
              "Failed to get crosspost"
            );

            const document = res?.document as unknown as PostsPage | undefined;
            const contents = document?.contents;
            if (!contents) {
              console.warn("Post", post._id, "has no contents");
              missingContents.push(post._id);
              continue;
            }

            const context = createAnonymousContext({currentUser: user})
            await updatePost({
              selector: {_id: post._id},
              data: {
                title: document.title,
                isEvent: document.isEvent,
                question: document.question,
                url: document.url,
                contents: {
                  ...contents,
                  originalContents: {
                    type: "ckEditorMarkup",
                    data: contents.html,
                  },
                },
              },
            }, context);
          } catch (e) {
            console.error(`Error backfilling post ${post._id}:`, e);
          }
        }
      },
    });
    if (missingContents.length) {
      console.error(`Found ${missingContents.length} posts without contents:`);
      console.error(missingContents);
    }
  },
});
