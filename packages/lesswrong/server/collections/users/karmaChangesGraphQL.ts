import gql from 'graphql-tag';
// When adding fields here, you almost certainly want to update the
// `UserKarmaChanges` fragment too
export const karmaChangesTypeDefs = gql`
  type PostKarmaChange {
    _id: String!
    collectionName: String!
    scoreChange: Int!
    postId: String!
    title: String
    slug: String!
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type CommentKarmaChange {
    _id: String!
    collectionName: String!
    scoreChange: Int!
    commentId: String
    description: String
    postId: String
    postTitle: String
    postSlug: String
    tagSlug: String
    tagName: String
    tagCommentType: String
    tagId: String
    addedReacts: [ReactionChange!]
    eaAddedReacts: JSON
  }
  type RevisionsKarmaChange {
    _id: String!
    collectionName: String!
    scoreChange: Int!
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
    posts: [PostKarmaChange!]!
    comments: [CommentKarmaChange!]!
    tagRevisions: [RevisionsKarmaChange!]!
  }
  type KarmaChanges {
    totalChange: Int!
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String!
    posts: [PostKarmaChange!]!
    comments: [CommentKarmaChange!]!
    tagRevisions: [RevisionsKarmaChange!]!
    todaysKarmaChanges: KarmaChangesSimple
    thisWeeksKarmaChanges: KarmaChangesSimple
  }
`;

export const karmaChangesFieldResolvers = {
  KarmaChanges: {
    updateFrequency: async (karmaChangesJSON: any, args: void, context: ResolverContext) => {
      const { currentUser } = context;
      if (!currentUser) return null;
      const settings = currentUser.karmaChangeNotifierSettings
      return settings.updateFrequency;
    }
  },
}

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

export type AnyKarmaChange = PostKarmaChange | CommentKarmaChange | RevisionsKarmaChange;
