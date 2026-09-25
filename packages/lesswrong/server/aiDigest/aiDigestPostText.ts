import { collapseAiDigestWhitespace } from "@/lib/aiDigest/aiDigestDisplay";
import { htmlToTextDefault } from "@/lib/htmlToText";

/** A post revision the digest generates cached text (a summary or a preview) for. */
export interface AiDigestPostTextTarget {
  postId: string;
  revisionId: string;
  title: string;
  author: string;
}

/** The HTML as a single line of plain text, cut to `maxLength` characters. */
export function aiDigestPlainText(html: string, maxLength = Infinity): string {
  return collapseAiDigestWhitespace(htmlToTextDefault(html)).slice(0, maxLength);
}

/** The HTML of the given revisions, by revision ID. Revisions with no HTML are left out. */
export async function loadAiDigestRevisionHtml(revisionIds: string[], context: ResolverContext): Promise<Map<string, string>> {
  if (revisionIds.length === 0) {
    return new Map();
  }
  const revisions = await context.Revisions.find({ _id: { $in: revisionIds } }, {}, { _id: 1, html: 1 }).fetch();
  const htmlByRevisionId = new Map<string, string>();
  for (const { _id, html } of revisions) {
    if (html?.trim()) {
      htmlByRevisionId.set(_id, html);
    }
  }
  return htmlByRevisionId;
}
