// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "../../vulcan-users/permissions";
import { accessFilterSingle } from "../../utils/schemaUtils";

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

const docIsTagRel = (currentUser: DbUser | UsersCurrent | null, document: DbVote) => {
  // TagRel votes are treated as public
  return document?.collectionName === "TagRels";
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  documentId: {
    // No explicit foreign-key relation because which collection this is depends on collectionName
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  collectionName: {
    database: {
      type: "TEXT",
      typescriptType: "CollectionNameString",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, docIsTagRel, "admins"],
    },
  },
  // The IDs of the authors of the document that was voted on
  authorIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      outputType: "[String]",
      inputType: "[String]!",
      canRead: ["guests"],
    },
  },
  // Resolver-only authorId for backwards compatability after migrating to allow
  // co-authors to receive karma with authorIds
  authorId: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: (vote) => vote.authorIds?.[0],
    },
  },
  // The type of vote, eg smallDownvote, bigUpvote. If this is an unvote, then
  // voteType is the type of the vote that was reversed.
  //
  // If this vote was cast in an alternate voting system, this is the projection
  // of their vote onto an approve/disapprove axis, if that makes sense, or
  // neutral if it doesn't.
  voteType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      validation: {
        allowedValues: ["bigDownvote", "bigUpvote", "neutral", "smallDownvote", "smallUpvote"],
      },
    },
  },
  // If this vote was cast in an alternate voting system, this is the complete
  // ballot. If the vote was cast in traditional Reddit-style upvoting/downvoting,
  // then this is null.
  extendedVoteType: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
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
    database: {
      type: "DOUBLE PRECISION",
      // Can be inferred from userId+voteType+votedAt (votedAt necessary because
      // the user's vote power may have changed over time)
      denormalized: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, docIsTagRel, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  // The vote's alignment-forum power - that is, the effect this vote had on
  // the comment/post's AF score.
  //
  // If this vote was cast in an alternate voting system, this is not the whole
  // ballot, but is the effect the vote has on the votee's AF karma.
  afPower: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: [userOwns, docIsTagRel, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  // Whether this vote has been cancelled (by un-voting or switching to a
  // different vote type) or is itself an unvote/cancellation.
  cancelled: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
    },
  },
  // Whether this is an unvote. This data is unreliable on the EA Forum for old votes (around 2019).
  isUnvote: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
    },
  },
  // Time this vote was cast. If this is an unvote, the time the vote was
  // reversed.
  votedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, docIsTagRel, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  tagRel: {
    graphql: {
      outputType: "TagRel",
      canRead: [docIsTagRel, "admins"],
      resolver: async (vote, args, context) => {
        if (vote.collectionName === "TagRels") {
          const tagRel = await context.loaders.TagRels.load(vote.documentId);
          return accessFilterSingle(context.currentUser, "TagRels", tagRel, context);
        } else {
          return null;
        }
      },
    },
  },
  comment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: async (vote, args, context) => {
        if (vote.collectionName === "Comments") {
          const comment = await context.loaders.Comments.load(vote.documentId);
          return accessFilterSingle(context.currentUser, "Comments", comment, context);
        } else {
          return null;
        }
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: async (vote, args, context) => {
        if (vote.collectionName === "Posts") {
          const post = await context.loaders.Posts.load(vote.documentId);
          return accessFilterSingle(context.currentUser, "Posts", post, context);
        } else {
          return null;
        }
      },
    },
  },
  // This flag allows us to calculate the baseScore/karma of documents and users using nothing but the votes
  // collection. Otherwise doing that calculation would require a lookup, which is pretty expensive
  documentIsAf: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
    },
  },
  // Whether to silence notifications of the karma changes from this vote. This is set to true for votes that are
  // nullified by mod actions
  silenceNotification: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Votes">>;

export default schema;
