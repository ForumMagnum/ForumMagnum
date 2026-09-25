import gql from "graphql-tag";
import { editCheck as sequenceEditCheck, invalidateSequencePostPages } from "@/server/collections/sequences/mutations";
import { canonizeChapterPostInfo } from "@/server/callbacks/chapterCallbacks";
import { throwError } from "@/server/vulcan-lib/errors";

export const sequencesResolversTypeDefs = gql`
  type SequenceStats {
    totalWordCount: Float
    totalReadTime: Float
  }

  extend type Query {
    getSequenceStats(sequenceId: String!): SequenceStats
  }

  extend type Mutation {
    deleteChapter(chapterId: String!): Boolean!
    moveSequencePost(postId: String!, fromChapterId: String!, toChapterId: String!, toIndex: Int!): Boolean!
  }
`;

export const sequencesResolversQueries = {
  getSequenceStats: async (root: void, { sequenceId }: { sequenceId: string }, context: ResolverContext) => {
    return await context.repos.sequences.getSequenceWordCountAndReadTime(sequenceId);
  },
};

async function loadChapterForEditing(chapterId: string, context: ResolverContext): Promise<{ chapter: DbChapter, sequenceId: string }> {
  const chapter = await context.Chapters.findOne({ _id: chapterId });
  const sequenceId = chapter?.sequenceId;
  if (!chapter || !sequenceId) {
    throw new Error("Chapter not found");
  }
  const sequence = await context.Sequences.findOne({ _id: sequenceId });
  if (!sequenceEditCheck(context.currentUser, sequence)) {
    throwError({ id: 'app.operation_not_allowed' });
  }
  return { chapter, sequenceId };
}

async function markSequenceUpdated(sequenceId: string, context: ResolverContext) {
  await context.Sequences.rawUpdateOne({ _id: sequenceId }, { $set: { lastUpdated: new Date() } });
}

export const sequencesResolversMutations = {
  deleteChapter: async (root: void, { chapterId }: { chapterId: string }, context: ResolverContext): Promise<boolean> => {
    const { chapter, sequenceId } = await loadChapterForEditing(chapterId, context);
    if (chapter.postIds.length > 0) {
      throw new Error("Chapter must be empty");
    }
    const chaptersInSequence = await context.Chapters.find({ sequenceId }, {}, { _id: 1 }).fetch();
    if (chaptersInSequence.length <= 1) {
      throw new Error("Cannot delete a sequence's last chapter");
    }
    await context.Chapters.rawRemove({ _id: chapterId });
    // Chapters are deleted outright, so their description history can't be
    // reached afterwards.
    await context.Revisions.rawRemove({ documentId: chapterId, collectionName: "Chapters" });
    await markSequenceUpdated(sequenceId, context);
    return true;
  },

  // Moves a post between two chapters of the same sequence in one step. The
  // raw updates deliberately skip the chapter update callbacks: those would
  // notify the sequence's subscribers about the "new" post in the destination
  // chapter, even though it was already in the sequence.
  moveSequencePost: async (
    root: void,
    { postId, fromChapterId, toChapterId, toIndex }: { postId: string, fromChapterId: string, toChapterId: string, toIndex: number },
    context: ResolverContext,
  ): Promise<boolean> => {
    const { chapter: fromChapter, sequenceId } = await loadChapterForEditing(fromChapterId, context);
    const { chapter: toChapter, sequenceId: toSequenceId } = await loadChapterForEditing(toChapterId, context);
    if (sequenceId !== toSequenceId) {
      throw new Error("Both chapters must be in the same sequence");
    }
    if (fromChapterId === toChapterId) {
      throw new Error("Use updateChapter to reorder posts within a chapter");
    }
    if (!fromChapter.postIds.includes(postId)) {
      throw new Error("Post is not in the source chapter");
    }

    const newFromPostIds = fromChapter.postIds.filter(id => id !== postId);
    const newToPostIds = toChapter.postIds.filter(id => id !== postId);
    newToPostIds.splice(Math.max(0, Math.min(toIndex, newToPostIds.length)), 0, postId);

    await context.Chapters.rawUpdateOne({ _id: fromChapterId }, { $set: { postIds: newFromPostIds } });
    await context.Chapters.rawUpdateOne({ _id: toChapterId }, { $set: { postIds: newToPostIds } });
    await markSequenceUpdated(sequenceId, context);
    await canonizeChapterPostInfo({ ...toChapter, postIds: newToPostIds }, context);
    // Neighbouring posts' previous/next links change too, not just the moved post's.
    await invalidateSequencePostPages(sequenceId, context);
    return true;
  },
};
