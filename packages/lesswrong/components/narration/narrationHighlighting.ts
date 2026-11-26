import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import { defineStyles } from "@/components/hooks/useStyles";
import { setHighlightRanges } from "@/lib/codeHighlighting";
import {
  extractNarrationBlocks,
  footnoteItemSelector,
  getPieceNode,
  getPieceSourceEnd,
  isRenderedPiece,
  matchNarrationBlockFingerprints,
  type NarrationDomBlock,
  type NarrationTextBlock,
} from "@/lib/narration/narrationBlocks";
import type { NarrationBlockTiming, NarrationScript, NarrationSegmentTimings } from "@/lib/narration/narrationTypes";
import { setNarrationPositionRange } from "./narrationPosition";

const WORD_HIGHLIGHT_NAME = "narration-word";
/**
 * ::highlight() only paints behind text. Rendered equations draw their glyphs
 * with CSS generated content, and images have no text at all, so an equation
 * that's being read or an image that's being described is marked with an
 * attribute instead.
 */
const CURRENT_ELEMENT_ATTRIBUTE = "data-narration-current";

/** How far from the top of the viewport the text being read is scrolled to */
const SCROLL_TARGET_VIEWPORT_FRACTION = 0.25;
const SCROLL_MARGIN_TOP = 100;
const SCROLL_MARGIN_BOTTOM = 220;

export const narrationHighlightStyles = defineStyles("NarrationHighlightCSS", (theme: ThemeType) => ({
  "@global": {
    [`::highlight(${WORD_HIGHLIGHT_NAME})`]: {
      backgroundColor: theme.palette.blockquoteHighlight.commentHovered,
    },
    [`[${CURRENT_ELEMENT_ATTRIBUTE}]`]: {
      backgroundColor: theme.palette.blockquoteHighlight.commentHovered,
      borderRadius: 2,
    },
    [`img[${CURRENT_ELEMENT_ATTRIBUTE}]`]: {
      outline: `4px solid ${theme.palette.blockquoteHighlight.commentHovered}`,
      outlineOffset: 2,
    },
  },
}));

/**
 * Tracks which part of the page is highlighted as being read. The element
 * that holds what's being narrated is looked up again each time it's needed,
 * and re-scanned (see `mapScriptBlocksToPage`) if it has been replaced or its
 * contents have changed: a post's body can re-render, and a comment's is
 * replaced when the comment is expanded.
 */
export interface NarrationHighlighter {
  script: NarrationScript
  getRoot: () => Element|null
  /** The element that pageBlocks was made from */
  scannedRoot: Element|null
  scannedRootObserver: MutationObserver
  scannedRootHasChanged: boolean
  /** For each block of the script, the block of the page it was made from, if the page has it */
  pageBlocks: Array<NarrationDomBlock|null>
  currentBlockIndex: number|null
  currentWordIndex: number|null
  markedElements: Element[]
}

interface HighlightTargets {
  ranges: Range[]
  /** Equations and images, which are marked with CURRENT_ELEMENT_ATTRIBUTE */
  elements: Element[]
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

function scanPage(highlighter: NarrationHighlighter) {
  const root = highlighter.getRoot();
  highlighter.scannedRootObserver.disconnect();
  if (root) {
    highlighter.scannedRootObserver.observe(root, { childList: true, subtree: true, characterData: true });
  }
  highlighter.scannedRoot = root;
  highlighter.scannedRootHasChanged = false;
  highlighter.pageBlocks = root ? mapScriptBlocksToPage(highlighter.script, root) : highlighter.script.blocks.map(() => null);
}

function getPageBlocks(highlighter: NarrationHighlighter): Array<NarrationDomBlock|null> {
  if (highlighter.scannedRootHasChanged || highlighter.getRoot() !== highlighter.scannedRoot) {
    scanPage(highlighter);
  }
  return highlighter.pageBlocks;
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
    return { ranges: [], elements: [] };
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
    elements: pieces.flatMap(piece => piece.type === "math" ? [piece.element] : []),
  };
}

/**
 * What to highlight for the word being read. In a block that isn't read word
 * for word (a table row, an image, or something announced as omitted), that's
 * the whole block.
 */
function getWordTargets(pageBlock: NarrationDomBlock|null, blockTiming: NarrationBlockTiming, wordIndex: number): HighlightTargets {
  const word = blockTiming.words.at(wordIndex);
  if (!pageBlock || wordIndex < 0 || !word) {
    return { ranges: [], elements: [] };
  }
  if (pageBlock.type === "text") {
    return getSourceRangeTargets(pageBlock, word[2], word[3]);
  }
  const range = document.createRange();
  range.selectNode(pageBlock.element);
  return { ranges: [range], elements: pageBlock.type === "image" ? [pageBlock.element] : [] };
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

/** `getRoot` finds the element that holds what the script narrates; it may not exist yet */
export function createNarrationHighlighter(script: NarrationScript, getRoot: () => Element|null): NarrationHighlighter {
  const highlighter: NarrationHighlighter = {
    script,
    getRoot,
    scannedRoot: null,
    scannedRootObserver: new MutationObserver(() => {
      highlighter.scannedRootHasChanged = true;
    }),
    scannedRootHasChanged: false,
    pageBlocks: [],
    currentBlockIndex: null,
    currentWordIndex: null,
    markedElements: [],
  };
  scanPage(highlighter);
  return highlighter;
}

export function findBlockTimingAt(timings: NarrationSegmentTimings, timeMs: number): NarrationBlockTiming|null {
  return timings.blocks.findLast(block => block.startMs <= timeMs) ?? timings.blocks.at(0) ?? null;
}

/**
 * Highlights what's being read at `timeMs` into a segment with the given
 * timings. If that has changed, and it's somewhere the page should follow,
 * returns its position in the viewport.
 *
 * Footnotes aren't followed: they're read right after the paragraph that
 * cites them, but they're at the end of the post, so following them would
 * take the reader away from their place and then back again.
 */
export function updateNarrationHighlight(highlighter: NarrationHighlighter, timings: NarrationSegmentTimings, timeMs: number): DOMRect|null {
  const blockTiming = findBlockTimingAt(timings, timeMs);
  if (!blockTiming) {
    return null;
  }
  const wordIndex = blockTiming.words.findLastIndex(word => word[0] <= timeMs);
  if (blockTiming.blockIndex === highlighter.currentBlockIndex && wordIndex === highlighter.currentWordIndex) {
    return null;
  }
  highlighter.currentBlockIndex = blockTiming.blockIndex;
  highlighter.currentWordIndex = wordIndex;

  const pageBlock = getPageBlocks(highlighter)[blockTiming.blockIndex];
  const wordTargets = getWordTargets(pageBlock, blockTiming, wordIndex);
  setHighlightRanges(WORD_HIGHLIGHT_NAME, wordTargets.ranges);
  setMarkedElements(highlighter, wordTargets.elements);

  const wordRange = wordTargets.ranges.at(0);
  if (!wordRange || !pageBlock || isFootnoteBlock(pageBlock)) {
    return null;
  }
  setNarrationPositionRange(wordRange);
  const wordRect = wordRange.getBoundingClientRect();
  const isLaidOut = wordRect.width > 0 || wordRect.height > 0;
  return isLaidOut ? wordRect : null;
}

/** Removes the highlighter's highlights from the page, and stops it watching the page */
export function disposeNarrationHighlighter(highlighter: NarrationHighlighter) {
  setHighlightRanges(WORD_HIGHLIGHT_NAME, []);
  setMarkedElements(highlighter, []);
  setNarrationPositionRange(null);
  highlighter.scannedRootObserver.disconnect();
  highlighter.currentBlockIndex = null;
  highlighter.currentWordIndex = null;
}

/** Scrolls so that text which is out of view (or about to be) is near the top of the viewport */
export function scrollToNarrationPosition(positionRect: DOMRect) {
  const isInView = positionRect.top >= SCROLL_MARGIN_TOP && positionRect.bottom <= window.innerHeight - SCROLL_MARGIN_BOTTOM;
  if (isInView) {
    return;
  }
  window.scrollTo({
    top: window.scrollY + positionRect.top - (window.innerHeight * SCROLL_TARGET_VIEWPORT_FRACTION),
    behavior: "smooth",
  });
}

/**
 * Finds the first block of the script that was made from the part of the page
 * that `node` is in.
 */
export function findScriptBlockIndexForNode(highlighter: NarrationHighlighter, node: Node): number|null {
  scanPage(highlighter);
  const blockIndex = highlighter.pageBlocks.findIndex(pageBlock => {
    if (!pageBlock) {
      return false;
    }
    if (pageBlock.type !== "text") {
      return pageBlock.element.contains(node);
    }
    return pageBlock.pieces.filter(isRenderedPiece).some(piece => {
      const pieceNode = getPieceNode(piece);
      return pieceNode === node || pieceNode.contains(node) || node.contains(pieceNode);
    });
  });
  return blockIndex >= 0 ? blockIndex : null;
}
