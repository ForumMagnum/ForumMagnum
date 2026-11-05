import { DomUtils, parseDocument } from 'htmlparser2';
import { isTag, type Document, type Element, type Node } from 'domhandler';

/**
 * Helpers for editing an HTML string at the positions of parsed elements,
 * without re-serializing the rest of it. String edits made this way can't be
 * confused by markup-like text inside attribute values, which stored HTML can
 * contain unescaped (eg `alt="<a>"`).
 */
export interface SourceRange {
  start: number,
  end: number,
}

export function parseDocumentWithSourceRanges(html: string): Document {
  return parseDocument(html, { withStartIndices: true, withEndIndices: true });
}

/**
 * The range of the source string from the start of `first` to the end of
 * `last`, which must be from a document parsed with
 * `parseDocumentWithSourceRanges`.
 */
export function getSourceRange(first: Node, last: Node = first): SourceRange {
  if (first.startIndex === null || last.endIndex === null) {
    throw new Error("HTML node is missing its source location");
  }
  return { start: first.startIndex, end: last.endIndex + 1 };
}

function hasAncestorWithTagName(element: Element, tagName: string): boolean {
  const parent = element.parent;
  if (!parent || !isTag(parent)) {
    return false;
  }
  return parent.name === tagName || hasAncestorWithTagName(parent, tagName);
}

/**
 * The source ranges of the elements with the given tag name, in document
 * order, excluding ones nested inside another element with that tag name.
 */
export function getElementSourceRanges(html: string, tagName: string): SourceRange[] {
  const document = parseDocumentWithSourceRanges(html);
  return DomUtils.getElementsByTagName(tagName, document)
    .filter((element) => !hasAncestorWithTagName(element, tagName))
    .map((element) => getSourceRange(element));
}

/**
 * Replace each of the given ranges of `html`, which must be in ascending order
 * and non-overlapping.
 */
export function replaceSourceRanges(html: string, ranges: SourceRange[], getReplacement: (rangeHtml: string) => string): string {
  const keptSlices = [...ranges, { start: html.length, end: html.length }].map(({ start }, i) => (
    html.slice(i === 0 ? 0 : ranges[i - 1].end, start)
  ));
  const replacements = ranges.map(({ start, end }) => getReplacement(html.slice(start, end)));
  return keptSlices.flatMap((slice, i) => [slice, replacements[i] ?? '']).join('');
}
