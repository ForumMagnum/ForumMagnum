import Users from "../users/collection";
import { userOwns } from '../../vulcan-users/permissions';
import { addFieldsDict } from '../../utils/schemaUtils';
import { addGraphQLSchema, addGraphQLResolvers } from '../../vulcan-lib';
import type { TagCommentType } from "../../collections/comments/types";
import type { KarmaChangeUpdateFrequency } from "./schema";

// When adding fields here, you almost certainly want to update the
// `UserKarmaChanges` fragment too
addGraphQLSchema(`
  type PostKarmaChange {
    _id: String
    scoreChange: Int
    title: String
    slug: String
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type CommentKarmaChange {
    _id: String
    scoreChange: Int
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
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
    tagRevisions: [RevisionsKarmaChange]
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

addFieldsDict(Users, {
  "karmaChanges": {
    canRead: userOwns,
    type: "KarmaChanges",
    optional: true,
  }
});

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

export type EAReactionChange = number | {_id: string, displayName: string}[];

export type EAReactionChanges = Record<string, EAReactionChange>;

export type KarmaChangeBase = {
  _id: string,
  collectionName: CollectionNameString,
  scoreChange: number,
  addedReacts: ReactionChange[],
  eaAddedReacts?: EAReactionChanges,
}

export type CommentKarmaChange = KarmaChangeBase & {
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

export type KarmaChanges = {
  totalChange: number,
  startDate?: Date,
  endDate?: Date,
  nextBatchDate?: Date,
  updateFrequency: KarmaChangeUpdateFrequency,
  posts: PostKarmaChange[],
  comments: CommentKarmaChange[],
  tagRevisions: TagRevisionKarmaChange[],
}
