// These types are global so that the `AiDigestIssues.spec` schema field can
// name them in its `typescriptType`. To augment the global scope this must be
// a module; to be a module, it needs at least one import or export.
export {}

declare global {

type AiDigestSectionKind = "recommendations" | "discussion" | "curated";

type AiDigestDocumentRef =
  | { documentType: "post"; documentId: string }
  | { documentType: "comment"; documentId: string }
  | { documentType: "quickTake"; documentId: string };

type AiDigestPlacement = "headline" | "compact" | "full" | "quiet";

interface AiDigestItem {
  documentRef: AiDigestDocumentRef;
  reason?: string;
  placement: AiDigestPlacement;
  isRead?: boolean;
  previewHtml?: string;
  /** For discussion items: every comment to show, the anchor (the item's document) included. */
  commentIds?: string[];
}

interface AiDigestSection {
  kind: AiDigestSectionKind;
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
  preheader: string;
  aiNote: AiDigestAiNote;
  personalInstructions?: string;
  sections: AiDigestSection[];
}

}
