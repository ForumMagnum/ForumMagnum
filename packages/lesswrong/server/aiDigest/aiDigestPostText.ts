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

interface AiDigestPostWithHtml {
  post: AiDigestPostTextTarget;
  html: string;
}

function hasHtml(postWithHtml: { post: AiDigestPostTextTarget; html: string | null | undefined }): postWithHtml is AiDigestPostWithHtml {
  return !!postWithHtml.html?.trim();
}

/** The posts whose revision has any HTML, each with that HTML. */
export async function loadAiDigestPostHtml(
  posts: AiDigestPostTextTarget[],
  context: ResolverContext,
): Promise<AiDigestPostWithHtml[]> {
  const revisions = await context.Revisions.find(
    { _id: { $in: posts.map((post) => post.revisionId) } },
    {},
    { _id: 1, html: 1 },
  ).fetch();
  const htmlByRevisionId = new Map(revisions.map((revision) => [revision._id, revision.html]));
  return posts
    .map((post) => ({ post, html: htmlByRevisionId.get(post.revisionId) }))
    .filter(hasHtml);
}
