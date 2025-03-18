// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { userHasLlmChat } from "@/lib/betas";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";

const messageRoles = new TupleSet(["user", "assistant", "user-context", "assistant-context", "lw-assistant"] as const);
export const llmVisibleMessageRoles = new TupleSet(["user", "assistant", "assistant-context", "lw-assistant"] as const);
export type LlmVisibleMessageRole = UnionOf<typeof llmVisibleMessageRoles>;

export const userVisibleMessageRoles = new TupleSet(["user", "assistant", "user-context"] as const);
export type UserVisibleMessageRole = UnionOf<typeof userVisibleMessageRoles>;

const schema: Record<string, NewCollectionFieldSpecification<"LlmMessages">> = {
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
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  conversationId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  role: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
      validation: {
        allowedValues: ["user", "assistant", "user-context", "assistant-context", "lw-assistant"],
      },
    },
  },
  content: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
};

export default schema;
