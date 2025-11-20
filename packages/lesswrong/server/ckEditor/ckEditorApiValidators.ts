import { SafeParseError, SafeParseSuccess, z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.optional(z.string()),
  email: z.optional(z.string()),
  avatar: z.optional(z.string()),
  first_connected_at: z.optional(z.string()),
  last_connected_at: z.optional(z.string())
});

const CommentSchema = z.object({
  id: z.string(),
  document_id: z.optional(z.string()),
  thread_id: z.string(),
  content: z.string(),
  attributes: z.record(z.any()).nullable(),
  user: z.any(),
  type: z.union([z.literal(1), z.literal(2)]),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

const SuggestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.any()).nullable(),
  author_id: z.string(),
  attributes: z.record(z.any()).nullable(),
  document_id: z.optional(z.string()),
  deleted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  state: z.union([z.literal('open'), z.literal('accepted'), z.literal('rejected')]),
  has_comments: z.boolean(),
});

const ThreadSchema = z.object({
  id: z.string(),
  document_id: z.optional(z.string()),
  author_id: z.string(),
  created_at: z.string(),
  updated_at: z.optional(z.string()),
  deleted_at: z.optional(z.string()),
  resolved_at: z.optional(z.string()),
  resolved_by: z.optional(z.string()),
  context: z.optional(z.object({
    key: z.string(),
  })),
  attributes: z.optional(z.record(z.any())),
  unlinked_at: z.optional(z.string()),
});

const RevisionSchema = z.object({
  revision_id: z.string(),
  request_id: z.optional(z.string()),
  name: z.string(),
  created_at: z.string(),
  creator_id: z.string(),
  from_version: z.number(),
  to_version: z.number(),
  authors_ids: z.array(z.string()),
  diff_data: z.string(),
});

export const DocumentResponseSchema = z.object({
  id: z.string(),
  content: z.object({
    bundle_version: z.string(),
    data: z.string(),
    version: z.optional(z.number()),
    attributes: z.optional(z.any())
  }),
  comments: z.array(CommentSchema),
  suggestions: z.array(SuggestionSchema),
  threads: z.array(ThreadSchema),
  revisions: z.array(RevisionSchema),
});

export type CkEditorImportComment = z.TypeOf<typeof CommentSchema>;
export type CkEditorImportSuggestion = z.TypeOf<typeof SuggestionSchema>;

export type DocumentResponse = z.TypeOf<typeof DocumentResponseSchema>;
export type CkEditorUser = z.TypeOf<typeof UserSchema>;

export interface CreateDocumentPayload extends DocumentResponse {
  content: DocumentResponse['content'] & {
    use_initial_data: boolean
  }
}
