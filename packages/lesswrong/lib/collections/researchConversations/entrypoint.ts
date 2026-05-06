import { z } from 'zod';

/**
 * Discriminated union of conversation entrypoints — every research
 * conversation (whether started in a chat panel, an AgentBlock embedded in a
 * document, an ad-hoc query modal, a sub-agent spawn, or a fork) carries one
 * of these on the `entrypoint` JSONB column.
 *
 * Single source of truth so T3, T4, T5 don't drift on the discriminator
 * shapes (see design doc, "Open questions" #6).
 */

const entityRefSchema = z.object({
  kind: z.enum(['document', 'conversation', 'anchor']),
  id: z.string(),
  // Optional anchor id (only set for `kind: 'document'` references that target
  // a span inside the doc rather than the whole doc).
  anchorId: z.string().optional(),
});

export const chatEntrypointSchema = z.object({
  kind: z.literal('chat'),
});

export const documentEntrypointSchema = z.object({
  kind: z.literal('document'),
  documentId: z.string(),
  // Stable anchor id; for block-level AgentBlocks this is the block id, for
  // range-selection queries it's the MarkNode anchor id. Same namespace.
  anchorId: z.string(),
});

export const queryModalEntrypointSchema = z.object({
  kind: z.literal('query_modal'),
  references: z.array(entityRefSchema),
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
  queryModalEntrypointSchema,
  subagentEntrypointSchema,
  forkEntrypointSchema,
]);

export type EntityRef = z.infer<typeof entityRefSchema>;
export type ChatEntrypoint = z.infer<typeof chatEntrypointSchema>;
export type DocumentEntrypoint = z.infer<typeof documentEntrypointSchema>;
export type QueryModalEntrypoint = z.infer<typeof queryModalEntrypointSchema>;
export type SubagentEntrypoint = z.infer<typeof subagentEntrypointSchema>;
export type ForkEntrypoint = z.infer<typeof forkEntrypointSchema>;
export type Entrypoint = z.infer<typeof entrypointSchema>;
export type EntrypointKind = Entrypoint['kind'];
