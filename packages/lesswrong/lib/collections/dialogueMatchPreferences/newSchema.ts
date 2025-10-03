import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import SimpleSchema from "@/lib/utils/simpleSchema";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

export const SYNC_PREFERENCE_VALUES = ["Yes", "Meh", "No"] as const;
export type SyncPreference = (typeof SYNC_PREFERENCE_VALUES)[number];

const topicPreferenceSchema = new SimpleSchema({
  text: {
    type: String,
  },
  preference: {
    type: String,
    allowedValues: ["Yes", "No"],
  },
  commentSourceId: {
    type: String,
    optional: true,
    nullable: true,
  },
});

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  dialogueCheckId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "DialogueChecks",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
    },
  },
  dialogueCheck: {
    graphql: {
      outputType: "DialogueCheck",
      canRead: ["members", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "DialogueChecks", fieldName: "dialogueCheckId" }),
    },
  },
  topicPreferences: {
    database: {
      type: "JSONB[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "[JSON!]",
      inputType: "[JSON!]!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: [topicPreferenceSchema],
      },
    },
  },
  topicNotes: {
    database: {
      type: "TEXT",
      defaultValue: "",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
    },
  },
  syncPreference: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["Yes", "Meh", "No"],
      },
    },
  },
  asyncPreference: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      validation: {
        allowedValues: ["Yes", "Meh", "No"],
      },
    },
  },
  formatNotes: {
    database: {
      type: "TEXT",
      defaultValue: "",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
    },
  },
  calendlyLink: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  generatedDialogueId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["members", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"DialogueMatchPreferences">>;

export default schema;
