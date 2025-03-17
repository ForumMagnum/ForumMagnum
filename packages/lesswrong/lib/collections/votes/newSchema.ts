// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { userOwns } from "../../vulcan-users/permissions";
import { accessFilterSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

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

const schema: Record<string, NewCollectionFieldSpecification<"Votes">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
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
      type: "String",
      canRead: [userOwns, docIsTagRel, "admins"],
    },
  },
  authorIds: {
    database: {
      type: "VARCHAR(27)[]",
    },
    graphql: {
      type: "[String]",
      canRead: ["guests"],
    },
  },
  authorId: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: (vote) => vote.authorIds?.[0],
    },
  },
  voteType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      validation: {
        allowedValues: ["bigDownvote", "bigUpvote", "neutral", "smallDownvote", "smallUpvote"],
      },
    },
  },
  extendedVoteType: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["guests"],
    },
  },
  power: {
    database: {
      type: "DOUBLE PRECISION",
      denormalized: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, docIsTagRel, "admins"],
    },
  },
  afPower: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: [userOwns, docIsTagRel, "admins"],
    },
  },
  cancelled: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  isUnvote: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  votedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, docIsTagRel, "admins"],
    },
  },
  tagRel: {
    graphql: {
      type: "TagRel",
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
      type: "Comment",
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
      type: "Post",
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
  documentIsAf: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  silenceNotification: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
};

export default schema;
