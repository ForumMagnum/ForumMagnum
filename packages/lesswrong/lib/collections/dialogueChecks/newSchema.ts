// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { accessFilterSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"DialogueChecks">> = {
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
  userId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
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
      type: "Boolean",
      canRead: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  checkedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
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
      type: "Boolean",
      canRead: ["members"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  matchPreference: {
    graphql: {
      type: "DialogueMatchPreference",
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
      type: "DialogueMatchPreference",
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
};

export default schema;
