import gql from 'graphql-tag';
import { Bookmarks } from './collection';
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

  if (!currentUser || !userCanDo(currentUser, 'bookmarks.toggle')) {
    throw new Error("Permission denied. You must be logged in to bookmark items.");
  }

  if (!documentId || !collectionName || !["Posts", "Comments"].includes(collectionName)) {
    throw new Error("Invalid input: documentId and collectionName (Posts or Comments) are required.");
  }

  const existingBookmark = await Bookmarks.findOne({
    userId: currentUser._id,
    documentId,
    collectionName,
  });

  let resultingBookmark: DbBookmark | null = null;

  if (existingBookmark) {
    const newCancelledState = !existingBookmark.cancelled;
    const updateData = { cancelled: newCancelledState, lastUpdated: new Date() };

    const updateResult = await Bookmarks.rawUpdateOne(
      { _id: existingBookmark._id },
      { $set: updateData }
    );

    if (updateResult === 1) {
      void logFieldChanges({ 
        currentUser, 
        collection: Bookmarks, 
        oldDocument: existingBookmark, 
        data: updateData 
      });

      if (newCancelledState) {
        resultingBookmark = null;
      } else {
        resultingBookmark = await Bookmarks.findOne({ _id: existingBookmark._id });
      }
    } else {
      // eslint-disable-next-line no-console
      console.error(`Bookmark update failed for _id: ${existingBookmark._id}`);
      resultingBookmark = null; 
    }

  } else {
    const insertData: Partial<DbBookmark> = {
      userId: currentUser._id,
      documentId,
      collectionName,
      createdAt: new Date(),
      lastUpdated: new Date(),
      cancelled: false,
    };

    const newId = await Bookmarks.rawInsert(insertData);

    if (newId) {
      resultingBookmark = await Bookmarks.findOne({ _id: newId });
    } else {
      // eslint-disable-next-line no-console
      console.error(`Bookmark insert failed for user ${currentUser._id}, doc ${documentId}`);
      resultingBookmark = null;
    }
  }

  return { data: resultingBookmark };
}

export const bookmarkGqlMutations = {
  toggleBookmark: toggleBookmarkResolver,
}; 
