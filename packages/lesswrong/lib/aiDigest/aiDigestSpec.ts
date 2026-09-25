// These types are global so that the `AiDigestIssues.spec` schema field can
// name them in its `typescriptType`. To augment the global scope this must be
// a module; to be a module, it needs at least one import or export.
export {}

declare global {

/**
 * The persisted shape of one AI digest issue (`AiDigestIssues.spec`), shared
 * by the selection pipeline, the email renderer, and the on-site issue view.
 */
type AiDigestSectionKind = "recommendations" | "discussion" | "curated";

type AiDigestDocumentRef =
  | { documentType: "post"; documentId: string }
  | { documentType: "comment"; documentId: string }
  | { documentType: "quickTake"; documentId: string };

type AiDigestPlacement = "headline" | "compact" | "full" | "quiet";

interface AiDigestThreadComment {
  commentId: string;
}

interface AiDigestItem {
  documentRef: AiDigestDocumentRef;
  /** Omitted for quiet items (e.g. the curated module), which carry no personalized reason. */
  reason?: string;
  placement: AiDigestPlacement;
  /**
   * Whether the recipient had already read this post when the digest was
   * generated. Quiet curated items render with a greyed-out title when true.
   */
  isRead?: boolean;
  /**
   * For post items: the opening of the post as HTML, with any epistemic-status
   * style preamble trimmed off. Absent when no cleaned preview could be built,
   * in which case the plaintext description is shown instead.
   */
  previewHtml?: string;
  /** For discussion items: the selected replies. */
  threadComments?: AiDigestThreadComment[];
  /** Optional ancestor chain grounding the selection in reader engagement. */
  contextComments?: AiDigestThreadComment[];
}

interface AiDigestSection {
  kind: AiDigestSectionKind;
  /** Omitted for sections that render without a heading (e.g. recommendations). */
  title?: string;
  items: AiDigestItem[];
}

interface AiDigestAiNote {
  modelName: string;
  paragraphs: string[];
}

interface AiDigestSpec {
  recipientName: string;
  subject: string;
  /** Hidden preview text shown after the subject in most email clients. */
  preheader: string;
  /** One to three short paragraphs explaining the personalized recommendations. */
  aiNote: AiDigestAiNote;
  /** The reader's own custom instructions, echoed back beneath the AI note. */
  personalInstructions?: string;
  sections: AiDigestSection[];
}

}
