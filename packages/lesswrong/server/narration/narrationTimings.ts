import {
  NARRATION_BLOCK_SEPARATOR,
  type NarrationBlockTiming,
  type NarrationScriptBlock,
  type NarrationSegmentTimings,
  type NarrationSpan,
  type NarrationWordTiming,
} from "@/lib/narration/narrationTypes";
import type { ElevenLabsAlignment } from "./elevenLabs";

interface CharacterTimes {
  startMs: number[]
  endMs: number[]
}

export interface SegmentTimingsResult {
  timings: NarrationSegmentTimings
  durationMs: number
}

/**
 * Converts an alignment (which has one entry per character of the text, where
 * a character may be more than one UTF-16 code unit) into times indexed by
 * string offset into the text.
 */
function getCharacterTimes(text: string, alignment: ElevenLabsAlignment): CharacterTimes {
  const alignedText = alignment.characters.join("");
  if (alignedText !== text) {
    const firstDifference = Array.from(text).findIndex((char, i) => char !== alignedText[i]);
    throw new Error(
      `Speech alignment doesn't match the text that was sent (${alignedText.length} vs ${text.length} characters, `
      + `first difference at ${firstDifference}: ${JSON.stringify(alignedText.slice(firstDifference, firstDifference + 40))} `
      + `vs ${JSON.stringify(text.slice(firstDifference, firstDifference + 40))})`
    );
  }
  return {
    startMs: alignment.characters.flatMap((character, i) =>
      new Array<number>(character.length).fill(Math.round(alignment.character_start_times_seconds[i] * 1000))
    ),
    endMs: alignment.characters.flatMap((character, i) =>
      new Array<number>(character.length).fill(Math.round(alignment.character_end_times_seconds[i] * 1000))
    ),
  };
}

function getSpanSourceRange(span: NarrationSpan, speechStart: number, speechEnd: number): [number, number] {
  if (span.atomic) {
    return [span.sourceStart, span.sourceEnd];
  }
  return [
    span.sourceStart + Math.max(speechStart, span.speechStart) - span.speechStart,
    span.sourceStart + Math.min(speechEnd, span.speechEnd) - span.speechStart,
  ];
}

/**
 * The part of the block's source text that a range of its speech was made
 * from, or null if it wasn't made from any (eg, it's an added "Footnote 1:").
 */
function getSpeechSourceRange(spans: NarrationSpan[], speechStart: number, speechEnd: number): [number, number]|null {
  const sourceRanges = spans
    .filter(span => span.speechStart < speechEnd && speechStart < span.speechEnd)
    .map(span => getSpanSourceRange(span, speechStart, speechEnd));
  if (sourceRanges.length === 0) {
    return null;
  }
  return [
    Math.min(...sourceRanges.map(([sourceStart]) => sourceStart)),
    Math.max(...sourceRanges.map(([, sourceEnd]) => sourceEnd)),
  ];
}

/**
 * Consecutive words with the same source range are the reading of a single
 * element (an equation, for example), so they're merged into one entry.
 */
function mergeWordsWithSameSource(words: NarrationWordTiming[]): NarrationWordTiming[] {
  return words.reduce<NarrationWordTiming[]>((merged, word) => {
    const previous = merged.at(-1);
    if (previous && previous[2] === word[2] && previous[3] === word[3]) {
      return [...merged.slice(0, -1), [previous[0], word[1], word[2], word[3]]];
    }
    return [...merged, word];
  }, []);
}

function getBlockTiming(block: NarrationScriptBlock, blockIndex: number, textOffset: number, characterTimes: CharacterTimes): NarrationBlockTiming {
  const words = Array.from(block.speech.matchAll(/\S+/g)).flatMap((match): NarrationWordTiming[] => {
    const wordStart = match.index;
    const wordEnd = wordStart + match[0].length;
    const sourceRange = getSpeechSourceRange(block.spans, wordStart, wordEnd);
    if (!sourceRange) {
      return [];
    }
    return [[
      characterTimes.startMs[textOffset + wordStart],
      characterTimes.endMs[textOffset + wordEnd - 1],
      sourceRange[0],
      sourceRange[1],
    ]];
  });
  return {
    blockIndex,
    startMs: characterTimes.startMs[textOffset],
    endMs: characterTimes.endMs[textOffset + block.speech.length - 1],
    words: mergeWordsWithSameSource(words),
  };
}

/**
 * Given the blocks of a segment and the alignment of the speech generated for
 * the segment's text, works out when each block is spoken, and when each word
 * of the post's own text is.
 */
export function buildSegmentTimings(
  blocks: NarrationScriptBlock[],
  startBlockIndex: number,
  segmentText: string,
  alignment: ElevenLabsAlignment,
): SegmentTimingsResult {
  const characterTimes = getCharacterTimes(segmentText, alignment);
  const textOffsets = blocks.map((_, i) =>
    blocks.slice(0, i).reduce((offset, block) => offset + block.speech.length + NARRATION_BLOCK_SEPARATOR.length, 0)
  );
  return {
    timings: {
      blocks: blocks.map((block, i) => getBlockTiming(block, startBlockIndex + i, textOffsets[i], characterTimes)),
    },
    durationMs: characterTimes.endMs.at(-1) ?? 0,
  };
}
