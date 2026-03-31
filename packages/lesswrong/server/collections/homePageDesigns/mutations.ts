import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { createComment } from "@/server/collections/comments/mutations";
import gql from "graphql-tag";

// TODO: Replace with the actual marketplace post ID once created
const MARKETPLACE_POST_ID = "PLACEHOLDER_POST_ID";

async function publishHomePageDesignResolver(
  root: void,
  { input }: { input: PublishHomePageDesignInput },
  context: ResolverContext,
) {
  const { currentUser, HomePageDesigns } = context;
  if (!currentUser) {
    throw new Error("You must be logged in to publish a home page design.");
  }

  const { publicId, title, description } = input;

  // Verify ownership — the original creator must be this logged-in user
  const original = await HomePageDesigns.findOne(
    { publicId },
    { sort: { createdAt: 1 } },
    { ownerId: 1 },
  );
  if (!original) {
    throw new Error("No design found with that publicId");
  }
  if (original.ownerId !== currentUser._id) {
    throw new Error("You do not own this design");
  }

  // Get the latest revision
  const latest = await HomePageDesigns.findOne(
    { publicId },
    { sort: { createdAt: -1 } },
    { _id: 1 },
  );
  if (!latest) {
    throw new Error("No design found with that publicId");
  }

  // Check if already published (any revision has a commentId)
  const existingPublished = await HomePageDesigns.findOne(
    { publicId, commentId: { $ne: null } },
    undefined,
    { _id: 1, commentId: 1 },
  );

  let commentId;
  // Create a comment on the marketplace post if no comment already exists for this design
  if (!existingPublished) {
    const linkUrl = `/?theme=${publicId}`;
    const commentHtml = `<p><strong>${title}</strong></p><p>${description}</p><p><a href="${linkUrl}">Try this design</a></p>`;

    const comment = await createComment({
      data: {
        postId: MARKETPLACE_POST_ID,
        contents: {
          originalContents: {
            type: "lexical",
            data: commentHtml,
          },
        },
      },
    }, context);

    commentId = comment._id;
  } else {
    commentId = existingPublished.commentId;
  }

  await HomePageDesigns.rawUpdateOne(
    { _id: latest._id },
    { $set: { commentId, title } },
  );

  const result = await HomePageDesigns.findOne({ _id: latest._id });
  const filtered = await accessFilterSingle(currentUser, 'HomePageDesigns', result, context);
  return { data: filtered };
}

export const graphqlHomePageDesignMutationTypeDefs = gql`
  input PublishHomePageDesignInput {
    publicId: String!
    title: String!
    description: String!
  }

  type HomePageDesignMutationOutput {
    data: HomePageDesign
  }

  extend type Mutation {
    publishHomePageDesign(input: PublishHomePageDesignInput!): HomePageDesignMutationOutput
  }
`;

export const homePageDesignGqlMutations = {
  publishHomePageDesign: publishHomePageDesignResolver,
};
