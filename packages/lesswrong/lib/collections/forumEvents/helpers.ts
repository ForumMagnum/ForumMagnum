import { parseDocumentFromString } from "@/lib/domParser";
import { postGetPageUrl, PostsMinimumForGetPageUrl } from "../posts/helpers";

/**
 * Gets a URL to a poll on a post page. The poll will scroll into view when the page loads.
 */
export function getPollUrl(post: PostsMinimumForGetPageUrl, pollId: string, isAbsolute = false): string {
  const baseUrl = postGetPageUrl(post, isAbsolute);
  return `${baseUrl}?pollId=${pollId}`;
}

/**
 * Removes any footnotes and converts what remains to plain text. Only tested against basic html as
 * this is designed for ForumEvent poll questions (which are generally 1 sentence with optional footnotes).
 */
export function stripFootnotes(html: string): string {
  const { document } = parseDocumentFromString(html);

  // Remove every footnote reference
  document.querySelectorAll(".footnote-reference").forEach(ref => ref.remove());

  // Remove the entire .footnotes block (where the list of footnotes usually lives)
  const footnotesBlock = document.querySelector(".footnotes");
  footnotesBlock?.remove();

  return (document.body.textContent || "").trim();
}

export const SCALING_SERIES_ID = "HvynzLsZDJm4vS2gL";
