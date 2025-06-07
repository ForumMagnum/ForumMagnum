import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import {
  accessFilterSingle,
  accessFilterMultiple, generateIdResolverSingle
} from "../../utils/schemaUtils";
import { getWithCustomLoader } from "../../loaders";
import { documentIsNotDeleted, userOwns } from "../../vulcan-users/permissions";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Sequences", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      inputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
    },
  },
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  // Cloudinary image id for the card image
  gridImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  hideFromAuthorPage: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  draft: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  isDeleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  curatedOrder: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  userProfileOrder: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  canonicalCollectionSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Collections", field: "slug" },
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  canonicalCollection: {
    graphql: {
      outputType: "Collection",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        if (!sequence.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({
          slug: sequence.canonicalCollectionSlug,
        });
        return await accessFilterSingle(context.currentUser, "Collections", collection, context);
      },
    },
  },
  hidden: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  noindex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  postsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const count = await getWithCustomLoader(context, "sequencePostsCount", sequence._id, (sequenceIds) => {
          return context.repos.sequences.postsCount(sequenceIds);
        });
        return count;
      },
    },
  },
  readPostsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const currentUser = context.currentUser;
        if (!currentUser) return 0;
        const createCompositeId = (sequenceId: string, userId: string) => `${sequenceId}-${userId}`;
        const splitCompositeId = (compositeId: string) => {
          const [sequenceId, userId] = compositeId.split("-");
          return {
            sequenceId,
            userId,
          };
        };
        const count = await getWithCustomLoader(
          context,
          "sequenceReadPostsCount",
          createCompositeId(sequence._id, currentUser._id),
          (compositeIds) => {
            return context.repos.sequences.readPostsCount(compositeIds.map(splitCompositeId));
          }
        );
        return count;
      },
    },
  },
  // This resolver isn't used within LessWrong AFAICT, but is used by an external API user
  chapters: {
    graphql: {
      outputType: "[Chapter!]!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const chapters = await context.Chapters.find(
          { sequenceId: sequence._id },
          { sort: { number: 1 } }
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "Chapters", chapters, context);
      },
    },
  },
  af: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentVoters"],
      canCreate: ["alignmentVoters"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Sequences">>;

export default schema;
