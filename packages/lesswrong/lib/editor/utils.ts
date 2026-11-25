import { randomId } from "../random";
import { getMarkdownItNoPlugins } from "../utils/markdownItPlugins";

// This currently only supports our limited subset of semVer
export function parseSemver(semver: string) {
  return semver.split(".").map((n) => parseInt(n, 10))
}

export function extractVersionsFromSemver(semver: string | null) {
  semver = semver || "1.0.0"
  const [major, minor, patch] = parseSemver(semver);
  return { major, minor, patch }
}

export function compareVersionNumbers(a: string, b: string): number {
  const [majorA,minorA,patchA] = parseSemver(a);
  const [majorB,minorB,patchB] = parseSemver(b);
  
  if (majorA>majorB) return 1;
  if (majorA<majorB) return -1;
  if (minorA>minorB) return 1;
  if (minorA<minorB) return -1;
  if (patchA>patchB) return 1;
  if (patchA<patchB) return -1;
  return 0;
}

export function markdownToHtmlSimple(markdown: string): string {
  const id = randomId()
  return getMarkdownItNoPlugins().render(markdown, {docId: id})
}

// An emptied Lexical editor reports `<p><br></p>` rather than an empty string.
const EMPTY_EDITOR_MARKUP = /^(?:\s|&nbsp;|<\/?p\b[^>]*>|<br\s*\/?>)*$/i;

/**
 * Whether markup consists only of empty paragraphs, line breaks and whitespace.
 * Content without text, such as an embedded video or a poll, is not empty.
 */
export function isEmptyEditorMarkup(html: string): boolean {
  return EMPTY_EDITOR_MARKUP.test(html);
}
