// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
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
      outputType: "[JSON]",
      inputType: "[JSON]!",
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
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"DialogueMatchPreferences">>;

export default schema;
