export function truncateAiDigestText(text: string, maxLength: number): string {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  const initialSlice = normalizedText.slice(0, maxLength - 1);
  const lastCompleteWord = initialSlice.replace(/\s+\S*$/, "");
  return `${lastCompleteWord || initialSlice}…`;
}

export function selectAiDigestExcerpt(
  selectedExcerpt: string | undefined,
  fallbackText: string,
  maxLength: number,
): string {
  return truncateAiDigestText(selectedExcerpt?.trim() || fallbackText, maxLength);
}

export function countAiDigestWords(text: string): number {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  return normalizedText ? normalizedText.split(" ").length : 0;
}

export const AI_DIGEST_MAX_BYLINE_AUTHORS = 3;

interface AiDigestBylineAuthor {
  displayName: string;
}

/**
 * Comma-separated author byline, capped at AI_DIGEST_MAX_BYLINE_AUTHORS names
 * with "et al." standing in for the rest. Emails are static HTML, so this is a
 * count-based cap rather than the width-measuring TruncatedAuthorsList used on
 * post lists.
 */
export function formatAiDigestPostAuthors(post: {
  user: AiDigestBylineAuthor | null;
  coauthors: AiDigestBylineAuthor[] | null;
}): string {
  const authors = [post.user, ...(post.coauthors ?? [])].flatMap((author) =>
    author?.displayName ? [author.displayName] : [],
  );
  const displayed = authors.slice(0, AI_DIGEST_MAX_BYLINE_AUTHORS).join(", ");
  return authors.length > AI_DIGEST_MAX_BYLINE_AUTHORS ? `${displayed} et al.` : displayed;
}

export function formatAiDigestDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
