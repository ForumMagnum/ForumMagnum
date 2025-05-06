import gql from 'graphql-tag';
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { logFieldChanges } from "@/server/fieldChanges";

export const bookmarkGqlTypeDefs = gql`
  input ToggleBookmarkInput {
    documentId: String!
    collectionName: String!
  }

  type ToggleBookmarkOutput {
    data: Bookmark
  }

  extend type Mutation {
    toggleBookmark(input: ToggleBookmarkInput!): ToggleBookmarkOutput
  }
`;

interface ToggleBookmarkInput {
  documentId: string;
  collectionName: "Posts" | "Comments";
}

async function toggleBookmarkResolver(root: void, { input }: { input: ToggleBookmarkInput }, context: ResolverContext): Promise<{ data: DbBookmark | null }> {
  const { documentId, collectionName } = input;
  const { currentUser } = context;

  if (!currentUser) {
    throw new Error("You must be logged in to bookmark items.");
  }

  if (!["Posts", "Comments"].includes(collectionName)) {
    throw new Error("Invalid input: collectionName must be Posts or Comments.");
  }

  const resultingBookmark = await context.repos.bookmarks.upsertBookmark(currentUser._id, documentId, collectionName);
  
  return { data: resultingBookmark };
}

export const bookmarkGqlMutations = {
  toggleBookmark: toggleBookmarkResolver,
}; 
