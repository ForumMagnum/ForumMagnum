import { z } from "zod";
import { cheerioParse } from "@/server/utils/htmlUtil";

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

export const inventorySchema = z.object({
  urls: z.array(z.string()),
  documents: z.array(z.object({
    collectionName: collectionNameSchema,
    documentId: z.string(),
  })),
});

export const lookupResultSchema = z.object({
  source: z.string(),
  status: z.enum(["resolved", "not-found", "error"]),
  target: z.string().optional(),
  archivedTarget: z.string().optional(),
  snapshot: z.string().optional(),
  error: z.string().optional(),
  excludeFragments: z.boolean().optional(),
});

export interface LookupResult extends z.infer<typeof lookupResultSchema> {}

/** CDX treats http/https and www/apex alike. Fragments are not sent to servers. */
export function normalizeObUrl(value: string): string | null {
  try {
    const url = new URL(value.startsWith("//") ? `http:${value}` : value);
    if (!["http:", "https:"].includes(url.protocol)
      || !["overcomingbias.com", "www.overcomingbias.com"].includes(url.hostname)
      || url.username || url.password || url.port) return null;
    url.protocol = "http:";
    url.hostname = "www.overcomingbias.com";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function parseLwUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)
      || !["lesswrong.com", "www.lesswrong.com"].includes(url.hostname)
      || url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

export function replacementUrl(value: string, replacements: ReadonlyMap<string, string>, excludeFragmentSources?: ReadonlySet<string>): string {
  const source = normalizeObUrl(value);
  const target = source && replacements.get(source);
  if (!target) return value;
  const url = new URL(target);
  const original = new URL(value.startsWith("//") ? `http:${value}` : value);
  if (source && original.hash && excludeFragmentSources?.has(source)) return value;
  // HTTP redirects inherit the original fragment unless Location supplies one.
  if (!url.hash) url.hash = original.hash;
  return url.href;
}

function transformHtml(html: string, replacements: ReadonlyMap<string, string>, urls: Set<string>, excludeFragmentSources?: ReadonlySet<string>): string {
  const $ = cheerioParse(html);
  let changed = false;
  for (const element of $("a[href], area[href]").toArray()) {
    const href = $(element).attr("href");
    if (!href) continue;
    const normalized = normalizeObUrl(href);
    if (normalized) urls.add(normalized);
    const replacement = replacementUrl(href, replacements, excludeFragmentSources);
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
function transformDraft(data: unknown, replacements: ReadonlyMap<string, string>, urls: Set<string>, excludeFragmentSources?: ReadonlySet<string>): unknown {
  const draft = draftSchema.parse(typeof data === "string" ? JSON.parse(data) : data);
  let changed = false;
  for (const entity of Object.values(draft.entityMap)) {
    if (entity.type !== "LINK") continue;
    for (const key of ["url", "href"]) {
      const value = entity.data[key];
      if (typeof value !== "string") continue;
      const normalized = normalizeObUrl(value);
      if (normalized) urls.add(normalized);
      const replacement = replacementUrl(value, replacements, excludeFragmentSources);
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
    const html = transformHtml(embedded.html, replacements, urls, excludeFragmentSources);
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
  replacements: ReadonlyMap<string, string> = new Map(),
  excludeFragmentSources?: ReadonlySet<string>,
): TransformedContents {
  const urls = new Set<string>();
  const html = transformHtml(revision.html ?? "", replacements, urls, excludeFragmentSources);
  let originalContents = revision.originalContents;
  const original = revision.originalContents;
  if (original) {
    let data: unknown = original.data;
    if (original.type === "html" || original.type === "ckEditorMarkup") {
      data = transformHtml(z.string().parse(data), replacements, urls, excludeFragmentSources);
    } else if (original.type === "draftJS") {
      data = transformDraft(data, replacements, urls, excludeFragmentSources);
    } else if (html !== (revision.html ?? "") && replacements.size) {
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
