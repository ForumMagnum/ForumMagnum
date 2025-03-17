// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { userHasLlmChat } from "@/lib/betas";
import { getFillIfMissing } from "@/lib/utils/schemaUtils";
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
  role: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: [userHasLlmChat, "admins"],
    },
  },
};

export default schema;
