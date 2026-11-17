import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import { defineStyles } from "@/components/hooks/useStyles";
import { setHighlightRanges } from "@/lib/codeHighlighting";
import {
  extractNarrationBlocks,
  footnoteItemSelector,
  matchNarrationBlockFingerprints,
  type NarrationDomBlock,
  type NarrationMathPiece,
  type NarrationPiece,
  type NarrationTextBlock,
  type NarrationTextPiece,
} from "@/lib/narration/narrationBlocks";
import type { NarrationBlockTiming, NarrationScript, NarrationSegmentTimings } from "@/lib/narration/narrationTypes";

const BLOCK_HIGHLIGHT_NAME = "narration-block";
const WORD_HIGHLIGHT_NAME = "narration-word";
/**
 * Rendered equations draw their glyphs with CSS generated content, which
 * ::highlight() doesn't paint behind, so the equation being read is marked
 * with an attribute instead.
 */
const CURRENT_ELEMENT_ATTRIBUTE = "data-narration-current";

/** How far from the top of the viewport the block being read is scrolled to */
const SCROLL_TARGET_VIEWPORT_FRACTION = 0.25;
const SCROLL_MARGIN_TOP = 100;
const SCROLL_MARGIN_BOTTOM = 220;

export const narrationHighlightStyles = defineStyles("NarrationHighlightCSS", (theme: ThemeType) => ({
  "@global": {
    [`::highlight(${BLOCK_HIGHLIGHT_NAME})`]: {
      backgroundColor: theme.palette.greyAlpha(0.07),
    },
    [`::highlight(${WORD_HIGHLIGHT_NAME})`]: {
      backgroundColor: theme.palette.blockquoteHighlight.commentHovered,
    },
    [`[${CURRENT_ELEMENT_ATTRIBUTE}]`]: {
      backgroundColor: theme.palette.blockquoteHighlight.commentHovered,
      borderRadius: 2,
    },
  },
}));

/**
 * Tracks which part of the page is highlighted as being read. The page is
 * re-scanned (see `mapScriptBlocksToPage`) whenever the block to highlight
 * turns out to have been detached, which happens when the post body
 * re-renders.
 */
export interface NarrationHighlighter {
  script: NarrationScript
  root: Element
  /** For each block of the script, the block of the page it was made from, if the page has it */
  pageBlocks: Array<NarrationDomBlock|null>
  currentBlockIndex: number|null
  currentWordIndex: number|null
  markedElements: Element[]
}

interface HighlightTargets {
  ranges: Range[]
  mathElements: Element[]
}

type RenderedPiece = NarrationTextPiece | NarrationMathPiece;

function isRenderedPiece(piece: NarrationPiece): piece is RenderedPiece {
  return piece.type !== "footnoteRef";
}

function getPieceSourceEnd(piece: RenderedPiece): number {
  return piece.type === "text" ? piece.sourceStart + piece.rawOffsets.length : piece.sourceEnd;
}

function getPieceNode(piece: RenderedPiece): Node {
  return piece.type === "text" ? piece.node : piece.element;
}

function mapScriptBlocksToPage(script: NarrationScript, root: Element): Array<NarrationDomBlock|null> {
  const pageBlocks = extractNarrationBlocks(root);
  const scriptDocumentBlocks = sortBy(
    uniqBy(script.blocks.filter(block => block.documentIndex !== null), block => block.documentIndex),
    block => block.documentIndex,
  );
  const matches = matchNarrationBlockFingerprints(
    scriptDocumentBlocks.map(block => block.fingerprint ?? ""),
    pageBlocks.map(block => block.fingerprint),
  );
  const pageBlockByDocumentIndex = new Map(scriptDocumentBlocks.map((block, i) => {
    const pageBlockIndex = matches[i];
    return [block.documentIndex, pageBlockIndex === null ? null : pageBlocks[pageBlockIndex]];
  }));
  return script.blocks.map(block => pageBlockByDocumentIndex.get(block.documentIndex) ?? null);
}

function isPageBlockConnected(pageBlock: NarrationDomBlock): boolean {
  if (pageBlock.type === "omitted") {
    return pageBlock.element.isConnected;
  }
  return pageBlock.container.isConnected && pageBlock.pieces.filter(isRenderedPiece).every(piece => getPieceNode(piece).isConnected);
}

function getPageBlock(highlighter: NarrationHighlighter, blockIndex: number): NarrationDomBlock|null {
  const pageBlock = highlighter.pageBlocks[blockIndex];
  if (!pageBlock || isPageBlockConnected(pageBlock)) {
    return pageBlock;
  }
  highlighter.pageBlocks = mapScriptBlocksToPage(highlighter.script, highlighter.root);
  return highlighter.pageBlocks[blockIndex];
}

/**
 * What to highlight for a range of a text block's source text: a DOM range
 * covering it, and any equations inside it.
 */
function getSourceRangeTargets(pageBlock: NarrationTextBlock, sourceStart: number, sourceEnd: number): HighlightTargets {
  const pieces = pageBlock.pieces
    .filter(isRenderedPiece)
    .filter(piece => piece.sourceStart < sourceEnd && sourceStart < getPieceSourceEnd(piece));
  const firstPiece = pieces.at(0);
  const lastPiece = pieces.at(-1);
  if (!firstPiece || !lastPiece) {
    return { ranges: [], mathElements: [] };
  }

  const range = document.createRange();
  if (firstPiece.type === "text") {
    range.setStart(firstPiece.node, firstPiece.rawOffsets[Math.max(sourceStart, firstPiece.sourceStart) - firstPiece.sourceStart]);
  } else {
    range.setStartBefore(firstPiece.element);
  }
  if (lastPiece.type === "text") {
    const lastCharIndex = Math.min(sourceEnd, getPieceSourceEnd(lastPiece)) - 1 - lastPiece.sourceStart;
    range.setEnd(lastPiece.node, lastPiece.rawOffsets[lastCharIndex] + 1);
  } else {
    range.setEndAfter(lastPiece.element);
  }
  return {
    ranges: [range],
    mathElements: pieces.flatMap(piece => piece.type === "math" ? [piece.element] : []),
  };
}

function getBlockRange(pageBlock: NarrationDomBlock): Range|null {
  if (pageBlock.type === "omitted") {
    const range = document.createRange();
    range.selectNodeContents(pageBlock.element);
    return range;
  }
  return getSourceRangeTargets(pageBlock, 0, pageBlock.sourceText.length).ranges.at(0) ?? null;
}

function getWordTargets(pageBlock: NarrationDomBlock|null, blockTiming: NarrationBlockTiming, wordIndex: number): HighlightTargets {
  const word = blockTiming.words.at(wordIndex);
  if (!pageBlock || pageBlock.type !== "text" || wordIndex < 0 || !word) {
    return { ranges: [], mathElements: [] };
  }
  return getSourceRangeTargets(pageBlock, word[2], word[3]);
}

function isFootnoteBlock(pageBlock: NarrationDomBlock): boolean {
  const blockElement = pageBlock.type === "text" ? pageBlock.container : pageBlock.element;
  return !!blockElement.closest(footnoteItemSelector);
}

function setMarkedElements(highlighter: NarrationHighlighter, elements: Element[]) {
  for (const element of highlighter.markedElements) {
    element.removeAttribute(CURRENT_ELEMENT_ATTRIBUTE);
  }
  for (const element of elements) {
    element.setAttribute(CURRENT_ELEMENT_ATTRIBUTE, "");
  }
  highlighter.markedElements = elements;
}

export function createNarrationHighlighter(script: NarrationScript, root: Element): NarrationHighlighter {
  return {
    script,
    root,
    pageBlocks: mapScriptBlocksToPage(script, root),
    currentBlockIndex: null,
    currentWordIndex: null,
    markedElements: [],
  };
}

export function findBlockTimingAt(timings: NarrationSegmentTimings, timeMs: number): NarrationBlockTiming|null {
  return timings.blocks.findLast(block => block.startMs <= timeMs) ?? timings.blocks.at(0) ?? null;
}

/**
 * Highlights what's being read at `timeMs` into a segment with the given
 * timings. If that's a different block than was highlighted before, returns
 * that block's position in the viewport, for scrolling to.
 *
 * Footnotes are the exception: they're read right after the paragraph that
 * cites them, but they're at the end of the post, so following them would
 * take the reader away from their place and then back again.
 */
export function updateNarrationHighlight(highlighter: NarrationHighlighter, timings: NarrationSegmentTimings, timeMs: number): DOMRect|null {
  const blockTiming = findBlockTimingAt(timings, timeMs);
  if (!blockTiming) {
    return null;
  }
  const wordIndex = blockTiming.words.findLastIndex(word => word[0] <= timeMs);
  const blockChanged = blockTiming.blockIndex !== highlighter.currentBlockIndex;
  if (!blockChanged && wordIndex === highlighter.currentWordIndex) {
    return null;
  }
  highlighter.currentBlockIndex = blockTiming.blockIndex;
  highlighter.currentWordIndex = wordIndex;

  const pageBlock = getPageBlock(highlighter, blockTiming.blockIndex);
  const blockRange = pageBlock ? getBlockRange(pageBlock) : null;
  const wordTargets = getWordTargets(pageBlock, blockTiming, wordIndex);

  // When highlights overlap, the one registered last is painted on top, so
  // the word highlight is always re-registered after the block highlight.
  setHighlightRanges(WORD_HIGHLIGHT_NAME, []);
  setHighlightRanges(BLOCK_HIGHLIGHT_NAME, blockRange ? [blockRange] : []);
  setHighlightRanges(WORD_HIGHLIGHT_NAME, wordTargets.ranges);
  setMarkedElements(highlighter, wordTargets.mathElements);

  const shouldFollow = blockChanged && !!pageBlock && !isFootnoteBlock(pageBlock);
  return (shouldFollow && blockRange) ? blockRange.getBoundingClientRect() : null;
}

export function clearNarrationHighlight(highlighter: NarrationHighlighter) {
  setHighlightRanges(BLOCK_HIGHLIGHT_NAME, []);
  setHighlightRanges(WORD_HIGHLIGHT_NAME, []);
  setMarkedElements(highlighter, []);
  highlighter.currentBlockIndex = null;
  highlighter.currentWordIndex = null;
}

/** Scrolls so that a block which is out of view (or about to be) is near the top of the viewport */
export function scrollToNarrationBlock(blockRect: DOMRect) {
  const isInView = blockRect.top >= SCROLL_MARGIN_TOP && blockRect.bottom <= window.innerHeight - SCROLL_MARGIN_BOTTOM;
  if (isInView) {
    return;
  }
  window.scrollTo({
    top: window.scrollY + blockRect.top - (window.innerHeight * SCROLL_TARGET_VIEWPORT_FRACTION),
    behavior: "smooth",
  });
}

/**
 * Finds the first block of the script that was made from the part of the page
 * that `node` is in.
 */
export function findScriptBlockIndexForNode(highlighter: NarrationHighlighter, node: Node): number|null {
  const pageBlocks = mapScriptBlocksToPage(highlighter.script, highlighter.root);
  highlighter.pageBlocks = pageBlocks;
  const blockIndex = pageBlocks.findIndex(pageBlock => {
    if (!pageBlock) {
      return false;
    }
    if (pageBlock.type === "omitted") {
      return pageBlock.element.contains(node);
    }
    return pageBlock.pieces.filter(isRenderedPiece).some(piece => {
      const pieceNode = getPieceNode(piece);
      return pieceNode === node || pieceNode.contains(node) || node.contains(pieceNode);
    });
  });
  return blockIndex >= 0 ? blockIndex : null;
}
