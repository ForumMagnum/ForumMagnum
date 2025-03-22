// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { isEAForum } from "@/lib/instanceSettings";
import { currentUserExtendedVoteResolver, currentUserVoteResolver, getAllVotes, getCurrentUserVotes } from "@/lib/make_voteable";
import { generateIdResolverSingle, getDenormalizedCountOfReferencesGetValue } from "@/lib/utils/schemaUtils";
import { canVoteOnTagAsync } from "@/lib/voting/tagRelVoteRules";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { getTagBotUserId } from "@/server/languageModels/autoTagCallbacks";
import GraphQLJSON from "graphql-type-json";

const schema = {
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
        blackbox: true,
      },
    },
  },
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  tag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Tags", fieldName: "tagId" }),
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  deleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  // The user who first tagged the post with this tag
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      // Hide who applied the tag on the EA Forum
      canRead: isEAForum ? [userOwns, "sunshineRegiment", "admins"] : ["guests"],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: isEAForum ? [userOwns, "sunshineRegiment", "admins"] : ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  currentUserCanVote: {
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        // Return true for a null user so we can show them a login/signup prompt
        return context.currentUser
          ? !(await canVoteOnTagAsync(context.currentUser, document.tagId, document.postId, context, "smallUpvote"))
              .fail
          : true;
      },
    },
  },
  autoApplied: {
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const tagBotUserId = await getTagBotUserId(context);
        if (!tagBotUserId) return false;
        return document.userId === tagBotUserId && document.voteCount === 1;
      },
    },
  },
  // Indicates that a tagRel was applied via the script backfillParentTags.ts
  backfilled: {
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
  currentUserVote: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].voteType ?? null;
      },
      sqlResolver: currentUserVoteResolver,
    },
  },
  currentUserExtendedVote: {
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const votes = await getCurrentUserVotes(document, context);
        if (!votes.length) return null;
        return votes[0].extendedVoteType || null;
      },
      sqlResolver: currentUserExtendedVoteResolver,
    },
  },
  currentUserVotes: {
    graphql: {
      outputType: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        return await getCurrentUserVotes(document, context);
      },
    },
  },
  allVotes: {
    graphql: {
      outputType: "[Vote]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const { currentUser } = context;
        if (userIsAdminOrMod(currentUser)) {
          return await getAllVotes(document, context);
        } else {
          return await getCurrentUserVotes(document, context);
        }
      },
    },
  },
  voteCount: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: "TagRels",
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "TagRels",
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn: (vote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === "TagRels",
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  baseScore: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  extendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: GraphQLJSON,
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  score: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  inactive: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
  },
  afBaseScore: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Base Score",
    },
  },
  afExtendedScore: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: GraphQLJSON,
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  afVoteCount: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"TagRels">>;

export default schema;
