import type { z } from "zod";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";

export interface ModerationAgentTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  execute: (args: unknown, context: ResolverContext) => Promise<string>;
}

interface ModerationAgentToolSpec<S extends z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  inputSchema: S;
  execute: (args: z.infer<S>, context: ResolverContext) => Promise<string>;
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
    execute: async (args, context) => {
      const parsed = spec.inputSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for ${spec.name}: ${parsed.error.message}`);
      }
      return spec.execute(parsed.data, context);
    },
  };
}
