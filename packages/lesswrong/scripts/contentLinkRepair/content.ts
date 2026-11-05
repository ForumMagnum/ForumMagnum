import { z } from "zod";
import { cheerioParse } from "@/server/utils/htmlUtil";

// Shared machinery for REPL scripts that repair hyperlink destinations in Posts
// and Comments contents. See ../overcomingBiasLinks/README.md for the semantics.

export const collectionNameSchema = z.enum(["Posts", "Comments"]);

export interface LinkDocument {
  collectionName: "Posts" | "Comments";
  documentId: string;
}

// Generated types describe modern string data, but historical DraftJS revisions
// also store a JSON object (see revisionSchemaTypes.ts). Validate it at runtime.
export interface StoredContents {
  type: string;
  data: unknown;
  yjsState?: string | null;
}

export interface StoredRevision extends Omit<DbRevision, "originalContents"> {
  originalContents: StoredContents | null;
}

/** Decides which hyperlink destinations a repair is about, and what they become. */
export interface LinkRewriter {
  /** Inventory key for a relevant link destination, or null if the repair ignores it. */
  normalize: (href: string) => string | null;
  /** The new destination; returning `href` unchanged leaves the link alone. */
  replace: (href: string) => string;
}

export interface LinkRepair extends LinkRewriter {
  /** Commit message for a revision whose links were repaired. */
  commitMessage: string;
  /** Commit message for an unchanged newer draft, reappended so it stays the latest revision. */
  preservedDraftCommitMessage: string;
}

function transformHtml(html: string, rewriter: LinkRewriter, urls: Set<string>): string {
  const $ = cheerioParse(html);
  let changed = false;
  for (const element of $("a[href], area[href]").toArray()) {
    const href = $(element).attr("href");
    if (!href) continue;
    const normalized = rewriter.normalize(href);
    if (normalized) urls.add(normalized);
    const replacement = rewriter.replace(href);
    if (replacement !== href) {
      $(element).attr("href", replacement);
      changed = true;
    }
  }
  return changed ? $.html() : html;
}

const draftSchema = z.object({
  blocks: z.array(z.object({
    data: z.record(z.string(), z.unknown()).nullish(),
  }).passthrough()),
  entityMap: z.record(z.string(), z.object({
    type: z.string(),
    data: z.record(z.string(), z.unknown()),
  }).passthrough()),
}).passthrough();

/** Keep DraftJS text, offsets, entity IDs, and all non-link entity data intact. */
function transformDraft(data: unknown, rewriter: LinkRewriter, urls: Set<string>): unknown {
  const draft = draftSchema.parse(typeof data === "string" ? JSON.parse(data) : data);
  let changed = false;
  for (const entity of Object.values(draft.entityMap)) {
    if (entity.type !== "LINK") continue;
    for (const key of ["url", "href"]) {
      const value = entity.data[key];
      if (typeof value !== "string") continue;
      const normalized = rewriter.normalize(value);
      if (normalized) urls.add(normalized);
      const replacement = rewriter.replace(value);
      if (replacement !== value) {
        entity.data[key] = replacement;
        changed = true;
      }
    }
  }
  // DraftJS also embeds HTML in atomic blocks and inline entities (notably
  // legacy math markup). Repair anchors there without regenerating the block.
  for (const embedded of [
    ...draft.blocks.map(block => block.data),
    ...Object.values(draft.entityMap).map(entity => entity.data),
  ]) {
    if (typeof embedded?.html !== "string") continue;
    const html = transformHtml(embedded.html, rewriter, urls);
    if (html !== embedded.html) {
      embedded.html = html;
      changed = true;
    }
  }
  return changed ? (typeof data === "string" ? JSON.stringify(draft) : draft) : data;
}

export interface TransformedContents {
  html: string;
  originalContents: StoredContents | null;
  urls: string[];
  changed: boolean;
}

export function transformContents(
  revision: Pick<StoredRevision, "html" | "originalContents">,
  rewriter: LinkRewriter,
): TransformedContents {
  const urls = new Set<string>();
  const html = transformHtml(revision.html ?? "", rewriter, urls);
  let originalContents = revision.originalContents;
  const original = revision.originalContents;
  if (original) {
    let data: unknown = original.data;
    if (original.type === "html" || original.type === "ckEditorMarkup") {
      data = transformHtml(z.string().parse(data), rewriter, urls);
    } else if (original.type === "draftJS") {
      data = transformDraft(data, rewriter, urls);
    } else if (html !== (revision.html ?? "")) {
      throw new Error(`Unsupported editable format: ${original.type}`);
    }
    if (data !== original.data) {
      if (original.yjsState) throw new Error("Cannot rewrite content with a collaborative Yjs snapshot");
      originalContents = { ...original, data };
    }
  } else if (html !== (revision.html ?? "")) {
    // Very old imports can lack editable source; preserve their existing HTML.
    originalContents = { type: "html", data: html };
  }
  return {
    html,
    originalContents,
    urls: [...urls],
    changed: html !== (revision.html ?? "") || originalContents !== original,
  };
}
