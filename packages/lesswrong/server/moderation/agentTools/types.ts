import type { z } from "zod";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";

export interface ModerationAgentToolBindings {
  conversationId?: string;
  model?: string;
  defaultTargetUserId?: string;
}

export interface ModerationAgentTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  readOnly: boolean;
  execute: (args: unknown, context: ResolverContext, bindings: ModerationAgentToolBindings) => Promise<string>;
}

interface ModerationAgentToolSpec<S extends z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  inputSchema: S;
  readOnly: boolean;
  execute: (args: z.infer<S>, context: ResolverContext, bindings: ModerationAgentToolBindings) => Promise<string>;
}

// Every tool re-checks moderator access itself rather than relying on its mount
export function requireModeratorAccess(context: ResolverContext): DbUser {
  const { currentUser } = context;
  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    throw new Error("Moderator access required");
  }
  return currentUser;
}

export function defineModerationAgentTool<S extends z.ZodObject<z.ZodRawShape>>(spec: ModerationAgentToolSpec<S>): ModerationAgentTool {
  return {
    name: spec.name,
    description: spec.description,
    inputSchema: spec.inputSchema,
    readOnly: spec.readOnly,
    execute: async (args, context, bindings) => {
      const parsed = spec.inputSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for ${spec.name}: ${parsed.error.message}`);
      }
      return spec.execute(parsed.data, context, bindings);
    },
  };
}
