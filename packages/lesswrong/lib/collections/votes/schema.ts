import { userOwns } from '../../vulcan-users/permissions';
import { schemaDefaultValue, } from '../../collectionUtils';
import { resolverOnlyField } from '../../../lib/utils/schemaUtils';
import GraphQLJSON from 'graphql-type-json';

//
// Votes. From the user's perspective, they have a vote-state for each voteable
// entity (post/comment), which is either neutral (the default), upvote,
// downvote, big-upvote or big-downvote.
//
// When you vote and then change it, three things happen. A new vote is created
// for the new vote state (unless that's neutral). First, the old vote has
// 'cancelled' set to true. Second, an "unvote" is created, also with cancelled
// set to true, but with the timestamp corresponding to the moment you changed
// the vote. The power of an unvote is the opposite of the power of the vote
// that was reversed.
//

const docIsTagRel = (currentUser: DbUser|UsersCurrent|null, document: DbVote) => {
  // TagRel votes are treated as public
  return document?.collectionName === "TagRels"
}

const schema: SchemaType<DbVote> = {
  // The id of the document that was voted on
  documentId: {
    type: String,
    canRead: ['guests'],
    // No explicit foreign-key relation because which collection this is depends on collectionName
  },

  // The name of the collection the document belongs to
  collectionName: {
    type: String,
    typescriptType: "CollectionNameString",
    canRead: ['guests'],
  },

  // The id of the user that voted
  userId: {
    type: String,
    canRead: [userOwns, docIsTagRel, 'admins'],
    foreignKey: 'Users',
  },

  // The IDs of the authors of the document that was voted on
  authorIds: {
    type: Array,
    canRead: ['guests'],
  },
  'authorIds.$': {
    type: String,
    foreignKey: 'Users',
  },

  // Resolver-only authorId for backwards compatability after migrating to allow
  // co-authors to receive karma with authorIds
  authorId: resolverOnlyField({
    type: String,
    graphQLtype: 'String',
    canRead: ['guests'],
    dependsOn: ['authorIds'],
    resolver: (vote): string => vote.authorIds[0],
  }),

  // The type of vote, eg smallDownvote, bigUpvote. If this is an unvote, then
  // voteType is the type of the vote that was reversed.
  //
  // If this vote was cast in an alternate voting system, this is the projection
  // of their vote onto an approve/disapprove axis, if that makes sense, or
  // neutral if it doesn't.
  voteType: {
    type: String,
    canRead: ['guests'],
  },
  
  // If this vote was cast in an alternate voting system, this is the complete
  // ballot. If the vote was cast in traditional Reddit-style upvoting/downvoting,
  // then this is null.
  extendedVoteType: {
    type: GraphQLJSON,
    optional: true,
    canRead: ['guests'],
  },

  // The vote power - that is, the effect this vote had on the comment/post's
  // score. Positive for upvotes, negative for downvotes, based on whether it's
  // a regular or strong vote and on the voter's karma at the time the vote was
  // made. If this is an unvote, then the opposite: negative for undoing an
  // upvote, positive for undoing a downvote.
  //
  // If this vote was cast in an alternate voting system, this is not the whole
  // ballot, but is the effect the vote has on the votee's karma.
  power: {
    type: Number,
    optional: true,
    canRead: [userOwns, docIsTagRel, 'admins'],
    
    // Can be inferred from userId+voteType+votedAt (votedAt necessary because
    // the user's vote power may have changed over time)
    denormalized: true,
  },
  
  // The vote's alignment-forum power - that is, the effect this vote had on
  // the comment/post's AF score.
  //
  // If this vote was cast in an alternate voting system, this is not the whole
  // ballot, but is the effect the vote has on the votee's AF karma.
  afPower: {
    type: Number,
    optional: true,
    canRead: [userOwns, docIsTagRel, 'admins'],
  },
  
  // Whether this vote has been cancelled (by un-voting or switching to a
  // different vote type) or is itself an unvote/cancellation.
  cancelled: {
    type: Boolean,
    canRead: ['guests'],
    ...schemaDefaultValue(false),
  },
  
  // Whether this is an unvote. This data is unreliable on the EA Forum for old votes (around 2019).
  isUnvote: {
    type: Boolean,
    canRead: ['guests'],
    ...schemaDefaultValue(false),
  },

  // Time this vote was cast. If this is an unvote, the time the vote was
  // reversed.
  votedAt: {
    type: Date,
    optional: true,
    canRead: [userOwns, docIsTagRel, 'admins'],
  },

  tagRel: resolverOnlyField({
    type: "TagRel",
    graphQLtype: 'TagRel',
    canRead: [docIsTagRel, 'admins'],
    dependsOn: ['collectionName', 'documentId'],
    resolver: async (vote, args: void, { TagRels }: ResolverContext): Promise<DbTagRel|null> => {
      if (vote.collectionName === "TagRels") {
        return await TagRels.findOne({_id: vote.documentId});
      } else {
        return null;
      }
    }
  }),

  comment: resolverOnlyField({
    type: "Comment",
    graphQLtype: 'Comment',
    canRead: ['guests'],
    dependsOn: ['collectionName', 'documentId'],
    resolver: async (vote, args: void, context: ResolverContext): Promise<DbComment|null> => {
      if (vote.collectionName === "Comments") {
        return await context.loaders.Comments.load(vote.documentId);
      } else {
        return null;
      }
    }
  }),

  post: resolverOnlyField({
    type: "Post",
    graphQLtype: 'Post',
    canRead: ['guests'],
    dependsOn: ['collectionName', 'documentId'],
    resolver: async (vote, args: void, context: ResolverContext): Promise<DbPost|null> => {
      if (vote.collectionName === "Posts") {
        return await context.loaders.Posts.load(vote.documentId);
      } else {
        return null;
      }
    }
  }),

  // This flag allows us to calculate the baseScore/karma of documents and users using nothing but the votes
  // collection. Otherwise doing that calculation would require a lookup, which is pretty expensive
  documentIsAf: {
    type: Boolean,
    canRead: ['guests'],
    ...schemaDefaultValue(false)
  }
};

export default schema;
