import { addGraphQLResolvers, addGraphQLSchema } from '../../../lib/vulcan-lib/graphql';
import type { TagCommentType } from "../../../lib/collections/comments/types";
import type { KarmaChangeUpdateFrequency } from "../../../lib/collections/users/schema";

// When adding fields here, you almost certainly want to update the
// `UserKarmaChanges` fragment too
addGraphQLSchema(`
  type PostKarmaChange {
    _id: String
    scoreChange: Int
    postId: String
    title: String
    slug: String
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type CommentKarmaChange {
    _id: String
    scoreChange: Int
    commentId: String
    description: String
    postId: String
    postTitle: String
    postSlug: String
    tagSlug: String
    tagName: String
    tagCommentType: String
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type RevisionsKarmaChange {
    _id: String
    scoreChange: Int
    tagId: String
    tagSlug: String
    tagName: String
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type ReactionChange {
    reactionType: String!
    userId: String
  }
  type KarmaChangesSimple {
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
    tagRevisions: [RevisionsKarmaChange]
  }
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
    tagRevisions: [RevisionsKarmaChange]
    todaysKarmaChanges: KarmaChangesSimple
    thisWeeksKarmaChanges: KarmaChangesSimple
  }
`);

addGraphQLResolvers({
  KarmaChanges: {
    updateFrequency: async (karmaChangesJSON: any, args: void, context: ResolverContext) => {
      const { currentUser } = context;
      if (!currentUser) return null;
      const settings = currentUser.karmaChangeNotifierSettings
      return settings.updateFrequency;
    },
  }
})

export type KarmaChangesArgs = {
  userId: string,
  startDate: Date,
  endDate: Date,
  af?: boolean,
  showNegative?: boolean,
}

export type ReactionChange = {
  reactionType: string
  userId?: string
}

export type EAReactionChange = number | {_id: string, displayName: string, slug: string}[];

export type EAReactionChanges = Record<string, EAReactionChange>;

export type KarmaChangeBase = {
  _id: string,
  collectionName: CollectionNameString,
  scoreChange: number,
  addedReacts: ReactionChange[],
  eaAddedReacts?: EAReactionChanges,
}

export type CommentKarmaChange = KarmaChangeBase & {
  commentId: string,
  description?: string,
  postId?: string,
  postTitle: string,
  postSlug: string,
  tagId?: string,
  tagName?: string,
  tagCommentType?: TagCommentType,
  
  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
}

export type PostKarmaChange = KarmaChangeBase & {
  postId: string,
  title: string,
  slug: string,
}

export type TagRevisionKarmaChange = KarmaChangeBase & {
  tagId: string,

  // Not filled in by the initial query; added by a followup query in the resolver
  tagSlug?: string
  tagName?: string
}

export type AnyKarmaChange = PostKarmaChange | CommentKarmaChange | TagRevisionKarmaChange;

export type KarmaChangesSimple = {
  posts: PostKarmaChange[],
  comments: CommentKarmaChange[],
  tagRevisions: TagRevisionKarmaChange[],
}

export type KarmaChanges = {
  totalChange: number,
  startDate?: Date,
  endDate?: Date,
  nextBatchDate?: Date,
  updateFrequency: KarmaChangeUpdateFrequency,
  posts: PostKarmaChange[],
  comments: CommentKarmaChange[],
  tagRevisions: TagRevisionKarmaChange[],
  todaysKarmaChanges?: KarmaChangesSimple,
  thisWeeksKarmaChanges?: KarmaChangesSimple,
}
