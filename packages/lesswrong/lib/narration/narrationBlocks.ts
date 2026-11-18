import { cyrb53 } from "@/lib/utils/cyrb53";

/**
 * Splits post content into the blocks that narration is generated from and
 * aligned to. This runs on the server (against the stored HTML of a revision,
 * parsed with linkedom) and in the browser (against the rendered post body),
 * and the two must produce the same fingerprint for the same block: the
 * narration script identifies blocks by fingerprint, and the player finds them
 * in the page by fingerprint. So this only uses the parts of the DOM API that
 * both implementations share, and only depends on things that survive
 * rendering (text content, equations' TeX source), not on ids or attributes
 * that rendering adds.
 *
 * A text block is a maximal run of inline content inside one block-level
 * element, so every text node belongs to exactly one block. Its `sourceText`
 * is that content with whitespace collapsed; offsets into `sourceText` are how
 * narration timings refer to positions within the block.
 *
 * Tables are handled in one of two ways. A table with a single column is
 * being used for layout (typically to put a background colour behind some
 * paragraphs), so its contents are treated as if the table weren't there. Any
 * other table produces one block per row.
 */

export type NarrationOmittedKind = "code" | "spoiler" | "embed";

export interface NarrationTextPiece {
  type: "text"
  node: Text
  sourceStart: number
  /** For each character this node contributed to sourceText, its offset in the node's data */
  rawOffsets: number[]
  linkHref: string|null
}

export interface NarrationMathPiece {
  type: "math"
  element: Element
  sourceStart: number
  sourceEnd: number
  tex: string
  display: boolean
}

export interface NarrationFootnoteRefPiece {
  type: "footnoteRef"
  element: Element
  sourceStart: number
  footnoteId: string
}

export type NarrationPiece = NarrationTextPiece | NarrationMathPiece | NarrationFootnoteRefPiece;

export interface NarrationTextBlock {
  type: "text"
  container: Element
  sourceText: string
  pieces: NarrationPiece[]
  fingerprint: string
}

export interface NarrationOmittedBlock {
  type: "omitted"
  element: Element
  omittedKind: NarrationOmittedKind
  fingerprint: string
}

export interface NarrationTableRowBlock {
  type: "tableRow"
  /** The <tr> */
  element: Element
  table: Element
  /** The text of each cell, in the same form as a text block's sourceText */
  cells: string[]
  isHeader: boolean
  fingerprint: string
}

export type NarrationDomBlock = NarrationTextBlock | NarrationOmittedBlock | NarrationTableRowBlock;

/** Matches the list item that holds a footnote's content, in the footnotes section at the end of a post */
export const footnoteItemSelector = "[data-footnote-item], .footnote-item";
/** Matches the marker in the text that refers to a footnote */
export const footnoteReferenceSelector = "[data-footnote-reference], .footnote-reference";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const blockLevelTags = new Set([
  "address", "article", "aside", "blockquote", "center", "dd", "details", "dialog", "div", "dl", "dt",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hgroup", "li", "main", "menu", "nav", "ol", "p", "section", "summary", "ul",
]);

const skippedTags = new Set(["style", "script", "noscript", "template", "svg", "button", "select", "input", "textarea"]);

const tableSectionTags = new Set(["thead", "tbody", "tfoot"]);
const tableRowTags = new Set(["tr"]);
const tableCellTags = new Set(["td", "th"]);
const tableCaptionTags = new Set(["caption"]);

const omittedKindByTag = new Map<string, NarrationOmittedKind>([
  ["pre", "code"],
  ["iframe", "embed"],
  ["video", "embed"],
  ["audio", "embed"],
  ["object", "embed"],
  ["embed", "embed"],
]);

const omittedKindByClass = new Map<string, NarrationOmittedKind>([
  ["spoilers", "spoiler"],
  ["spoiler", "spoiler"],
  ["spoiler-v2", "spoiler"],
  ["metaculus-preview", "embed"],
  ["manifold-preview", "embed"],
  ["neuronpedia-preview", "embed"],
  ["elicit-binary-prediction", "embed"],
  ["thoughtSaverFrameWrapper", "embed"],
  ["strawpoll-embed", "embed"],
  ["estimaker-preview", "embed"],
  ["viewpoints-preview", "embed"],
  ["calendly-preview", "embed"],
  ["lwartifacts-preview", "embed"],
]);

const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);

function isTextNode(node: Node): node is Text {
  return node.nodeType === TEXT_NODE;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
}

function getClassNames(element: Element): string[] {
  return (element.getAttribute("class") ?? "").split(/\s+/).filter(className => className.length > 0);
}

function getOmittedKind(tagName: string, classNames: string[]): NarrationOmittedKind|null {
  const omittedClassName = classNames.find(className => omittedKindByClass.has(className));
  return omittedKindByTag.get(tagName) ?? omittedKindByClass.get(omittedClassName ?? "") ?? null;
}

function isFootnoteBackLink(element: Element, classNames: string[]): boolean {
  return classNames.includes("footnote-back-link")
    || classNames.includes("footnote-backref")
    || element.hasAttribute("data-footnote-back-link");
}

function isFootnoteReference(element: Element, classNames: string[]): boolean {
  return classNames.includes("footnote-reference") || element.hasAttribute("data-footnote-reference");
}

interface MathSource {
  tex: string
  display: boolean
}

/**
 * Recognizes a server-rendered equation, in either of the two formats that
 * stored post HTML contains (MathJax 3's <mjx-container>, and the older
 * MathJax 2 span.mjx-chtml). Both carry their TeX source in an aria-label.
 */
function getMathSource(element: Element, tagName: string, classNames: string[]): MathSource|null {
  if (tagName === "mjx-container") {
    return {
      tex: element.getAttribute("aria-label") ?? "",
      display: element.getAttribute("display") === "true",
    };
  }
  if (classNames.includes("mjx-chtml")) {
    return {
      tex: element.querySelector(".mjx-math")?.getAttribute("aria-label") ?? "",
      display: classNames.includes("MJXc-display"),
    };
  }
  return null;
}

function normalizeWhitespace(text: string): string {
  return text.split(ZERO_WIDTH_SPACE).join("").replace(/\s+/g, " ").trim();
}

function fingerprintText(text: string): string {
  return cyrb53(text).toString(36);
}

interface OpenRun {
  container: Element
  sourceText: string
  pieces: NarrationPiece[]
}

interface WalkState {
  blocks: NarrationDomBlock[]
  openRun: OpenRun|null
}

function getOpenRun(state: WalkState, container: Element): OpenRun {
  if (!state.openRun) {
    state.openRun = { container, sourceText: "", pieces: [] };
  }
  return state.openRun;
}

function runEndsWithSpace(run: OpenRun): boolean {
  return run.sourceText.length === 0 || run.sourceText.endsWith(" ");
}

function appendText(state: WalkState, node: Text, container: Element, linkHref: string|null) {
  const run = getOpenRun(state, container);
  const data = node.data;
  const sourceStart = run.sourceText.length;
  const rawOffsets: number[] = [];
  const emittedChars: string[] = [];
  let endsWithSpace = runEndsWithSpace(run);

  for (let rawOffset = 0; rawOffset < data.length; rawOffset++) {
    const char = data[rawOffset];
    if (char === ZERO_WIDTH_SPACE) {
      continue;
    }
    const isSpace = /\s/.test(char);
    if (isSpace && endsWithSpace) {
      continue;
    }
    emittedChars.push(isSpace ? " " : char);
    rawOffsets.push(rawOffset);
    endsWithSpace = isSpace;
  }

  if (rawOffsets.length > 0) {
    run.sourceText += emittedChars.join("");
    run.pieces.push({ type: "text", node, sourceStart, rawOffsets, linkHref });
  }
}

function appendLineBreak(state: WalkState) {
  const run = state.openRun;
  if (run && !runEndsWithSpace(run)) {
    run.sourceText += " ";
  }
}

function appendMath(state: WalkState, element: Element, container: Element, math: MathSource) {
  const run = getOpenRun(state, container);
  const sourceStart = run.sourceText.length;
  run.sourceText += `$${normalizeWhitespace(math.tex)}$`;
  run.pieces.push({ type: "math", element, sourceStart, sourceEnd: run.sourceText.length, tex: math.tex, display: math.display });
}

function appendFootnoteRef(state: WalkState, element: Element, container: Element) {
  const footnoteId = element.getAttribute("data-footnote-id");
  if (!footnoteId) {
    return;
  }
  const run = getOpenRun(state, container);
  run.pieces.push({ type: "footnoteRef", element, sourceStart: run.sourceText.length, footnoteId });
}

/**
 * Trailing whitespace is always a single collapsed space, contributed either
 * by the last text piece or by a line break.
 */
function trimTrailingSpace(run: OpenRun) {
  if (!run.sourceText.endsWith(" ")) {
    return;
  }
  run.sourceText = run.sourceText.slice(0, -1);
  const lastTextPiece = run.pieces.findLast(piece => piece.type === "text");
  if (lastTextPiece && lastTextPiece.sourceStart + lastTextPiece.rawOffsets.length > run.sourceText.length) {
    lastTextPiece.rawOffsets.pop();
  }
}

function closeRun(state: WalkState) {
  const run = state.openRun;
  state.openRun = null;
  if (!run) {
    return;
  }
  trimTrailingSpace(run);
  const pieces = run.pieces.filter(piece => piece.type !== "text" || piece.rawOffsets.length > 0);
  if (run.sourceText.length === 0 && pieces.length === 0) {
    return;
  }
  state.blocks.push({
    type: "text",
    container: run.container,
    sourceText: run.sourceText,
    pieces,
    fingerprint: fingerprintText(run.sourceText),
  });
}

function getChildrenWithTag(parent: Element, tagNames: Set<string>): Element[] {
  return Array.from(parent.children).filter(child => tagNames.has(child.tagName.toLowerCase()));
}

function getTableRows(table: Element): Element[] {
  return Array.from(table.children).flatMap(child => {
    const tagName = child.tagName.toLowerCase();
    if (tagName === "tr") {
      return [child];
    }
    return tableSectionTags.has(tagName) ? getChildrenWithTag(child, tableRowTags) : [];
  });
}

function getBlockText(block: NarrationDomBlock): string {
  switch (block.type) {
    case "text": return block.sourceText;
    case "tableRow": return block.cells.join(" | ");
    case "omitted": return "";
  }
}

function getTableCellText(cell: Element): string {
  return extractNarrationBlocks(cell).map(getBlockText).filter(text => text.length > 0).join(" ");
}

function getTableRowBlock(row: Element, table: Element): NarrationTableRowBlock {
  const cellElements = getChildrenWithTag(row, tableCellTags);
  const cells = cellElements.map(getTableCellText);
  return {
    type: "tableRow",
    element: row,
    table,
    cells,
    isHeader: cellElements.length > 0 && cellElements.every(cell => cell.tagName.toLowerCase() === "th"),
    fingerprint: fingerprintText(`row:${cells.join(" | ")}`),
  };
}

function walkTable(state: WalkState, table: Element, linkHref: string|null) {
  closeRun(state);
  for (const caption of getChildrenWithTag(table, tableCaptionTags)) {
    walkChildren(state, caption, caption, linkHref);
    closeRun(state);
  }

  const rows = getTableRows(table);
  const isLayoutTable = rows.every(row => getChildrenWithTag(row, tableCellTags).length <= 1);
  for (const row of rows) {
    if (!isLayoutTable) {
      state.blocks.push(getTableRowBlock(row, table));
      continue;
    }
    for (const cell of getChildrenWithTag(row, tableCellTags)) {
      walkChildren(state, cell, cell, linkHref);
      closeRun(state);
    }
  }
}

function walkChildren(state: WalkState, parent: Element, container: Element, linkHref: string|null) {
  for (const child of Array.from(parent.childNodes)) {
    if (isTextNode(child)) {
      appendText(state, child, container, linkHref);
      continue;
    }
    if (!isElementNode(child)) {
      continue;
    }
    const tagName = child.tagName.toLowerCase();
    const classNames = getClassNames(child);

    if (skippedTags.has(tagName) || isFootnoteBackLink(child, classNames)) {
      continue;
    }
    if (tagName === "br") {
      appendLineBreak(state);
      continue;
    }
    if (isFootnoteReference(child, classNames)) {
      appendFootnoteRef(state, child, container);
      continue;
    }
    const math = getMathSource(child, tagName, classNames);
    if (math) {
      appendMath(state, child, container, math);
      continue;
    }
    if (tagName === "table") {
      walkTable(state, child, linkHref);
      continue;
    }
    const omittedKind = getOmittedKind(tagName, classNames);
    if (omittedKind) {
      closeRun(state);
      state.blocks.push({
        type: "omitted",
        element: child,
        omittedKind,
        fingerprint: fingerprintText(`${omittedKind}:${normalizeWhitespace(child.textContent ?? "")}`),
      });
      continue;
    }
    if (blockLevelTags.has(tagName)) {
      closeRun(state);
      walkChildren(state, child, child, linkHref);
      closeRun(state);
      continue;
    }
    const childLinkHref = tagName === "a" ? (child.getAttribute("href") ?? linkHref) : linkHref;
    walkChildren(state, child, container, childLinkHref);
  }
}

export function extractNarrationBlocks(root: Element): NarrationDomBlock[] {
  const state: WalkState = { blocks: [], openRun: null };
  walkChildren(state, root, root, null);
  closeRun(state);
  return state.blocks;
}

/**
 * Longest common subsequence of two fingerprint lists, as pairs of indexes.
 */
function longestCommonSubsequence(a: string[], b: string[]): Array<[number, number]> {
  // lcsLengths[i][j] is the length of the longest common subsequence of a[i..] and b[j..]
  const lcsLengths = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcsLengths[i][j] = a[i] === b[j]
        ? lcsLengths[i + 1][j + 1] + 1
        : Math.max(lcsLengths[i + 1][j], lcsLengths[i][j + 1]);
    }
  }

  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (lcsLengths[i + 1][j] >= lcsLengths[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

/**
 * Matches the blocks of a narration script to the blocks found in a rendered
 * page, given the fingerprints of each in document order. Returns, for each
 * script block, the index of the page block it corresponds to, or null if the
 * page has no such block (because the post was edited after the script was
 * made, or because rendering changed that block's text).
 *
 * The matching is a longest common subsequence, so that blocks inserted or
 * removed on either side only affect themselves. The two lists are usually
 * identical or nearly so, so the common prefix and suffix are matched directly
 * and only what's between them is compared pairwise.
 */
export function matchNarrationBlockFingerprints(scriptFingerprints: string[], pageFingerprints: string[]): Array<number|null> {
  const scriptCount = scriptFingerprints.length;
  const pageCount = pageFingerprints.length;
  const shorterCount = Math.min(scriptCount, pageCount);

  let prefixLength = 0;
  while (prefixLength < shorterCount && scriptFingerprints[prefixLength] === pageFingerprints[prefixLength]) {
    prefixLength++;
  }
  let suffixLength = 0;
  while (
    suffixLength < shorterCount - prefixLength
    && scriptFingerprints[scriptCount - 1 - suffixLength] === pageFingerprints[pageCount - 1 - suffixLength]
  ) {
    suffixLength++;
  }

  const middlePairs = longestCommonSubsequence(
    scriptFingerprints.slice(prefixLength, scriptCount - suffixLength),
    pageFingerprints.slice(prefixLength, pageCount - suffixLength),
  );
  const pageIndexByScriptIndex = new Map(
    middlePairs.map(([scriptIndex, pageIndex]) => [scriptIndex + prefixLength, pageIndex + prefixLength])
  );

  return scriptFingerprints.map((_, scriptIndex) => {
    if (scriptIndex < prefixLength) {
      return scriptIndex;
    }
    if (scriptIndex >= scriptCount - suffixLength) {
      return scriptIndex + pageCount - scriptCount;
    }
    return pageIndexByScriptIndex.get(scriptIndex) ?? null;
  });
}
