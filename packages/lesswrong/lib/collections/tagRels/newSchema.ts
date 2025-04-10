import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { isEAForum } from "@/lib/instanceSettings";
import { DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD, DEFAULT_BASE_SCORE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_INACTIVE_FIELD, DEFAULT_SCORE_FIELD, defaultVoteCountField } from "@/lib/make_voteable";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { canVoteOnTagAsync } from "@/lib/voting/tagRelVoteRules";
import { userOwns } from "@/lib/vulcan-users/permissions";
import { getTagBotUserId } from "@/server/languageModels/autoTagCallbacks";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
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
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
  voteCount: defaultVoteCountField('TagRels'),
  baseScore: DEFAULT_BASE_SCORE_FIELD,
  extendedScore: DEFAULT_EXTENDED_SCORE_FIELD,
  score: DEFAULT_SCORE_FIELD,
  inactive: DEFAULT_INACTIVE_FIELD,
  afBaseScore: DEFAULT_AF_BASE_SCORE_FIELD,
  afExtendedScore: DEFAULT_AF_EXTENDED_SCORE_FIELD,
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, CollectionFieldSpecification<"TagRels">>;

export default schema;
