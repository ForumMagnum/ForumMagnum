// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { accessFilterSingle } from "../../utils/schemaUtils";

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
  userId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  targetUserId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  checked: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  checkedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  hideInRecommendations: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  matchPreference: {
    graphql: {
      outputType: "DialogueMatchPreference",
      canRead: ["members", "admins"],
      resolver: async (dialogueCheck, args, context) => {
        const { DialogueMatchPreferences } = context;
        const matchPreference = await DialogueMatchPreferences.findOne({
          dialogueCheckId: dialogueCheck._id,
          deleted: {
            $ne: true,
          },
        });
        return await accessFilterSingle(context.currentUser, "DialogueMatchPreferences", matchPreference, context);
      },
    },
  },
  reciprocalMatchPreference: {
    graphql: {
      outputType: "DialogueMatchPreference",
      canRead: ["members", "admins"],
      resolver: async (dialogueCheck, args, context) => {
        const { DialogueMatchPreferences, DialogueChecks } = context;
        const matchingDialogueCheck = await DialogueChecks.findOne({
          userId: dialogueCheck.targetUserId,
          targetUserId: dialogueCheck.userId,
        });
        if (!matchingDialogueCheck) return null;
        const reciprocalMatchPreference = await DialogueMatchPreferences.findOne({
          dialogueCheckId: matchingDialogueCheck._id,
          deleted: {
            $ne: true,
          },
        });
        return await accessFilterSingle(
          context.currentUser,
          "DialogueMatchPreferences",
          reciprocalMatchPreference,
          context
        );
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"DialogueChecks">>;

export default schema;
