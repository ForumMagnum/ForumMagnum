import { $isElementNode, type LexicalNode } from "lexical";
import { markdownToHtmlNoMath } from "@/server/editor/conversionUtils";
import { JSDOM } from "jsdom";
import { QUERY_INPUT_NODE_TYPE } from "@/components/research/lexical/QueryInputNode";
import { stripMathTokens, canonicalizeMathTokens, findMathSpansInMarkdown } from "@/lib/utils/mathTokens";

export interface MarkdownSelectionPoint {
  key: string
  offset: number
  type: "text" | "element"
}

export interface MarkdownQuoteSelectionResult {
  found: boolean
  anchor?: MarkdownSelectionPoint
  focus?: MarkdownSelectionPoint
  matchedNodeKey?: string
  reason?: string
}

// The plaintext returned here preserves a character-by-character ordering
// correspondence with the markdown source: each output character appears in
// the input in the same order, so callers can align plaintext positions back
// to markdown positions via a two-pointer walk (see `buildPlainToMarkdownMapping`
// in applyEditAtSelection). Keep this regex-based — do not swap to a
// markdown-it render, which adds trailing whitespace and trims input
// whitespace in ways that break position alignment. For the quote-matching
// projection (which needs CommonMark semantics for intraword `_`, literal
// `$`, etc.), use `markdownQuoteToRenderedPlainText` instead.
//
// Math tokens are projected to zero width: an equation is an opaque MathNode
// that contributes no text content to the Lexical document, so counting the
// equation body here would desynchronize replaceText narrowing offsets from
// the document's text-node walk (`$advancePoint`/`$retreatPoint`).
export function markdownQuoteToPlainText(value: string): string {
  return stripMathTokens(value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1"))
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
  while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[startInPlain]) mdIdx++;
  if (mdIdx === markdown.length) return null;
  const mdStart = mdIdx;
  mdIdx++;

  for (let plainIdx = startInPlain + 1; plainIdx < startInPlain + renderedQuote.length; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) mdIdx++;
    if (mdIdx === markdown.length) return null;
    mdIdx++;
  }
  const mdEnd = mdIdx;
  return { markdownQuote: markdown.slice(mdStart, mdEnd), mdStart, mdEnd };
}

// Sentinel that brackets a math span's index while the surrounding prose is
// rendered through markdown-it. U+E000 is a private-use character markdown-it
// treats as ordinary text and never transforms. The index makes restoration
// position-independent: if markdown-it drops a placeholder (e.g. a math span
// that landed in a link href, which renders to no visible text), the surviving
// placeholders still restore to their own equations rather than shifting onto
// the wrong ones.
const MATH_PLACEHOLDER_SENTINEL = String.fromCharCode(0xE000);
function mathPlaceholder(index: number): string {
  return MATH_PLACEHOLDER_SENTINEL + index + MATH_PLACEHOLDER_SENTINEL;
}
const MATH_PLACEHOLDER_REGEXP = new RegExp(
  MATH_PLACEHOLDER_SENTINEL + "(\\d+)" + MATH_PLACEHOLDER_SENTINEL,
  "g",
);

// Project an agent-supplied markdown quote to the rendered plaintext it
// represents, via markdown-it's CommonMark implementation. Preserves literal
// punctuation in content (e.g. `snake_case`, `2*3`, `` `code` ``) while
// stripping genuine emphasis/code wrappers.
//
// Math spans are swapped for placeholders before rendering and restored after:
// markdown-it would otherwise interpret markdown syntax *inside* an equation
// (`$a*b*$` as emphasis, `$a~b~c$` as a subscript, `\(x\)` as escaped parens)
// and corrupt it. The restored math is then run through
// `canonicalizeMathTokens` so every delimiter shape of an equation lands on
// one form.
export function markdownQuoteToRenderedPlainText(
  value: string,
  // Required (no default): the two adjacent layers default this flag in
  // opposite directions (the scanner to the LaTeX reading, the quote
  // projection to the escaped-bracket reading), so a silent default here
  // would be wrong for one of them.
  options: { bracketDisplayMath: boolean },
): string {
  const spans = findMathSpansInMarkdown(value, { bracketDisplayForm: options.bracketDisplayMath });
  const rawMath: string[] = [];
  let withPlaceholders = "";
  let cursor = 0;
  for (const span of spans) {
    withPlaceholders += value.slice(cursor, span.start) + mathPlaceholder(rawMath.length);
    rawMath.push(value.slice(span.start, span.end));
    cursor = span.end;
  }
  withPlaceholders += value.slice(cursor);

  const html = markdownToHtmlNoMath(withPlaceholders);
  const dom = new JSDOM(html);
  let rendered: string;
  try {
    rendered = dom.window.document.body.textContent ?? "";
  } finally {
    dom.window.close();
  }

  // A placeholder markdown-it dropped (e.g. one that landed in an href) simply
  // does not appear; the rest still map to the right equations.
  const restored = rendered.replace(
    MATH_PLACEHOLDER_REGEXP,
    (_match: string, index: string) => rawMath[Number(index)] ?? "",
  );
  return canonicalizeMathTokens(restored);
}

const HIDDEN_FROM_AGENT_EDITS_NODE_TYPES = new Set<string>([QUERY_INPUT_NODE_TYPE]);

export function isHiddenFromAgentEdits(node: LexicalNode): boolean {
  // Hidden node types are always elements; cheap pre-check skips the
  // getType() virtual dispatch for every TextNode in the document.
  return $isElementNode(node) && HIDDEN_FROM_AGENT_EDITS_NODE_TYPES.has(node.getType());
}
