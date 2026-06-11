import path from "path";
import { normalizeText } from "../../../../../app/api/agent/editorAgentUtil";

/**
 * All harness data (corpus snapshots, recovered quotes, result details) lives
 * under this gitignored directory. Corpus documents are published posts, but
 * post contents and quotes are still treated as sensitive user data: scripts
 * print only aggregate statistics and IDs to stdout, and write anything
 * containing document text to files in this directory instead.
 */
export const HARNESS_DATA_DIR = path.join(process.cwd(), "quoteMatchHarnessData");
export const CORPUS_DIR = path.join(HARNESS_DATA_DIR, "corpus");
export const RESULTS_DIR = path.join(HARNESS_DATA_DIR, "results");
export const RECOVERED_QUOTES_FILE = path.join(HARNESS_DATA_DIR, "recoveredCommentQuotes.jsonl");

export interface CorpusDocument {
  postId: string
  yjsStateBase64: string
  /** YjsDocuments.updatedAt at fetch time, ISO format. */
  yjsUpdatedAt: string
  fetchedAt: string
}

export interface RecoveredQuote {
  postId: string
  threadId: string
  quote: string
  /** Epoch ms of the thread's first comment, for lining up against revisions. */
  commentTimeStamp: number | null
  /**
   * Authoritative outcome of the original commentOnDraft call, from the
   * analytics event with this threadId: "attached_by_quote_match",
   * "top_level_no_match", or null when no event was found (e.g. event
   * predates threadId capture, or no analytics DB configured).
   */
  analyticsResult: string | null
  /**
   * Whether the thread's mark id appears in the post's *current* main-doc
   * Yjs state (literal byte search). Distinct from the historical outcome:
   * marks disappear when the quoted text is edited away, the thread is
   * resolved, or Yjs garbage-collects deleted content.
   */
  markPresentInCurrentDoc: boolean
}

/**
 * Harness-level text canonicalization for scoring matches. Deliberately more
 * aggressive than the production `normalizeText`: perturbed quotes simulate
 * agent transcription infidelity (ellipsis form, unicode composition), and a
 * locator that selects the right document range should score as correct even
 * when the document's surface form differs from the quote's.
 */
export function harnessCanonicalize(value: string): string {
  return normalizeText(value)
    .normalize("NFKC")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}
