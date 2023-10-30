import { SafeParseError, SafeParseSuccess, z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.optional(z.string()),
  email: z.optional(z.string()),
  avatar: z.optional(z.string()),
  first_connected_at: z.optional(z.string()),
  last_connected_at: z.optional(z.string())
});

const DocumentUserSchema = z.object({
  id: z.string(),
});

const CommentSchema = z.object({
  id: z.string(),
  document_id: z.string(),
  thread_id: z.string(),
  content: z.string(),
  user: DocumentUserSchema,
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.optional(z.string()),
  attributes: z.record(z.any()),
  type: z.union([z.literal(1), z.literal(2)]),
});

const SuggestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.optional(z.record(z.any())),
  author_id: z.string(),
  attributes: z.record(z.any()),
  document_id: z.string(),
  deleted_at: z.optional(z.string()),
  created_at: z.string(),
  updated_at: z.optional(z.string()),
  state: z.union([z.literal('open'), z.literal('accepted'), z.literal('rejected')]),
  has_comments: z.boolean(),
});

const ThreadSchema = z.object({
  id: z.string(),
  document_id: z.string(),
  author_id: z.string(),
  deleted_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string(),
  unlinked_at: z.string(),
  resolved_by: z.string(),
  attributes: z.record(z.any()),
  context: z.object({
    key: z.string(),
  }),
});

const RevisionSchema = z.object({
  revision_id: z.string(),
  request_id: z.number(),
  name: z.string(),
  created_at: z.string(),
  creator_id: z.string(),
  from_version: z.number(),
  to_version: z.number(),
  authors_ids: z.array(z.string()),
  document_id: z.string(),
  diff_data: z.string(),
});

export const DocumentResponseSchema = z.object({
  id: z.string(),
  content: z.object({
    bundle_version: z.string(),
    data: z.string(),
    attributes: z.optional(z.object({
      main: z.optional(z.object({
        order: z.number(),
      })),
    })),
    version: z.optional(z.number())
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
