import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getDenormalizedEditableResolver, getNormalizedEditableResolver, getNormalizedEditableSqlResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  frontpageDescription: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescription"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  frontpageDescription_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  frontpageDescriptionMobile: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescriptionMobile"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  frontpageDescriptionMobile_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  postPageDescription: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "postPageDescription"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  postPageDescription_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  startDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  endDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  darkColor: {
    database: {
      type: "TEXT",
      defaultValue: "#000000",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  lightColor: {
    database: {
      type: "TEXT",
      defaultValue: "#ffffff",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  bannerTextColor: {
    database: {
      type: "TEXT",
      defaultValue: "#ffffff",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
    },
  },
  contrastColor: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
      nullable: true,
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
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  comment: {
    graphql: {
      outputType: "Comment",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "commentId" }),
    },
  },
  bannerImageId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  /** @deprecated Set `eventFormat` to "POLL" instead */
  includesPoll: {
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
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  isGlobal: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members"], // newCheck ensures this can only be false for user-created events
      validation: {
        optional: true,
      },
    },
  },
  eventFormat: {
    database: {
      type: "TEXT",
      defaultValue: "BASIC",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "ForumEventFormat!",
      inputType: "ForumEventFormat",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["BASIC", "POLL", "STICKERS"],
        optional: true,
      },
    },
  },
  pollQuestion: {
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("pollQuestion"),
      sqlResolver: getNormalizedEditableSqlResolver("pollQuestion"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },  
  },
  pollQuestion_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  pollAgreeWording: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  pollDisagreeWording: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  maxStickersPerUser: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      inputType: "Float",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  customComponent: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "ForumEventCustomComponent!",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
        allowedValues: ['GivingSeason2024Banner'],
      },
    },
  },
  commentPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["members"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  /**
    Used to store public event data, like public poll votes.
    For the AI Welfare Debate Week, it was structured like:
    {<userId>: {
      x: <number>,
      points: {
        <postId>: <number>
      }
    }}
  */
  publicData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
      canUpdate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  voteCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: ({ publicData }) => (publicData ? Object.keys(publicData).length : 0),
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ForumEvents">>;

export default schema;
