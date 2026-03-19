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
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor, normalizeText } from "./editorAgentUtil";

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

function normalizeForMarkdownInsensitiveMatch(value: string): string {
  return normalizeText(markdownQuoteToPlainText(value));
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

export function markdownQuoteToPlainText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/[*_`~]/g, "");
}

function findTextRangeInNodeByPlainQuote(
  node: LexicalNode,
  markdownQuote: string
): { anchor: MarkdownSelectionPoint, focus: MarkdownSelectionPoint } | null {
  const plainQuoteRaw = markdownQuoteToPlainText(markdownQuote).trim();
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
    const rawLower = combined.toLowerCase();
    let fallbackStart = -1;
    for (let i = 0; i < rawLower.length; i++) {
      const candidateNormalized = normalizeText(rawLower.slice(i));
      if (candidateNormalized.startsWith(plainQuote)) {
        fallbackStart = i;
        break;
      }
    }
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

function serializeNodeSubtreeToMarkdown(node: LexicalNode): string {
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if (!$isElementNode(node) && !$isDecoratorNode(node)) {
    return node.getTextContent();
  }

  const headlessEditor = createHeadlessEditor("MapMarkdownToLexical");

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
  const parsedState = headlessEditor.parseEditorState(JSON.stringify(state));
  headlessEditor.setEditorState(parsedState);

  const html = withDomGlobals(() => {
    let generated = "";
    headlessEditor.getEditorState().read(() => {
      generated = $generateHtmlFromNodes(headlessEditor, null);
    });
    return generated;
  });

  return htmlToMarkdown(html);
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
 */
export function buildNodeMarkdownMapForSubtree(rootNodeKey: string): NodeMarkdownMapResult {
  const rootNode = $getNodeByKey(rootNodeKey);
  if (!rootNode) {
    return { entries: [], byKey: new Map() };
  }

  const entries: NodeMarkdownEntry[] = [];
  const byKey = new Map<string, NodeMarkdownEntry>();
  for (const { node, depth } of collectSubtreeNodes(rootNode)) {
    const entry: NodeMarkdownEntry = {
      key: node.getKey(),
      type: node.getType(),
      depth,
      markdown: serializeNodeSubtreeToMarkdown(node),
    };
    entries.push(entry);
    byKey.set(entry.key, entry);
  }
  return { entries, byKey };
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
  const normalizedQuoteMarkdownInsensitive = normalizeForMarkdownInsensitiveMatch(markdownQuote);
  const normalizedQuoteMarkerStyleInsensitive = normalizeForSemanticMatch(markdownQuote);
  if (!normalizedQuote) {
    return { found: false, reason: "Quote was empty after normalization." };
  }

  const mapping = mapResult ?? buildNodeMarkdownMapForSubtree(rootNodeKey);
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
      return normalizeForMarkdownInsensitiveMatch(markdown).includes(normalizedQuoteMarkdownInsensitive);
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
    const mapResult = buildNodeMarkdownMapForSubtree(rootNodeKey);
    result = locateMarkdownQuoteSelectionInSubtree({ rootNodeKey, markdownQuote, mapResult });
  });
  return result;
}
