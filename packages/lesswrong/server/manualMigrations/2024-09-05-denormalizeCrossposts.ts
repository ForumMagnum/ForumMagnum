import { Posts } from "@/lib/collections/posts";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { createAnonymousContext, runQuery } from "../vulcan-lib/query";
import { gql } from "@apollo/client";
import { makeCrossSiteRequest } from "../fmCrosspost/resolvers";

//eslint-disable-file no-console

const getCrosspostQuery = gql`
  query GetCrosspostQuery($args: JSON) {
    getCrosspost(args: $args)
  }
`;

registerMigration({
  name: "denormalizeCrossposts",
  dateWritten: "2024-09-05",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: { "fmCrosspost.isCrosspost": true, "fmCrosspost.hostedHere": false },
      callback: async (batch) => {
        for (const post of batch) {
          if (post._id !== 'xe3LhnTxeNcc944xb') {
            continue;
          }

          const res = await makeCrossSiteRequest(
            'getCrosspost',
            {
              collectionName: "Posts",
              fragmentName: "PostsPage",
              documentId: post.fmCrosspost.foreignPostId
            },
            'Failed to get crosspost'
          );

          console.log({ res })
        }
      }
    });
  },
});
