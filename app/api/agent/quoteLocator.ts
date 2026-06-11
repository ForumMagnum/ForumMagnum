import {
  $getNodeByKey,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  type LexicalNode,
} from "lexical";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { $isMentionNode } from "@/components/research/lexical/MentionNode";
import { FOOTNOTE_ELEMENT_TYPES } from "@/components/editor/lexicalPlugins/footnotes/constants";
import { formatMathToken } from "@/lib/utils/mathTokens";
import {
  isHiddenFromAgentEdits,
  type MarkdownSelectionPoint,
} from "./mapMarkdownToLexical";

export type ProjectionSegmentKind = "text" | "linebreak" | "math" | "mention" | "separator";

export interface ProjectionSegment {
  kind: ProjectionSegmentKind
  /** Character range within the projected text. */
  start: number
  end: number
  /** Node key; absent for separator segments, which have no node. */
  key?: string
  /**
   * For math segments (atomic nodes with no internal text offsets): the
   * parent element and the node's child index, for element-point selection
   * around the whole node.
   */
  parentKey?: string
  childIndex?: number
}

interface NodeSpan {
  start: number
  end: number
}

export interface DocumentProjection {
  text: string
  segments: ProjectionSegment[]
  spans: Map<string, NodeSpan>
}

export interface ProjectedSelectionRange {
  /** Absolute character range in the document-order text projection. */
  start: number
  end: number
  /** The projected text covered by the selection. */
  text: string
}

function isBlockLevelChild(node: LexicalNode): boolean {
  if ($isElementNode(node)) return !node.isInline();
  if ($isDecoratorNode(node)) return !node.isInline();
  return false;
}

/**
 * First character of the text content following `node` among its next
 * siblings. Used for the digit-safe math token form: an inline equation
 * immediately followed by a digit must render as `\(…\)` (see
 * `formatMathToken`), matching what the agent read API emits.
 */
function firstCharOfSubtree(node: LexicalNode): string | undefined {
  if ($isTextNode(node)) {
    const text = node.getTextContent();
    return text.length > 0 ? text[0] : undefined;
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      const ch = firstCharOfSubtree(child);
      if (ch !== undefined) return ch;
    }
    return undefined;
  }
  const text = node.getTextContent();
  return text.length > 0 ? text[0] : undefined;
}

function firstFollowingChar(node: LexicalNode): string | undefined {
  // Descend to the first text leaf rather than materializing whole-subtree
  // text content (`getTextContent()` would build the entire following
  // block's string just to read one character).
  let sibling = node.getNextSibling();
  while (sibling) {
    const ch = firstCharOfSubtree(sibling);
    if (ch !== undefined) return ch;
    sibling = sibling.getNextSibling();
  }
  return undefined;
}

function pushSegment(
  projection: DocumentProjection,
  segment: Omit<ProjectionSegment, "start" | "end">,
  text: string,
): void {
  if (text.length === 0) return;
  const start = projection.text.length;
  projection.text += text;
  projection.segments.push({ ...segment, start, end: projection.text.length });
}

function projectNode(projection: DocumentProjection, node: LexicalNode): void {
  const start = projection.text.length;

  // Must precede the $isTextNode branch: FootnoteReferenceNode extends
  // TextNode, but agents see footnotes as markers they may omit when quoting,
  // so it projects to zero width (mirroring the matchers' node-side rule).
  if (node.getType() === FOOTNOTE_ELEMENT_TYPES.footnoteReference) {
    projection.spans.set(node.getKey(), { start, end: start });
    return;
  }

  if ($isTextNode(node)) {
    pushSegment(projection, { kind: "text", key: node.getKey() }, node.getTextContent());
  } else if ($isLineBreakNode(node)) {
    pushSegment(projection, { kind: "linebreak", key: node.getKey() }, "\n");
  } else if ($isMathNode(node)) {
    const equation = node.getEquation();
    const parent = node.getParent();
    if (equation && parent) {
      pushSegment(
        projection,
        {
          kind: "math",
          key: node.getKey(),
          parentKey: parent.getKey(),
          childIndex: node.getIndexWithinParent(),
        },
        formatMathToken({ equation, inline: node.isInline() }, firstFollowingChar(node)),
      );
    }
  } else if ($isMentionNode(node)) {
    // Research-doc mention chips project as their canonical token
    // (`@[doc:<id> "Title"]`), which is also how the read API serializes them
    // — so a quote containing a mention matches the chip, like math. Atomic:
    // selection boundaries fall on element points around the whole chip.
    const parent = node.getParent();
    if (parent) {
      pushSegment(
        projection,
        {
          kind: "mention",
          key: node.getKey(),
          parentKey: parent.getKey(),
          childIndex: node.getIndexWithinParent(),
        },
        node.getTextContent(),
      );
    }
  } else if ($isElementNode(node)) {
    let previousChildRendered = false;
    let previousChildWasBlock = false;
    for (const child of node.getChildren()) {
      if (isHiddenFromAgentEdits(child)) continue;
      const childIsBlock = isBlockLevelChild(child);
      if (previousChildRendered && (previousChildWasBlock || childIsBlock)) {
        pushSegment(projection, { kind: "separator" }, "\n\n");
      }
      projectNode(projection, child);
      previousChildRendered = true;
      previousChildWasBlock = childIsBlock;
    }
  }
  // Other decorator/leaf nodes (embeds, widgets, images, …) project to zero
  // width: Turndown either drops them or emits non-text forms (fences,
  // iframes) on the markdown side, so any text content they carry — embed
  // URLs, widget srcdoc — exists only on the tree side and must not enter
  // the matchable projection.

  projection.spans.set(node.getKey(), { start, end: projection.text.length });
}

/**
 * Build a document-order plain-text projection of the current editor state:
 * text nodes verbatim, linebreaks as `\n`, math as canonical (digit-safe)
 * tokens, footnote references zero-width, agent-hidden nodes omitted, and a
 * blank line between block-level siblings. Records both per-node character
 * spans (for resolving selection points) and the flat segment list (the
 * basis of the text-index locator's position mapping).
 *
 * Must be called inside a Lexical read/update context.
 */
export function $projectDocumentText(): DocumentProjection {
  const projection: DocumentProjection = { text: "", segments: [], spans: new Map() };
  projectNode(projection, $getRoot());
  return projection;
}

function resolveProjectedPoint(
  projection: DocumentProjection,
  point: MarkdownSelectionPoint,
  isFocus: boolean,
): number | null {
  const span = projection.spans.get(point.key);

  if (point.type === "text") {
    if (!span) return null;
    const length = span.end - span.start;
    return span.start + Math.max(0, Math.min(point.offset, length));
  }

  // Element point: `offset` is a child index within the element, marking the
  // boundary before child[offset]. For an anchor that boundary resolves to the
  // start of the next rendered child; for a focus, to the end of the previous
  // rendered child — so a block separator between the two children is never
  // included in the covered range.
  const parent = $getNodeByKey(point.key);
  if (!$isElementNode(parent)) return null;
  const children = parent.getChildren();

  if (isFocus) {
    for (let i = Math.min(point.offset, children.length) - 1; i >= 0; i--) {
      const childSpan = projection.spans.get(children[i].getKey());
      if (childSpan) return childSpan.end;
    }
    return span ? span.start : null;
  }

  for (let i = Math.max(point.offset, 0); i < children.length; i++) {
    const childSpan = projection.spans.get(children[i].getKey());
    if (childSpan) return childSpan.start;
  }
  return span ? span.end : null;
}

/**
 * Materialize a located selection to the text it covers in the document-order
 * projection. This is measurement infrastructure for comparing quote-locator
 * implementations: two selections cover the same content iff their projected
 * ranges agree, regardless of how anchor/focus are represented (text vs
 * element points, either side of a node boundary).
 *
 * Returns null when either point references a node with no projected span
 * (e.g. a stale key). Must be called inside a Lexical read/update context.
 */
export function $selectionCoveredText(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): ProjectedSelectionRange | null {
  const projection = $projectDocumentText();
  const anchorPosition = resolveProjectedPoint(projection, anchor, false);
  const focusPosition = resolveProjectedPoint(projection, focus, true);
  if (anchorPosition === null || focusPosition === null) return null;

  const start = Math.min(anchorPosition, focusPosition);
  const end = Math.max(anchorPosition, focusPosition);
  return { start, end, text: projection.text.slice(start, end) };
}
