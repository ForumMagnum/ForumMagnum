import { parseDocumentFromString } from "@/lib/domParser";

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
