// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userHasLlmChat } from "@/lib/betas";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";

const messageRoles = new TupleSet(["user", "assistant", "user-context", "assistant-context", "lw-assistant"] as const);
export const llmVisibleMessageRoles = new TupleSet(["user", "assistant", "assistant-context", "lw-assistant"] as const);
export type LlmVisibleMessageRole = UnionOf<typeof llmVisibleMessageRoles>;

export const userVisibleMessageRoles = new TupleSet(["user", "assistant", "user-context"] as const);
export type UserVisibleMessageRole = UnionOf<typeof userVisibleMessageRoles>;

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
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
} satisfies Record<string, NewCollectionFieldSpecification<"LlmMessages">>;

export default schema;
