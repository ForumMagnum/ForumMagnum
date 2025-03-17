// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import SimpleSchema from "simpl-schema";
import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";
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

const schema: Record<string, NewCollectionFieldSpecification<"DialogueMatchPreferences">> = {
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
  dialogueCheckId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "DialogueChecks",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
    },
  },
  dialogueCheck: {
    graphql: {
      type: "DialogueCheck",
      canRead: ["members", "admins"],
      resolver: generateIdResolverSingle({
        collectionName: "DialogueMatchPreferences",
        fieldName: "dialogueCheckId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
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
      type: "[JSON]",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing([]),
      onUpdate: throwIfSetToNull,
      validation: {
        simpleSchema: FILL_THIS_IN,
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
      type: "String",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(""),
      onUpdate: throwIfSetToNull,
    },
  },
  syncPreference: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
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
      type: "String",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(""),
      onUpdate: throwIfSetToNull,
    },
  },
  calendlyLink: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["members", "admins"],
      canUpdate: ["members", "admins"],
      canCreate: ["members", "admins"],
    },
  },
  generatedDialogueId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["members", "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
};

export default schema;
