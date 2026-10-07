import type { z } from "zod";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";

/**
 * Values bound by the mount (chat route or MCP server) rather than supplied
 * by the model. Write tools use these to attribute their output; the model
 * cannot spoof them.
 */
export interface ModerationAgentToolBindings {
  conversationId?: string;
  model?: string;
  /** The user the current agent session is scoped to, if any */
  defaultTargetUserId?: string;
}

/**
 * A transport-agnostic moderation agent tool. The same definitions are
 * mounted on the in-app AI SDK chat route and (read-only tools only) on the
 * MCP server. Results are strings (JSON or markdown) so they can be returned
 * verbatim over either transport.
 */
export interface ModerationAgentTool {
  name: string;
  description: string;
  /** Plain zod object: `.shape` feeds MCP registration, the schema itself feeds the AI SDK */
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

/**
 * Every tool re-checks moderator access itself, regardless of transport;
 * mounts also gate up front, but the tools must not rely on that.
 */
export function requireModeratorAccess(context: ResolverContext): DbUser {
  const { currentUser } = context;
  if (!currentUser || !userIsAdminOrMod(currentUser)) {
    throw new Error("Moderator access required");
  }
  return currentUser;
}

/**
 * Defines a tool with typed args: the returned tool parses its input against
 * the zod schema at the boundary, so implementations get typed args without
 * casts and malformed input fails with a clear error.
 */
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
