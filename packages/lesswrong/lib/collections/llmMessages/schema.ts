import { userHasLlmChat } from "@/lib/betas";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { userOwns } from "@/lib/vulcan-users/permissions.ts";

const messageRoles = new TupleSet(["user", "assistant", "user-context", "assistant-context", "lw-assistant"] as const);
export const llmVisibleMessageRoles = new TupleSet(["user", "assistant", "assistant-context", "lw-assistant"] as const);
export type LlmVisibleMessageRole = UnionOf<typeof llmVisibleMessageRoles>;

export const userVisibleMessageRoles = new TupleSet(["user", "assistant", "user-context"] as const);
export type UserVisibleMessageRole = UnionOf<typeof userVisibleMessageRoles>;

const schema: SchemaType<"LlmMessages"> = {
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  conversationId: {
    type: String,
    optional: true,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  role: {
    type: String,
    optional: false,
    nullable: false,
    allowedValues: [...messageRoles],
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
  content: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: [userHasLlmChat, "admins"],
    canUpdate: ["admins"],
  },
}

export default schema;
