import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext';

const SOFT_HYPHEN = '\u00AD';
const HUGE_BADNESS = 1e8;
const INFEASIBLE_SPACE_RATIO = 0.4;
const RIVER_THRESHOLD = 1.5;
const TIGHT_SPACE_RATIO = 0.65;
const SHORT_LINE_RATIO = 0.6;
const OVERFLOW_SPACE_RATIO = 0.2;
const MIN_READABLE_SPACE_RATIO = 0.75;

type LineSegment =
  | { kind: 'text'; text: string; width: number }
  | { kind: 'space'; width: number };
type TrailingMarker = 'none' | 'soft-hyphen';
type LineEnding = 'paragraph-end' | 'wrap';

interface MeasuredLine {
  segments: LineSegment[];
  wordWidth: number;
  spaceCount: number;
  naturalWidth: number;
  maxWidth: number;
  ending: LineEnding;
  trailingMarker: TrailingMarker;
}

type LineSpacing =
  | { kind: 'ragged' }
  | { kind: 'overflow' }
  | { kind: 'justified'; width: number };

interface BreakCandidate {
  segIndex: number;
  kind: 'start' | 'space' | 'soft-hyphen' | 'end';
}

interface LineStats {
  wordWidth: number;
  spaceCount: number;
  naturalWidth: number;
  trailingMarker: TrailingMarker;
}

export interface JustifiedLine {
  words: string[];
  isJustified: boolean;
}

export interface PreparedJustificationData {
  preparedParagraphs: PreparedTextWithSegments[];
  normalSpaceWidth: number;
  hyphenWidth: number;
}

const PREFIXES = [
  'anti', 'auto', 'be', 'bi', 'co', 'com', 'con', 'contra', 'counter', 'de',
  'dis', 'en', 'em', 'ex', 'extra', 'fore', 'hyper', 'il', 'im', 'in', 'inter',
  'intra', 'ir', 'macro', 'mal', 'micro', 'mid', 'mis', 'mono', 'multi', 'non',
  'omni', 'out', 'over', 'para', 'poly', 'post', 'pre', 'pro', 'pseudo',
  'quasi', 're', 'retro', 'semi', 'sub', 'super', 'sur', 'syn', 'tele', 'trans',
  'tri', 'ultra', 'un', 'under',
];

const SUFFIXES = [
  'able', 'ible', 'tion', 'sion', 'ment', 'ness', 'ous', 'ious', 'eous', 'ful',
  'less', 'ive', 'ative', 'itive', 'al', 'ial', 'ical', 'ing', 'ling',
  'ed', 'er', 'est', 'ism', 'ist', 'ity', 'ety', 'ty', 'ence', 'ance', 'ly',
  'fy', 'ify', 'ize', 'ise', 'ure', 'ture',
];

function hyphenateWord(word: string): string[] {
  const lower = word.toLowerCase().replace(/[.,;:!?"'—–\-]/g, '');
  if (lower.length < 5) return [word];
  for (const prefix of PREFIXES) {
    if (lower.startsWith(prefix) && lower.length - prefix.length >= 3) {
      return [word.slice(0, prefix.length), word.slice(prefix.length)];
    }
  }
  for (const suffix of SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      const cut = word.length - suffix.length;
      return [word.slice(0, cut), word.slice(cut)];
    }
  }
  return [word];
}

function hyphenateParagraphText(paragraph: string): string {
  const tokens = paragraph.split(/(\s+)/);
  let result = '';
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      result += token;
      continue;
    }
    const parts = hyphenateWord(token);
    result += parts.length <= 1 ? token : parts.join(SOFT_HYPHEN);
  }
  return result;
}

function isSpaceText(text: string): boolean {
  return text.trim().length === 0;
}

function toLineSegment(text: string, width: number): LineSegment {
  if (isSpaceText(text)) return { kind: 'space', width };
  return { kind: 'text', text, width };
}

function trimTrailingSpaces(segments: LineSegment[]): void {
  while (segments.length > 0 && segments[segments.length - 1]!.kind === 'space') {
    segments.pop();
  }
}

function finalizeMeasuredLine(
  segments: LineSegment[], maxWidth: number, ending: LineEnding, trailingMarker: TrailingMarker,
): MeasuredLine {
  let wordWidth = 0;
  let spaceCount = 0;
  let naturalWidth = 0;
  for (const segment of segments) {
    naturalWidth += segment.width;
    if (segment.kind === 'space') {
      spaceCount++;
    } else {
      wordWidth += segment.width;
    }
  }
  return { segments, wordWidth, spaceCount, naturalWidth, maxWidth, ending, trailingMarker };
}

function getLineStatsFromBreakCandidates(
  segments: readonly string[], widths: readonly number[], breakCandidates: readonly BreakCandidate[],
  fromCandidate: number, toCandidate: number, hyphenWidth: number, normalSpaceWidth: number,
): LineStats {
  const from = breakCandidates[fromCandidate]!.segIndex;
  const to = breakCandidates[toCandidate]!.segIndex;
  const trailingMarker: TrailingMarker = breakCandidates[toCandidate]!.kind === 'soft-hyphen' ? 'soft-hyphen' : 'none';
  let wordWidth = 0;
  let spaceCount = 0;
  for (let segIndex = from; segIndex < to; segIndex++) {
    const text = segments[segIndex]!;
    if (text === SOFT_HYPHEN) continue;
    if (isSpaceText(text)) { spaceCount++; continue; }
    wordWidth += widths[segIndex]!;
  }
  if (to > from && isSpaceText(segments[to - 1]!)) spaceCount--;
  if (trailingMarker === 'soft-hyphen') wordWidth += hyphenWidth;
  return { wordWidth, spaceCount, naturalWidth: wordWidth + spaceCount * normalSpaceWidth, trailingMarker };
}

function lineBadness(
  lineStats: LineStats, maxWidth: number, normalSpaceWidth: number, isLastLine: boolean,
): number {
  if (isLastLine) {
    return lineStats.wordWidth > maxWidth ? HUGE_BADNESS : 0;
  }
  if (lineStats.spaceCount <= 0) {
    const slack = maxWidth - lineStats.wordWidth;
    return slack < 0 ? HUGE_BADNESS : slack * slack * 10;
  }
  const justifiedSpace = (maxWidth - lineStats.wordWidth) / lineStats.spaceCount;
  if (justifiedSpace < 0) return HUGE_BADNESS;
  if (justifiedSpace < normalSpaceWidth * INFEASIBLE_SPACE_RATIO) return HUGE_BADNESS;
  const ratio = (justifiedSpace - normalSpaceWidth) / normalSpaceWidth;
  const absRatio = Math.abs(ratio);
  const badness = absRatio * absRatio * absRatio * 1000;
  const riverExcess = justifiedSpace / normalSpaceWidth - RIVER_THRESHOLD;
  const riverPenalty = riverExcess > 0 ? 5000 + riverExcess * riverExcess * 10000 : 0;
  const tightThreshold = normalSpaceWidth * TIGHT_SPACE_RATIO;
  const tightPenalty = justifiedSpace < tightThreshold
    ? 3000 + (tightThreshold - justifiedSpace) * (tightThreshold - justifiedSpace) * 10000
    : 0;
  const hyphenPenalty = lineStats.trailingMarker === 'soft-hyphen' ? 50 : 0;
  return badness + riverPenalty + tightPenalty + hyphenPenalty;
}

function buildMeasuredLineFromCandidateRange(
  prepared: PreparedTextWithSegments, breakCandidates: readonly BreakCandidate[],
  fromCandidate: number, toCandidate: number, maxWidth: number, hyphenWidth: number,
): MeasuredLine {
  const from = breakCandidates[fromCandidate]!.segIndex;
  const to = breakCandidates[toCandidate]!.segIndex;
  const ending: LineEnding = breakCandidates[toCandidate]!.kind === 'end' ? 'paragraph-end' : 'wrap';
  const trailingMarker: TrailingMarker = breakCandidates[toCandidate]!.kind === 'soft-hyphen' ? 'soft-hyphen' : 'none';
  const segments: LineSegment[] = [];
  for (let segIndex = from; segIndex < to; segIndex++) {
    const text = prepared.segments[segIndex]!;
    if (text === SOFT_HYPHEN) continue;
    segments.push(toLineSegment(text, prepared.widths[segIndex]!));
  }
  if (trailingMarker === 'soft-hyphen' && ending === 'wrap') {
    segments.push({ kind: 'text', text: '-', width: hyphenWidth });
  }
  trimTrailingSpaces(segments);
  return finalizeMeasuredLine(segments, maxWidth, ending, trailingMarker);
}

function layoutParagraphOptimal(
  prepared: PreparedTextWithSegments, maxWidth: number, normalSpaceWidth: number, hyphenWidth: number,
): MeasuredLine[] {
  const segments = prepared.segments;
  const widths = prepared.widths;
  const segmentCount = segments.length;
  if (segmentCount === 0) return [];
  const breakCandidates: BreakCandidate[] = [{ segIndex: 0, kind: 'start' }];
  for (let segIndex = 0; segIndex < segmentCount; segIndex++) {
    const text = segments[segIndex]!;
    if (text === SOFT_HYPHEN) {
      if (segIndex + 1 < segmentCount) breakCandidates.push({ segIndex: segIndex + 1, kind: 'soft-hyphen' });
      continue;
    }
    if (isSpaceText(text) && segIndex + 1 < segmentCount) {
      breakCandidates.push({ segIndex: segIndex + 1, kind: 'space' });
    }
  }
  breakCandidates.push({ segIndex: segmentCount, kind: 'end' });
  const candidateCount = breakCandidates.length;
  const dp: number[] = new Array(candidateCount).fill(Infinity);
  const previous: number[] = new Array(candidateCount).fill(-1);
  dp[0] = 0;
  for (let toCandidate = 1; toCandidate < candidateCount; toCandidate++) {
    const isLastLine = breakCandidates[toCandidate]!.kind === 'end';
    for (let fromCandidate = toCandidate - 1; fromCandidate >= 0; fromCandidate--) {
      if (dp[fromCandidate] === Infinity) continue;
      const lineStats = getLineStatsFromBreakCandidates(
        segments, widths, breakCandidates, fromCandidate, toCandidate, hyphenWidth, normalSpaceWidth,
      );
      if (lineStats.naturalWidth > maxWidth * 2) break;
      const totalBadness = dp[fromCandidate]! + lineBadness(lineStats, maxWidth, normalSpaceWidth, isLastLine);
      if (totalBadness < dp[toCandidate]!) {
        dp[toCandidate] = totalBadness;
        previous[toCandidate] = fromCandidate;
      }
    }
  }
  const breakIndices: number[] = [];
  let current = candidateCount - 1;
  while (current > 0) {
    if (previous[current] === -1) { current--; continue; }
    breakIndices.push(current);
    current = previous[current]!;
  }
  breakIndices.reverse();
  const lines: MeasuredLine[] = [];
  let fromCandidate = 0;
  for (const toCandidate of breakIndices) {
    lines.push(buildMeasuredLineFromCandidateRange(prepared, breakCandidates, fromCandidate, toCandidate, maxWidth, hyphenWidth));
    fromCandidate = toCandidate;
  }
  return lines;
}

function getDisplaySpacing(line: MeasuredLine, normalSpaceWidth: number): LineSpacing {
  if (line.ending === 'paragraph-end') return { kind: 'ragged' };
  if (line.naturalWidth < line.maxWidth * SHORT_LINE_RATIO) return { kind: 'ragged' };
  if (line.spaceCount <= 0) return { kind: 'ragged' };
  const rawJustifiedSpace = (line.maxWidth - line.wordWidth) / line.spaceCount;
  if (rawJustifiedSpace < normalSpaceWidth * OVERFLOW_SPACE_RATIO) return { kind: 'overflow' };
  const width = Math.max(rawJustifiedSpace, normalSpaceWidth * MIN_READABLE_SPACE_RATIO);
  return { kind: 'justified', width };
}

function segmentsToWords(segments: LineSegment[]): string[] {
  const words: string[] = [];
  let current = '';
  for (const seg of segments) {
    if (seg.kind === 'text') {
      current += seg.text;
    } else {
      if (current) words.push(current);
      current = '';
    }
  }
  if (current) words.push(current);
  return words;
}

function measuredLineToJustified(line: MeasuredLine, normalSpaceWidth: number): JustifiedLine {
  const spacing = getDisplaySpacing(line, normalSpaceWidth);
  return {
    words: segmentsToWords(line.segments),
    isJustified: spacing.kind === 'justified',
  };
}

export function prepareForJustification(paragraphs: string[], font: string): PreparedJustificationData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const hyphenatedParagraphs = paragraphs.map(p => hyphenateParagraphText(p));
  return {
    preparedParagraphs: hyphenatedParagraphs.map(p => prepareWithSegments(p, font)),
    normalSpaceWidth: ctx.measureText(' ').width,
    hyphenWidth: ctx.measureText('-').width,
  };
}

export function layoutJustified(data: PreparedJustificationData, maxWidth: number): JustifiedLine[][] {
  return data.preparedParagraphs.map(prepared => {
    const measured = layoutParagraphOptimal(prepared, maxWidth, data.normalSpaceWidth, data.hyphenWidth);
    return measured.map(line => measuredLineToJustified(line, data.normalSpaceWidth));
  });
}
