import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { userOwns } from "@/lib/vulcan-users";

const messageRoles = new TupleSet(["user", "assistant", "user-context", "assistant-context", "lw-assistant"] as const);
export const llmVisibleMessageRoles = new TupleSet(["user", "assistant", "assistant-context", "lw-assistant"] as const);
export type LlmVisibleMessageRole = UnionOf<typeof llmVisibleMessageRoles>;

export const userVisibleMessageRoles = new TupleSet(["user", "assistant", "user-context"] as const);
export type UserVisibleMessageRole = UnionOf<typeof llmVisibleMessageRoles>;

const schema: SchemaType<"LlmMessages"> = {
  userId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  conversationId: {
    type: String,
    optional: true,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  role: {
    type: String,
    optional: false,
    nullable: false,
    allowedValues: [...messageRoles],
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  content: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "admins"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
}

export default schema;