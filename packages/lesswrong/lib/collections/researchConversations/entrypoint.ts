import { z } from 'zod';

/**
 * Discriminated union of conversation entrypoints — every research
 * conversation (whether started in a chat panel, an AgentBlock embedded in a
 * document, a sub-agent spawn, or a fork) carries one of these on the
 * `entrypoint` JSONB column.
 */

export const chatEntrypointSchema = z.object({
  kind: z.literal('chat'),
});

export const documentEntrypointSchema = z.object({
  kind: z.literal('document'),
  documentId: z.string(),
});

export const subagentEntrypointSchema = z.object({
  kind: z.literal('subagent'),
  parentConversationId: z.string(),
});

export const forkEntrypointSchema = z.object({
  kind: z.literal('fork'),
  parentConversationId: z.string(),
  forkedAtSeq: z.number().int().nonnegative(),
});

export const entrypointSchema = z.discriminatedUnion('kind', [
  chatEntrypointSchema,
  documentEntrypointSchema,
  subagentEntrypointSchema,
  forkEntrypointSchema,
]);

export type ChatEntrypoint = z.infer<typeof chatEntrypointSchema>;
export type DocumentEntrypoint = z.infer<typeof documentEntrypointSchema>;
export type SubagentEntrypoint = z.infer<typeof subagentEntrypointSchema>;
export type ForkEntrypoint = z.infer<typeof forkEntrypointSchema>;
export type Entrypoint = z.infer<typeof entrypointSchema>;
export type EntrypointKind = Entrypoint['kind'];
