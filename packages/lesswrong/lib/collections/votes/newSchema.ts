// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

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

const schema: Record<string, NewCollectionFieldSpecification<"Votes">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  documentId: {
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
  authorId: {
    graphql: {
      outputType: "String",
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
      outputType: "String",
      inputType: "String!",
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
      outputType: "JSON",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  power: {
    database: {
      type: "DOUBLE PRECISION",
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
};

export default schema;
