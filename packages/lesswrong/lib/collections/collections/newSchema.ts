// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getWithCustomLoader } from "../../loaders";
import { accessFilterMultiple, generateIdResolverSingle } from "../../utils/schemaUtils";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      hidden: true,
    },
  },
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
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Collections", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Collections",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 20,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Collections"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
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
      outputType: "String",
      canRead: ["guests"],
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
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {},
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {},
  },
  books: {
    graphql: {
      outputType: "[Book]",
      canRead: ["guests"],
      resolver: async (collection, args, context) => {
        const { currentUser, Books } = context;
        const books = await Books.find(
          {
            collectionId: collection._id,
          },
          {
            sort: {
              number: 1,
            },
          }
        ).fetch();
        return await accessFilterMultiple(currentUser, "Books", books, context);
      },
    },
  },
  postsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (collection, args, context) => {
        const count = await getWithCustomLoader(context, "collectionPostsCount", collection._id, (collectionIds) => {
          return context.repos.collections.postsCount(collectionIds);
        });
        return count;
      },
    },
  },
  readPostsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (collection, args, context) => {
        const currentUser = context.currentUser;
        if (!currentUser) return 0;
        const createCompositeId = (collectionId: string, userId: string) => `${collectionId}-${userId}`;
        const splitCompositeId = (compositeId: string) => {
          const [collectionId, userId] = compositeId.split("-");
          return {
            collectionId,
            userId,
          };
        };
        const count = await getWithCustomLoader(
          context,
          "collectionReadPostsCount",
          createCompositeId(collection._id, currentUser._id),
          (compositeIds) => {
            return context.repos.collections.readPostsCount(compositeIds.map(splitCompositeId));
          }
        );
        return count;
      },
    },
  },
  // Corresponds to a Cloudinary ID
  gridImageId: {
    database: {
      type: "TEXT",
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
    form: {},
  },
  firstPageLink: {
    database: {
      type: "TEXT",
      nullable: false,
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
    form: {},
  },
  hideStartReadingButton: {
    database: {
      type: "BOOL",
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {},
  },
  noindex: {
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
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {},
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Collections">>;

export default schema;
