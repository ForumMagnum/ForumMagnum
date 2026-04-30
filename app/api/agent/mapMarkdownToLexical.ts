import { $generateHtmlFromNodes } from "@lexical/html";
import {
  $getNodeByKey,
  $isDecoratorNode,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
} from "lexical";
import { htmlToMarkdown, markdownToHtml, markdownToHtmlNoMath } from "@/server/editor/conversionUtils";
import { JSDOM } from "jsdom";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor, normalizeText, paragraphMarkdownStartsWith, plainTextStartsWith } from "./editorAgentUtil";
import { FOOTNOTE_ELEMENT_TYPES } from "@/components/editor/lexicalPlugins/footnotes/constants";
import { $isListNode } from "@lexical/list";

/**
 * Recursively serialize a Lexical node and its children to JSON.
 * Lexical's internal `exportNodeToJSON` is not exported, but we need
 * the same behaviour: call `exportJSON()` on the node, then walk its
 * element children and push their serialized forms into the `children`
 * array that `exportJSON()` leaves empty.
 */
function exportNodeToJSONRecursive(node: LexicalNode): SerializedLexicalNode {
  const serialized = node.exportJSON();
  if ($isElementNode(node)) {
    const children = node.getChildren().map(exportNodeToJSONRecursive);
    (serialized as AnyBecauseHard).children = children;
  }
  return serialized;
}

export interface MarkdownSelectionPoint {
  key: string
  offset: number
  type: "text" | "element"
}

export interface NodeMarkdownEntry {
  key: string
  type: string
  depth: number
  markdown: string
}

export interface NodeMarkdownMapResult {
  entries: NodeMarkdownEntry[]
  byKey: Map<string, NodeMarkdownEntry>
}

export interface MarkdownQuoteSelectionResult {
  found: boolean
  anchor?: MarkdownSelectionPoint
  focus?: MarkdownSelectionPoint
  matchedNodeKey?: string
  matchedNodeType?: string
  matchedMarkdown?: string
  reason?: string
}

function stripSimpleMarkdownPunctuation(value: string): string {
  return value.replace(/[*_`~]/g, "");
}

function normalizeEmphasisMarkerStyle(value: string): string {
  return value.replace(/\*/g, "_");
}

function normalizeMathDelimiters(value: string): string {
  return value
    .replace(/\\\(([\s\S]*?)\\\)/g, "$$$1$")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$$$1$$");
}

function normalizeForSemanticMatch(value: string): string {
  return normalizeText(normalizeMathDelimiters(normalizeEmphasisMarkerStyle(value)));
}

// The plaintext returned here preserves a character-by-character ordering
// correspondence with the markdown source: each output character appears in
// the input in the same order, so callers can align plaintext positions back
// to markdown positions via a two-pointer walk (see `buildPlainToMarkdownMapping`
// in replaceText). Keep this regex-based — do not swap to a markdown-it render,
// which adds trailing whitespace and trims input whitespace in ways that break
// position alignment. For the quote-matching projection (which needs CommonMark
// semantics for intraword `_`, literal `$`, etc.), use
// `markdownQuoteToRenderedPlainText` instead.
export function markdownQuoteToPlainText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/[*_`~]/g, "");
}

/**
 * Locate a rendered-text quote (as captured by a DOM selection on the post's
 * rendered HTML) in the post's markdown source, returning the markdown
 * substring that corresponds to the same content. Returns null if the
 * rendered quote can't be located.
 *
 * Why we need this: DOM selections strip inline markdown markers (`**`, `_`,
 * `` ` ``, `~`), so a quote that spans across a `<strong>...</strong>` boundary
 * is a contiguous string in rendered form but a discontiguous one in markdown
 * (the asterisks interrupt it). Plain `markdown.indexOf(renderedQuote)` fails
 * for such quotes.
 *
 * Approach: project the markdown onto its plain-text view via
 * `markdownQuoteToPlainText` while preserving a 1:1 character-position mapping
 * back to the markdown source (greedy two-pointer alignment). Find the
 * rendered quote in the plain text and slice the corresponding markdown range.
 * The returned markdown substring may include orphan markers (e.g. a closing
 * `**` with no opener) — that's intentional, the caller uses it for substring
 * matching only, not for re-rendering.
 */
export function findRenderedQuoteInMarkdown(
  markdown: string,
  renderedQuote: string,
): { markdownQuote: string; mdStart: number; mdEnd: number } | null {
  if (renderedQuote.length === 0) return null;
  const plainText = markdownQuoteToPlainText(markdown);
  const startInPlain = plainText.indexOf(renderedQuote);
  if (startInPlain === -1) return null;

  // Two-pointer walk: advance through markdown, matching characters against
  // plainText. Markers are skipped automatically because `markdownQuoteToPlainText`
  // dropped them. mdStart is captured when we reach the quote's first char;
  // mdEnd is one past the last char.
  let mdIdx = 0;
  for (let plainIdx = 0; plainIdx < startInPlain; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) mdIdx++;
    if (mdIdx === markdown.length) return null;
    mdIdx++;
  }
  const mdStart = (() => {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[startInPlain]) mdIdx++;
    return mdIdx;
  })();
  if (mdStart === markdown.length) return null;

  for (let plainIdx = startInPlain; plainIdx < startInPlain + renderedQuote.length; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) mdIdx++;
    if (mdIdx === markdown.length) return null;
    mdIdx++;
  }
  const mdEnd = mdIdx;
  return { markdownQuote: markdown.slice(mdStart, mdEnd), mdStart, mdEnd };
}

// Project an agent-supplied markdown quote to the rendered plaintext it
// represents, via markdown-it's CommonMark implementation. Preserves literal
// punctuation in content (e.g. `snake_case`, `2*3`, `` `code` ``) while
// stripping genuine emphasis/code wrappers.
//
// Uses the no-mathjax markdown-it variant so `$...$` and `\(...\)` survive as
// literal text, matching the `$equation$` form that `appendSegments` emits for
// MathNode segments on the document side. Math delimiters are normalized up
// front so `\(...\)` and `\[...\]` quotes fold onto the `$...$` shape.
export function markdownQuoteToRenderedPlainText(value: string): string {
  const html = markdownToHtmlNoMath(normalizeMathDelimiters(value));
  const dom = new JSDOM(html);
  return dom.window.document.body.textContent ?? "";
}

/**
 * Parse markdown through the markdown-it pipeline and extract the rendered
 * plain text, producing a filter string suitable for
 * `buildNodeMarkdownMapForSubtree`. This handles all block-level and inline
 * markdown syntax (headings, blockquotes, lists, links, emphasis, etc.)
 * without hardcoding individual patterns.
 */
export function toPlainTextFilter(markdownQuote: string): string {
  const html = markdownToHtml(markdownQuote);
  const dom = new JSDOM(html);
  const textOnly = dom.window.document.body.textContent;
  return normalizeText(textOnly);
}

/**
 * Map a character index in a whitespace-normalized (trimmed, collapsed, lowercased)
 * string back to the corresponding index in the original lowercased string.
 * Implements the inverse of `normalizeText` for position tracking in O(n).
 */
function mapNormalizedIndexToRaw(rawLower: string, targetNormalizedIndex: number): number {
  let normalizedIndex = 0;
  let inLeadingWhitespace = true;
  let prevWasWhitespace = false;
  for (let i = 0; i < rawLower.length; i++) {
    const ch = rawLower[i];
    const isWs = /\s/.test(ch);
    if (inLeadingWhitespace) {
      if (isWs) continue;
      inLeadingWhitespace = false;
    }
    if (isWs) {
      if (!prevWasWhitespace) {
        if (normalizedIndex === targetNormalizedIndex) return i;
        normalizedIndex++;
      }
      prevWasWhitespace = true;
    } else {
      if (normalizedIndex === targetNormalizedIndex) return i;
      normalizedIndex++;
      prevWasWhitespace = false;
    }
  }
  return -1;
}

function findTextRangeInNodeByPlainQuote(
  node: LexicalNode,
  markdownQuote: string
): { anchor: MarkdownSelectionPoint, focus: MarkdownSelectionPoint } | null {
  const plainQuoteRaw = markdownQuoteToRenderedPlainText(markdownQuote).trim();
  const plainQuote = normalizeText(plainQuoteRaw);
  if (!plainQuoteRaw || !plainQuote) {
    return null;
  }

  const segments: Array<{
    kind: "text" | "math"
    key: string
    text: string
  }> = [];

  const appendSegments = (currentNode: LexicalNode) => {
    // Must precede the $isTextNode branch: FootnoteReferenceNode extends
    // TextNode with content `[N]`, but agents reading via the markdown API
    // see footnotes as `[^id]` and naturally omit them when quoting.
    if (currentNode.getType() === FOOTNOTE_ELEMENT_TYPES.footnoteReference) {
      return;
    }

    if ($isTextNode(currentNode)) {
      segments.push({
        kind: "text",
        key: currentNode.getKey(),
        text: currentNode.getTextContent(),
      });
      return;
    }

    if (currentNode.getType() === "math") {
      const serializedNode = currentNode.exportJSON() as { equation?: string } | undefined;
      const equation = serializedNode?.equation;
      if (equation) {
        segments.push({
          kind: "math",
          key: currentNode.getKey(),
          text: `$${equation}$`,
        });
      }
      return;
    }

    if ($isElementNode(currentNode)) {
      for (const child of currentNode.getChildren()) {
        appendSegments(child);
      }
    }
  };

  appendSegments(node);
  if (segments.length === 0) {
    return null;
  }

  const combined = segments.map((segment) => segment.text).join("");
  let rawStartIndex = combined.toLowerCase().indexOf(plainQuoteRaw.toLowerCase());
  let rawEndExclusive: number;
  if (rawStartIndex === -1) {
    // Fallback when whitespace normalization is needed.
    // We need to find the range in the original (un-normalized) text that corresponds
    // to the normalized quote, correctly mapping offsets despite whitespace differences.
    // Normalize the full string once and search within it (O(n)), instead of
    // re-normalizing a suffix at every position (which was O(n²)).
    const rawLower = combined.toLowerCase();
    const normalizedCombined = normalizeText(rawLower);
    const normalizedMatchIdx = normalizedCombined.indexOf(plainQuote);
    const fallbackStart = normalizedMatchIdx === -1
      ? -1
      : mapNormalizedIndexToRaw(rawLower, normalizedMatchIdx);
    if (fallbackStart === -1) {
      return null;
    }

    // Skip any leading whitespace at fallbackStart to find the true start of content,
    // since normalizeText trims leading whitespace.
    let trueStart = fallbackStart;
    while (trueStart < rawLower.length && /\s/.test(rawLower[trueStart])) {
      trueStart++;
    }
    rawStartIndex = trueStart;

    // Walk through the original text to find how many original characters correspond
    // to the normalized quote. We consume normalized characters one at a time, skipping
    // extra whitespace in the original.
    let normalizedConsumed = 0;
    let rawCursor = rawStartIndex;
    while (normalizedConsumed < plainQuote.length && rawCursor < rawLower.length) {
      const rawChar = rawLower[rawCursor];
      const normalizedChar = plainQuote[normalizedConsumed];
      if (/\s/.test(rawChar) && normalizedChar === " ") {
        // Both are whitespace: consume the normalized space, then skip all
        // remaining whitespace in the original.
        normalizedConsumed++;
        rawCursor++;
        while (rawCursor < rawLower.length && /\s/.test(rawLower[rawCursor])) {
          rawCursor++;
        }
      } else {
        normalizedConsumed++;
        rawCursor++;
      }
    }
    rawEndExclusive = rawCursor;
  } else {
    rawEndExclusive = rawStartIndex + plainQuoteRaw.length;
  }
  const locatePoint = (rawIndex: number, preferAfterMath: boolean): MarkdownSelectionPoint | null => {
    let cursor = 0;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentStart = cursor;
      const segmentEnd = cursor + segment.text.length;
      if (rawIndex >= segmentStart && rawIndex <= segmentEnd) {
        if (segment.kind === "text") {
          return {
            key: segment.key,
            offset: rawIndex - segmentStart,
            type: "text",
          };
        }

        // For math segments, snap to nearest surrounding text point.
        if (preferAfterMath) {
          for (let j = i + 1; j < segments.length; j++) {
            if (segments[j].kind === "text") {
              return { key: segments[j].key, offset: 0, type: "text" };
            }
          }
        }
        for (let j = i - 1; j >= 0; j--) {
          if (segments[j].kind === "text") {
            return { key: segments[j].key, offset: segments[j].text.length, type: "text" };
          }
        }
        return null;
      }
      cursor = segmentEnd;
    }
    return null;
  };

  const anchor = locatePoint(rawStartIndex, false);
  const focus = locatePoint(rawEndExclusive, true);
  if (!anchor || !focus) {
    return null;
  }

  return {
    anchor,
    focus,
  };
}

function serializeNodeSubtreeToMarkdown(node: LexicalNode, editor: LexicalEditor): string {
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if (!$isElementNode(node) && !$isDecoratorNode(node)) {
    return node.getTextContent();
  }

  const rootChildren = node.getType() === "root" && $isElementNode(node)
    ? node.getChildren().map((child) => exportNodeToJSONRecursive(child))
    : [exportNodeToJSONRecursive(node)];
  const state = {
    root: {
      children: rootChildren,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
  const parsedState = editor.parseEditorState(JSON.stringify(state));
  editor.setEditorState(parsedState);

  const html = withDomGlobals(() => {
    let generated = "";
    editor.getEditorState().read(() => {
      generated = $generateHtmlFromNodes(editor, null);
    });
    return generated;
  });

  return htmlToMarkdown(html);
}

// Must mirror the exclusions in `appendSegments` so the filter stage of
// `buildNodeMarkdownMapForSubtree` sees the same text that the per-paragraph
// matcher will later search against. Otherwise a paragraph containing a
// footnote reference gets filtered out before ever reaching the matcher.
function getTextContentForQuoteMatching(node: LexicalNode): string {
  if (node.getType() === FOOTNOTE_ELEMENT_TYPES.footnoteReference) {
    return "";
  }
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if ($isElementNode(node)) {
    return node.getChildren().map(getTextContentForQuoteMatching).join("");
  }
  return node.getTextContent();
}

function collectSubtreeNodes(rootNode: LexicalNode): Array<{ node: LexicalNode, depth: number }> {
  const collected: Array<{ node: LexicalNode, depth: number }> = [];

  const visit = (node: LexicalNode, depth: number) => {
    collected.push({ node, depth });
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        visit(child, depth + 1);
      }
    }
  };

  visit(rootNode, 0);
  return collected;
}

/**
 * Build markdown serializations for every node in the subtree rooted at rootNodeKey.
 * Must be called inside a Lexical read/update context.
 *
 * When `textFilter` is provided, nodes whose plain-text content clearly cannot
 * contain the filter string are skipped, avoiding expensive markdown serialization
 * (JSDOM + Turndown) for non-matching nodes.
 */
export function buildNodeMarkdownMapForSubtree(rootNodeKey: string, textFilter?: string): NodeMarkdownMapResult {
  const rootNode = $getNodeByKey(rootNodeKey);
  if (!rootNode) {
    return { entries: [], byKey: new Map() };
  }

  const reusableEditor = createHeadlessEditor("MapMarkdownToLexical");
  const entries: NodeMarkdownEntry[] = [];
  const byKey = new Map<string, NodeMarkdownEntry>();
  for (const { node, depth } of collectSubtreeNodes(rootNode)) {
    if (textFilter) {
      const textContent = normalizeText(getTextContentForQuoteMatching(node));
      // Skip nodes whose text content is non-empty and clearly doesn't contain
      // the filter. Nodes with empty text content (e.g. decorator/math nodes)
      // are kept to avoid false negatives.
      if (textContent && !textContent.includes(textFilter)) {
        continue;
      }
    }
    const entry: NodeMarkdownEntry = {
      key: node.getKey(),
      type: node.getType(),
      depth,
      markdown: serializeNodeSubtreeToMarkdown(node, reusableEditor),
    };
    entries.push(entry);
    byKey.set(entry.key, entry);
  }
  return { entries, byKey };
}

/**
 * Locate a top-level (or list-item) node whose markdown / plain-text content
 * starts with the given prefix, for block-level operations like deleteBlock.
 *
 * For each top-level child of root:
 *   - If the child is a list, descend into its list-item children and try to
 *     match each item individually. Returns the list item if matched, so the
 *     caller can operate on a single item rather than the whole list (the
 *     agent API previously matched the list-as-a-whole on its first item's
 *     text and then deleted the entire list).
 *   - Otherwise try to match the child itself (paragraphs, tables, headings,
 *     spoiler blocks, …). Tables are matched as a top-level block — there's
 *     no useful "delete a single cell" semantics in markdown.
 *
 * Must be called inside a Lexical read/update context.
 */
export function findBlockToOperateOnByPrefix({
  rootChildren,
  prefix,
  mapResult,
  textFilter,
}: {
  rootChildren: LexicalNode[]
  prefix: string
  mapResult: NodeMarkdownMapResult
  textFilter: string
}): LexicalNode | null {
  const matches = (node: LexicalNode): boolean => {
    const markdown = mapResult.byKey.get(node.getKey())?.markdown;
    if (markdown && paragraphMarkdownStartsWith(markdown, prefix)) return true;
    const text = node.getTextContent();
    if (plainTextStartsWith(text, prefix)) return true;
    if (textFilter.length > 0 && normalizeText(text).startsWith(textFilter)) return true;
    return false;
  };

  for (const child of rootChildren) {
    if ($isListNode(child)) {
      for (const item of child.getChildren()) {
        if (matches(item)) return item;
      }
      // No list-item matched: don't fall through to matching the list as a
      // whole, since that would just match the first item's text and delete
      // the entire list.
      continue;
    }
    if (matches(child)) return child;
  }
  return null;
}

function createElementRangeAroundNode(node: LexicalNode): MarkdownQuoteSelectionResult {
  const parent = node.getParent();
  if (!parent) {
    return { found: false, reason: "Matched node has no parent for range selection." };
  }

  const indexWithinParent = node.getIndexWithinParent();
  return {
    found: true,
    matchedNodeKey: node.getKey(),
    matchedNodeType: node.getType(),
    anchor: {
      key: parent.getKey(),
      offset: indexWithinParent,
      type: "element",
    },
    focus: {
      key: parent.getKey(),
      offset: indexWithinParent + 1,
      type: "element",
    },
  };
}

/**
 * Locate a markdown quote in a subtree and return a Lexical-compatible selection range.
 * Must be called inside a Lexical read/update context.
 */
export function locateMarkdownQuoteSelectionInSubtree({
  rootNodeKey,
  markdownQuote,
  mapResult,
}: {
  rootNodeKey: string
  markdownQuote: string
  mapResult?: NodeMarkdownMapResult
}): MarkdownQuoteSelectionResult {
  const normalizedQuote = normalizeText(markdownQuote);
  const normalizedQuoteMarkdownInsensitive = toPlainTextFilter(markdownQuote);
  const normalizedQuoteMarkerStyleInsensitive = normalizeForSemanticMatch(markdownQuote);
  if (!normalizedQuote) {
    return { found: false, reason: "Quote was empty after normalization." };
  }

  const plainTextFilter = toPlainTextFilter(markdownQuote);
  const mapping = mapResult ?? buildNodeMarkdownMapForSubtree(rootNodeKey, plainTextFilter);
  if (mapping.entries.length === 0) {
    return { found: false, reason: "No nodes found for subtree." };
  }

  const candidates = mapping.entries
    .filter(({ markdown }) => {
      const normalizedCandidate = normalizeText(markdown);
      if (normalizedCandidate.includes(normalizedQuote)) {
        return true;
      }
      const normalizedCandidateMarkerStyleInsensitive = normalizeForSemanticMatch(markdown);
      if (normalizedCandidateMarkerStyleInsensitive.includes(normalizedQuoteMarkerStyleInsensitive)) {
        return true;
      }
      if (!normalizedQuoteMarkdownInsensitive) {
        return false;
      }
      return toPlainTextFilter(markdown).includes(normalizedQuoteMarkdownInsensitive);
    })
    .sort((a, b) => b.depth - a.depth || a.markdown.length - b.markdown.length);

  if (candidates.length === 0) {
    const rootNode = $getNodeByKey(rootNodeKey);
    if (rootNode) {
      const fallbackRange = findTextRangeInNodeByPlainQuote(rootNode, markdownQuote);
      if (fallbackRange) {
        return {
          found: true,
          matchedNodeKey: rootNode.getKey(),
          matchedNodeType: rootNode.getType(),
          matchedMarkdown: "",
          anchor: fallbackRange.anchor,
          focus: fallbackRange.focus,
        };
      }
    }
  }

  for (const candidate of candidates) {
    const node = $getNodeByKey(candidate.key);
    if (!node) {
      continue;
    }

    if ($isTextNode(node)) {
      const rawNodeText = node.getTextContent();
      const textMatchIdx = rawNodeText.toLowerCase().indexOf(markdownQuote.toLowerCase());
      if (textMatchIdx >= 0) {
        return {
          found: true,
          matchedNodeKey: node.getKey(),
          matchedNodeType: node.getType(),
          matchedMarkdown: candidate.markdown,
          anchor: {
            key: node.getKey(),
            offset: textMatchIdx,
            type: "text",
          },
          focus: {
            key: node.getKey(),
            offset: textMatchIdx + markdownQuote.length,
            type: "text",
          },
        };
      }

      const markdownInsensitiveQuote = stripSimpleMarkdownPunctuation(markdownQuote);
      const markdownInsensitiveMatchIdx = markdownInsensitiveQuote
        ? rawNodeText.toLowerCase().indexOf(markdownInsensitiveQuote.toLowerCase())
        : -1;
      if (markdownInsensitiveMatchIdx >= 0) {
        return {
          found: true,
          matchedNodeKey: node.getKey(),
          matchedNodeType: node.getType(),
          matchedMarkdown: candidate.markdown,
          anchor: {
            key: node.getKey(),
            offset: markdownInsensitiveMatchIdx,
            type: "text",
          },
          focus: {
            key: node.getKey(),
            offset: markdownInsensitiveMatchIdx + markdownInsensitiveQuote.length,
            type: "text",
          },
        };
      }
    }

    const plainRange = findTextRangeInNodeByPlainQuote(node, markdownQuote);
    if (plainRange) {
      return {
        found: true,
        matchedNodeKey: node.getKey(),
        matchedNodeType: node.getType(),
        matchedMarkdown: candidate.markdown,
        anchor: plainRange.anchor,
        focus: plainRange.focus,
      };
    }

    const normalizedCandidate = normalizeForSemanticMatch(candidate.markdown);
    if (normalizedCandidate === normalizedQuote || node.getType() === "math") {
      const elementRange = createElementRangeAroundNode(node);
      if (elementRange.found) {
        return {
          ...elementRange,
          matchedMarkdown: candidate.markdown,
        };
      }
    }
  }

  return { found: false, reason: "No markdown quote match found in subtree map." };
}

/**
 * Convenience wrapper for callers holding an editor object.
 */
export function locateMarkdownQuoteSelectionInEditor({
  editor,
  rootNodeKey,
  markdownQuote,
}: {
  editor: LexicalEditor
  rootNodeKey: string
  markdownQuote: string
}): MarkdownQuoteSelectionResult {
  let result: MarkdownQuoteSelectionResult = { found: false, reason: "Editor read did not run." };
  editor.getEditorState().read(() => {
    const plainTextFilter = toPlainTextFilter(markdownQuote);
    const mapResult = buildNodeMarkdownMapForSubtree(rootNodeKey, plainTextFilter);
    result = locateMarkdownQuoteSelectionInSubtree({ rootNodeKey, markdownQuote, mapResult });
  });
  return result;
}
