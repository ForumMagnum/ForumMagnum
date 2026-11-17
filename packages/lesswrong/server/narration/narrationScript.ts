import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import { getLinkedom } from "@/server/utils/wrapLinkedom";
import {
  extractNarrationBlocks,
  footnoteItemSelector,
  type NarrationDomBlock,
  type NarrationMathPiece,
  type NarrationOmittedKind,
  type NarrationPiece,
  type NarrationTextBlock,
} from "@/lib/narration/narrationBlocks";
import {
  NARRATION_BLOCK_SEPARATOR,
  type NarrationScript,
  type NarrationScriptBlock,
  type NarrationSpan,
} from "@/lib/narration/narrationTypes";
import { verbalizeEquations } from "./mathVerbalization";

/**
 * Scripts are stored and reused, so this must be increased whenever a change
 * here (or to extractNarrationBlocks, or to the math verbalization prompt)
 * would change the script made for a given post.
 */
export const NARRATION_PREPROCESSOR_VERSION = 1;

/** The first segment is short, so that playback can start soon after it's requested */
const FIRST_SEGMENT_TARGET_CHARACTERS = 600;
const SEGMENT_TARGET_CHARACTERS = 2400;
/** Under the smallest per-request limit among ElevenLabs' models (5,000 characters, for eleven_v3) */
const BLOCK_MAX_CHARACTERS = 4500;
const MATH_CONTEXT_CHARACTERS = 300;

const omittedBlockAnnouncements: Record<NarrationOmittedKind, string> = {
  code: "Code block omitted.",
  table: "Table omitted.",
  spoiler: "Spoiler omitted.",
  embed: "Embedded content omitted.",
};

const pronunciationAliases: Array<{ pattern: RegExp, speech: string }> = [
  { pattern: /\be\.g\./gi, speech: "for example" },
  { pattern: /\bi\.e\./gi, speech: "that is" },
  { pattern: /\bvs\.?(?=\s)/gi, speech: "versus" },
];

const urlPattern = /\bhttps?:\/\/\S+/g;
const endsWithStopPattern = /[.!?:;]["'”’)\]]*$/;
const sentenceBreakPattern = /[.!?]["'”’)\]]*\s+/g;
const wordBreakPattern = /\s+/g;

export interface NarrationPostInfo {
  title: string
  authorNames: string[]
}

export interface NarrationSegmentPlan {
  startBlockIndex: number
  endBlockIndex: number
  characterCount: number
}

export interface BuiltNarrationScript {
  script: NarrationScript
  segments: NarrationSegmentPlan[]
}

interface SpeechText {
  speech: string
  spans: NarrationSpan[]
}

interface SourceReplacement {
  sourceStart: number
  sourceEnd: number
  speech: string
}

interface FootnoteInfo {
  id: string
  number: number
}

interface BlockContext {
  isHeading: boolean
  footnote: FootnoteInfo|null
  listNumber: number|null
  startsQuote: boolean
  endsQuote: boolean
}

interface DocumentBlockDraft {
  documentIndex: number
  fingerprint: string
  speechText: SpeechText
  context: BlockContext
  referencedFootnoteIds: string[]
}

interface PlaybackBlock {
  block: NarrationScriptBlock
  startsSection: boolean
}

const emptySpeechText: SpeechText = { speech: "", spans: [] };

function isMathPiece(piece: NarrationPiece): piece is NarrationMathPiece {
  return piece.type === "math";
}

function getBlockElement(block: NarrationDomBlock): Element {
  return block.type === "text" ? block.container : block.element;
}

function getOutermostBlockquote(element: Element): Element|null {
  const quote = element.closest("blockquote");
  if (!quote) {
    return null;
  }
  return (quote.parentElement && getOutermostBlockquote(quote.parentElement)) ?? quote;
}

function getOrderedListNumber(listItem: Element): number|null {
  const list = listItem.parentElement;
  if (!list || list.tagName.toLowerCase() !== "ol") {
    return null;
  }
  const start = parseInt(list.getAttribute("start") ?? "1");
  const listItems = Array.from(list.children).filter(child => child.tagName.toLowerCase() === "li");
  return (Number.isNaN(start) ? 1 : start) + listItems.indexOf(listItem);
}

function getFootnoteInfo(footnoteItem: Element, footnoteItems: Element[]): FootnoteInfo|null {
  const id = footnoteItem.getAttribute("data-footnote-id");
  if (!id) {
    return null;
  }
  const indexAttribute = parseInt(footnoteItem.getAttribute("data-footnote-index") ?? "");
  return {
    id,
    number: Number.isNaN(indexAttribute) ? footnoteItems.indexOf(footnoteItem) + 1 : indexAttribute,
  };
}

function getBlockContexts(domBlocks: NarrationDomBlock[], root: Element): BlockContext[] {
  const footnoteItems = Array.from(root.querySelectorAll(footnoteItemSelector));
  const elements = domBlocks.map(getBlockElement);
  const listItems = elements.map(element => element.closest("li"));
  const quotes = elements.map(getOutermostBlockquote);

  return elements.map((element, i) => {
    const footnoteItem = element.closest(footnoteItemSelector);
    const footnote = footnoteItem ? getFootnoteInfo(footnoteItem, footnoteItems) : null;
    const listItem = listItems[i];
    const isFirstBlockOfListItem = !!listItem && listItems.indexOf(listItem) === i;
    const quote = quotes[i];
    return {
      isHeading: !!element.closest("h1, h2, h3, h4, h5, h6"),
      footnote,
      listNumber: (listItem && isFirstBlockOfListItem && !footnoteItem) ? getOrderedListNumber(listItem) : null,
      startsQuote: !!quote && quotes.indexOf(quote) === i,
      endsQuote: !!quote && quotes.lastIndexOf(quote) === i,
    };
  });
}

function getUrlReplacements(match: RegExpExecArray): SourceReplacement[] {
  const url = match[0].replace(/[.,;:!?)\]]+$/, "");
  if (!URL.canParse(url)) {
    return [];
  }
  return [{
    sourceStart: match.index,
    sourceEnd: match.index + url.length,
    speech: new URL(url).hostname.replace(/^www\./, ""),
  }];
}

function matchCapitalization(speech: string, original: string): string {
  const isCapitalized = original[0] !== original[0].toLowerCase();
  return isCapitalized ? `${speech[0].toUpperCase()}${speech.slice(1)}` : speech;
}

function findPatternReplacements(sourceText: string): SourceReplacement[] {
  const aliasReplacements = pronunciationAliases.flatMap(({ pattern, speech }) =>
    Array.from(sourceText.matchAll(pattern), match => ({
      sourceStart: match.index,
      sourceEnd: match.index + match[0].length,
      speech: matchCapitalization(speech, match[0]),
    }))
  );
  const urlReplacements = Array.from(sourceText.matchAll(urlPattern)).flatMap(getUrlReplacements);
  return [...aliasReplacements, ...urlReplacements];
}

function replacementsOverlap(a: SourceReplacement, b: SourceReplacement): boolean {
  return a.sourceStart < b.sourceEnd && b.sourceStart < a.sourceEnd;
}

/**
 * Combines the replacements for a block into a sorted, non-overlapping list.
 * Equations always win, since their source ranges aren't text.
 */
function resolveReplacements(mathReplacements: SourceReplacement[], patternReplacements: SourceReplacement[]): SourceReplacement[] {
  const patternReplacementsOutsideMath = patternReplacements.filter(
    replacement => !mathReplacements.some(mathReplacement => replacementsOverlap(replacement, mathReplacement))
  );
  const sorted = sortBy([...mathReplacements, ...patternReplacementsOutsideMath], replacement => replacement.sourceStart);
  return sorted.reduce<SourceReplacement[]>((accepted, replacement) => {
    const previous = accepted.at(-1);
    return (previous && replacement.sourceStart < previous.sourceEnd) ? accepted : [...accepted, replacement];
  }, []);
}

function appendSpeech(speechText: SpeechText, speech: string, sourceStart: number, sourceEnd: number, atomic: boolean): SpeechText {
  if (speech.length === 0) {
    return speechText;
  }
  const speechStart = speechText.speech.length;
  return {
    speech: speechText.speech + speech,
    spans: [...speechText.spans, { speechStart, speechEnd: speechStart + speech.length, sourceStart, sourceEnd, atomic }],
  };
}

function buildSpeechFromSource(sourceText: string, replacements: SourceReplacement[]): SpeechText {
  const beforeTail = replacements.reduce<{ speechText: SpeechText, sourceCursor: number }>((accumulated, replacement) => {
    const unchangedText = sourceText.slice(accumulated.sourceCursor, replacement.sourceStart);
    const withUnchangedText = appendSpeech(accumulated.speechText, unchangedText, accumulated.sourceCursor, replacement.sourceStart, false);
    return {
      speechText: appendSpeech(withUnchangedText, replacement.speech, replacement.sourceStart, replacement.sourceEnd, true),
      sourceCursor: replacement.sourceEnd,
    };
  }, { speechText: emptySpeechText, sourceCursor: 0 });

  const tail = sourceText.slice(beforeTail.sourceCursor);
  return appendSpeech(beforeTail.speechText, tail, beforeTail.sourceCursor, sourceText.length, false);
}

function decorateSpeech({ speech, spans }: SpeechText, prefix: string, suffix: string): SpeechText {
  return {
    speech: `${prefix}${speech}${suffix}`,
    spans: spans.map(span => ({
      ...span,
      speechStart: span.speechStart + prefix.length,
      speechEnd: span.speechEnd + prefix.length,
    })),
  };
}

function getMathReading(piece: NarrationMathPiece, mathReadings: Map<NarrationMathPiece, string>): string {
  const reading = mathReadings.get(piece);
  if (reading === undefined) {
    throw new Error(`No reading was generated for equation: ${piece.tex}`);
  }
  return reading;
}

function verbalizeTextBlock(block: NarrationTextBlock, context: BlockContext, mathReadings: Map<NarrationMathPiece, string>): SpeechText {
  const mathReplacements = block.pieces.filter(isMathPiece).map(piece => ({
    sourceStart: piece.sourceStart,
    sourceEnd: piece.sourceEnd,
    speech: getMathReading(piece, mathReadings),
  }));
  const replacements = resolveReplacements(mathReplacements, findPatternReplacements(block.sourceText));
  const body = buildSpeechFromSource(block.sourceText, replacements);
  if (body.speech.trim().length === 0) {
    return emptySpeechText;
  }

  const quotePrefix = context.startsQuote ? "Quote: " : "";
  const listPrefix = context.listNumber !== null ? `${context.listNumber}. ` : "";
  // The speech model only pauses between blocks when the first one ends a
  // sentence. Without a full stop, consecutive headings or list items are read
  // as one run-on sentence.
  const needsStop = !endsWithStopPattern.test(body.speech);
  const quoteSuffix = context.endsQuote ? " End quote." : "";
  return decorateSpeech(body, `${quotePrefix}${listPrefix}`, `${needsStop ? "." : ""}${quoteSuffix}`);
}

function getEquationContext(block: NarrationTextBlock, piece: NarrationMathPiece): string {
  return block.sourceText.slice(
    Math.max(0, piece.sourceStart - MATH_CONTEXT_CHARACTERS),
    piece.sourceEnd + MATH_CONTEXT_CHARACTERS,
  );
}

async function getMathReadings(domBlocks: NarrationDomBlock[]): Promise<Map<NarrationMathPiece, string>> {
  const equations = domBlocks.flatMap(block => block.type === "text"
    ? block.pieces.filter(isMathPiece).map(piece => ({ block, piece }))
    : []
  );
  const readings = await verbalizeEquations(equations.map(({ block, piece }) => ({
    latex: piece.tex,
    display: piece.display,
    context: getEquationContext(block, piece),
  })));
  return new Map(equations.map(({ piece }, i) => [piece, readings[i]]));
}

function getReferencedFootnoteIds(block: NarrationDomBlock): string[] {
  if (block.type !== "text") {
    return [];
  }
  return block.pieces.flatMap(piece => piece.type === "footnoteRef" ? [piece.footnoteId] : []);
}

function toPlaybackBlock(draft: DocumentBlockDraft, prefix: string, suffix: string): PlaybackBlock {
  const { speech, spans } = decorateSpeech(draft.speechText, prefix, suffix);
  return {
    block: { documentIndex: draft.documentIndex, fingerprint: draft.fingerprint, speech, spans },
    startsSection: draft.context.isHeading,
  };
}

function getFootnotePlaybackBlocks(footnoteDrafts: DocumentBlockDraft[]): PlaybackBlock[] {
  const spokenDrafts = footnoteDrafts.filter(draft => draft.speechText.speech.length > 0);
  return spokenDrafts.map((draft, i) => toPlaybackBlock(
    draft,
    i === 0 ? `Footnote ${draft.context.footnote?.number}: ` : "",
    i === spokenDrafts.length - 1 ? " End of footnote." : "",
  ));
}

/**
 * Puts the post's blocks into the order they're read in: document order,
 * except that each footnote is read right after the first block that
 * references it. Footnotes that nothing references are read at the end.
 */
function orderBlocksForPlayback(drafts: DocumentBlockDraft[]): PlaybackBlock[] {
  const footnoteDraftsById = groupBy(drafts.filter(draft => draft.context.footnote), draft => draft.context.footnote?.id);
  const readFootnoteIds = new Set<string>();
  const playbackBlocks: PlaybackBlock[] = [];

  for (const draft of drafts) {
    if (draft.context.footnote) {
      continue;
    }
    if (draft.speechText.speech.length > 0) {
      playbackBlocks.push(toPlaybackBlock(draft, "", ""));
    }
    for (const footnoteId of draft.referencedFootnoteIds) {
      if (readFootnoteIds.has(footnoteId) || !footnoteDraftsById[footnoteId]) {
        continue;
      }
      readFootnoteIds.add(footnoteId);
      playbackBlocks.push(...getFootnotePlaybackBlocks(footnoteDraftsById[footnoteId]));
    }
  }

  const unreferencedFootnoteIds = Object.keys(footnoteDraftsById).filter(footnoteId => !readFootnoteIds.has(footnoteId));
  const unreferencedFootnoteBlocks = sortBy(unreferencedFootnoteIds, footnoteId => footnoteDraftsById[footnoteId][0].documentIndex)
    .flatMap(footnoteId => getFootnotePlaybackBlocks(footnoteDraftsById[footnoteId]));

  return [...playbackBlocks, ...unreferencedFootnoteBlocks];
}

function getIntroBlock({ title, authorNames }: NarrationPostInfo): PlaybackBlock {
  const titleSentence = endsWithStopPattern.test(title) ? title : `${title}.`;
  const authors = new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(authorNames);
  return {
    block: { documentIndex: null, fingerprint: null, speech: `${titleSentence} By ${authors}.`, spans: [] },
    startsSection: true,
  };
}

function getLastMatchEnd(text: string, pattern: RegExp): number|null {
  const lastMatch = Array.from(text.matchAll(pattern)).at(-1);
  return lastMatch ? lastMatch.index + lastMatch[0].length : null;
}

/**
 * Where to split a block that's too long to be one request: after the last
 * sentence that fits, or failing that, the last word. Never inside speech that
 * was generated for a single element, such as an equation.
 */
function findCutPoint(block: NarrationScriptBlock): number {
  const window = block.speech.slice(0, BLOCK_MAX_CHARACTERS);
  const cutPoint = getLastMatchEnd(window, sentenceBreakPattern) ?? getLastMatchEnd(window, wordBreakPattern) ?? window.length;
  const spanContainingCut = block.spans.find(span => span.atomic && span.speechStart < cutPoint && cutPoint < span.speechEnd);
  return spanContainingCut ? spanContainingCut.speechEnd : cutPoint;
}

function sliceSpan(span: NarrationSpan, sliceStart: number, sliceEnd: number): NarrationSpan {
  const speechStart = Math.max(span.speechStart, sliceStart);
  const speechEnd = Math.min(span.speechEnd, sliceEnd);
  return {
    speechStart: speechStart - sliceStart,
    speechEnd: speechEnd - sliceStart,
    sourceStart: span.atomic ? span.sourceStart : span.sourceStart + (speechStart - span.speechStart),
    sourceEnd: span.atomic ? span.sourceEnd : span.sourceStart + (speechEnd - span.speechStart),
    atomic: span.atomic,
  };
}

function sliceBlock(block: NarrationScriptBlock, sliceStart: number, sliceEnd: number): NarrationScriptBlock {
  return {
    ...block,
    speech: block.speech.slice(sliceStart, sliceEnd),
    spans: block.spans
      .filter(span => span.speechStart < sliceEnd && sliceStart < span.speechEnd)
      .map(span => sliceSpan(span, sliceStart, sliceEnd)),
  };
}

function splitOversizeBlock(playbackBlock: PlaybackBlock): PlaybackBlock[] {
  const { block } = playbackBlock;
  if (block.speech.length <= BLOCK_MAX_CHARACTERS) {
    return [playbackBlock];
  }
  const cutPoint = findCutPoint(block);
  if (cutPoint >= block.speech.length) {
    return [playbackBlock];
  }
  return [
    { block: sliceBlock(block, 0, cutPoint), startsSection: playbackBlock.startsSection },
    ...splitOversizeBlock({ block: sliceBlock(block, cutPoint, block.speech.length), startsSection: false }),
  ];
}

/**
 * Groups blocks into the segments that audio is generated for. Segments end
 * at block boundaries, and preferably just before a heading.
 */
function planSegments(playbackBlocks: PlaybackBlock[]): NarrationSegmentPlan[] {
  const segments: NarrationSegmentPlan[] = [];
  let startBlockIndex = 0;

  for (let blockIndex = 1; blockIndex <= playbackBlocks.length; blockIndex++) {
    const targetCharacters = segments.length === 0 ? FIRST_SEGMENT_TARGET_CHARACTERS : SEGMENT_TARGET_CHARACTERS;
    const currentBlocks = playbackBlocks.slice(startBlockIndex, blockIndex).map(({ block }) => block);
    const currentCharacters = getNarrationSegmentText(currentBlocks).length;
    const nextBlock = playbackBlocks.at(blockIndex);

    const isLastBlock = !nextBlock;
    const nextBlockOverflows = !!nextBlock
      && currentCharacters + NARRATION_BLOCK_SEPARATOR.length + nextBlock.block.speech.length > targetCharacters;
    const nextBlockStartsSection = !!nextBlock && nextBlock.startsSection && currentCharacters >= targetCharacters / 2;

    if (isLastBlock || nextBlockOverflows || nextBlockStartsSection) {
      segments.push({ startBlockIndex, endBlockIndex: blockIndex, characterCount: currentCharacters });
      startBlockIndex = blockIndex;
    }
  }
  return segments;
}

export function getNarrationSegmentText(blocks: NarrationScriptBlock[]): string {
  return blocks.map(block => block.speech).join(NARRATION_BLOCK_SEPARATOR);
}

/**
 * Converts a post's HTML into the script that its narration is generated
 * from: what to say for each block of the post, in what order, and how that
 * divides into segments.
 */
export async function buildNarrationScript(html: string, postInfo: NarrationPostInfo): Promise<BuiltNarrationScript> {
  const { document } = getLinkedom()(`<!DOCTYPE html><html><body>${html}</body></html>`);
  const root = document.body;
  const domBlocks = extractNarrationBlocks(root);
  const contexts = getBlockContexts(domBlocks, root);
  const mathReadings = await getMathReadings(domBlocks);

  const drafts = domBlocks.map((block, documentIndex): DocumentBlockDraft => ({
    documentIndex,
    fingerprint: block.fingerprint,
    speechText: block.type === "text"
      ? verbalizeTextBlock(block, contexts[documentIndex], mathReadings)
      : { speech: omittedBlockAnnouncements[block.omittedKind], spans: [] },
    context: contexts[documentIndex],
    referencedFootnoteIds: getReferencedFootnoteIds(block),
  }));

  const playbackBlocks = [getIntroBlock(postInfo), ...orderBlocksForPlayback(drafts)].flatMap(splitOversizeBlock);
  return {
    script: { blocks: playbackBlocks.map(({ block }) => block) },
    segments: planSegments(playbackBlocks),
  };
}
