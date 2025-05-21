import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { makeCrossSiteRequest } from "../fmCrosspost/resolvers";
import { getInitialVersion } from "../editor/make_editable_callbacks";
import Posts from "../collections/posts/collection";
import Users from "../collections/users/collection";
import Revisions from "../collections/revisions/collection";
import { buildRevision } from "../editor/conversionUtils";
import { createAnonymousContext } from "../vulcan-lib/createContexts";

export default registerMigration({
  name: "denormalizeCrossposts",
  dateWritten: "2025-05-21",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: {
        "fmCrosspost.isCrosspost": true,
        "fmCrosspost.hostedHere": false,
      },
      callback: async (batch) => {
        for (const post of batch) {
          if (post._id !== "xe3LhnTxeNcc944xb") {
            continue;
          }
          try {
            const {foreignPostId} = post.fmCrosspost;
            if (!foreignPostId) {
              // eslint-disable-next-line no-console
              console.warn("Post", post._id, "has no foreignPostId");
              continue;
            }

            const user = await Users.findOne({_id: post.userId});
            if (!user) {
              // eslint-disable-next-line no-console
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

            const contents = res?.document?.contents as DbRevision | null;
            if (!contents) {
              // eslint-disable-next-line no-console
              console.warn("Post", post._id, "has no contents");
              continue;
            }

            const context = createAnonymousContext({currentUser: user})
            const revisionData = await buildRevision({
              context,
              currentUser: user,
              originalContents: {
                type: "ckEditorMarkup",
                data: contents.html ?? "",
              },
            });
            /*
            const revision = await createMutator({
              collection: Revisions,
              document: {
                version: contents.version || getInitialVersion(post),
                changeMetrics: {added: 0, removed: 0},
                collectionName: "Posts",
                ...revisionData,
                userId: user._id,
              },
              validate: false,
            });
            await Promise.all([
              afterCreateRevisionCallback.runCallbacksAsync([{
                revisionID: revision.data._id,
              }]),
              Posts.rawUpdateOne({_id: post._id}, {
                $set: {contents_latest: revision.data._id},
              }),
            ]);
            */
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(`Error backfilling post ${post._id}:`, e);
          }
        }
      },
    });
  },
});
