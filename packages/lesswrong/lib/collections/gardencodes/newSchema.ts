import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from '@/lib/collections/revisions/revisionConstants';
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { documentIsNotDeleted, userOwns } from "@/lib/vulcan-users/permissions";
import moment from "moment";

function generateCode(length: number) {
  let result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const eventTypes = [
  {
    value: "public",
    label: "Displayed on the public Garden Calendar",
  },
  {
    value: "private",
    label: "Displayed only to you",
  },
];

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
      editableFieldOptions: { pingbacks: true, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("GardenCodes", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  pingbacks: {
    database: {
      type: "JSONB",
      denormalized: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: "guests",
      validation: {
        optional: true,
      },
    },
  },
  slug: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canCreate: ["admins"],
      canUpdate: ["admins"],
      slugCallbackOptions: {
        collectionsToAvoidCollisionsWith: ["GardenCodes"],
        getTitle: (gc) => gc.title!,
        onCollision: "newDocumentGetsSuffix",
        includesOldSlugs: false,
      },
      validation: {
        optional: true,
      },
    },
  },
  code: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      onCreate: () => {
        return generateCode(4);
      },
      validation: {
        optional: true,
      },
    },
  },
  title: {
    database: {
      type: "TEXT",
      defaultValue: "Guest Day Pass",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
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
      onCreate: ({ currentUser }) => currentUser?._id,
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
  startTime: {
    database: {
      type: "TIMESTAMPTZ",
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  endTime: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date!",
      inputType: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      onCreate: () => {
        return moment(new Date()).add(12, "hours").toDate();
      },
      validation: {
        optional: true,
      },
    },
  },
  fbLink: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  type: {
    database: {
      type: "TEXT",
      defaultValue: "public",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
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
      validation: {
        optional: true,
      },
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
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
  },
  afOnly: {
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["alignmentForum"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"GardenCodes">>;

export default schema;
