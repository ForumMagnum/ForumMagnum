import { isPost, type ContentItem } from "./helpers";

export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

export const getPlaintext = (content: ContentItem) =>
  stripHtml(content.contents?.html ?? '').replace(/\s+/g, ' ').trim();

export const getTitleAndText = (content: ContentItem) => {
  const title = isPost(content) ? content.title ?? '' : '';
  return `${title} ${getPlaintext(content)}`;
};

// Unwrapped text is one paragraph, but <br>/<li> walls return [].
export const getFormattingParagraphPlaintextsFromHtml = (html: string): string[] => {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => stripHtml(match[1]).replace(/\s+/g, ' ').trim());
  if (paragraphs.length > 0) return paragraphs;
  const hasOtherBlockBreaks = /<(br|li|h[1-6]|blockquote)\b/i.test(html);
  if (hasOtherBlockBreaks) return [];
  const plaintext = stripHtml(html).replace(/\s+/g, ' ').trim();
  return plaintext ? [plaintext] : [];
};

// Source newlines between tags are insignificant, so blank lines only come from markup.
const BLOCK_BOUNDARY = /<\/(?:p|div|li|h[1-6]|blockquote|figure|table|tr)\s*>|<br\s*\/?>/gi;
const NON_BREAKING_SPACE = /&nbsp;|&#160;|&#xa0;|\u00a0/gi;

interface BlankLineStats {
  /** Consecutive blank lines count once, so one gap is one run however it is marked up. */
  blankRuns: number;
  textBlocks: number;
}

const getBlankLineStatsFromHtml = (html: string): BlankLineStats => {
  const lines = stripHtml(html.replace(/\s+/g, ' ').replace(BLOCK_BOUNDARY, '\n'))
    .replace(NON_BREAKING_SPACE, ' ')
    .split('\n')
    .map(line => line.trim());
  while (lines.length > 0 && !lines[0]) lines.shift();
  while (lines.length > 0 && !lines[lines.length - 1]) lines.pop();

  let blankRuns = 0;
  let textBlocks = 0;
  let inBlankRun = false;
  for (const line of lines) {
    if (line) {
      textBlocks++;
      inBlankRun = false;
    } else if (!inBlankRun) {
      blankRuns++;
      inBlankRun = true;
    }
  }
  return { blankRuns, textBlocks };
};

export const getBlankLineCountFromHtml = (html: string): number => getBlankLineStatsFromHtml(html).blankRuns;

export const getBlankLineRatioFromHtml = (html: string): number | null => {
  const { blankRuns, textBlocks } = getBlankLineStatsFromHtml(html);
  if (blankRuns + textBlocks === 0) return null;
  return blankRuns / (blankRuns + textBlocks);
};

const FORMATTING_SENTENCE_BOUNDARY = /[.!?]+(?:\s+|$)/;

export const getRepeatedPunctuationRunCountFromHtml = (html: string): number => {
  const plaintext = stripHtml(html).replace(/\s+/g, ' ').trim();
  return (plaintext.match(/[.!?]{3,}/g) ?? []).length;
};

export const getLongestFormattingSentenceLengthFromHtml = (html: string): number => {
  const paragraphs = getFormattingParagraphPlaintextsFromHtml(html);
  let longestSentenceLength = 0;
  for (const paragraph of paragraphs) {
    for (const sentence of paragraph.split(FORMATTING_SENTENCE_BOUNDARY)) {
      longestSentenceLength = Math.max(longestSentenceLength, sentence.trim().length);
    }
  }

  return longestSentenceLength;
};

export const getFirstParagraphLength = (content: ContentItem): number | null => {
  const firstParagraph = (content.contents?.html ?? '').match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!firstParagraph) return null;
  return stripHtml(firstParagraph[1]).trim().length;
};

const LATIN_LETTER_REGEX = /[A-Za-zÀ-ɏ]/;

export const getLetters = (content: ContentItem) => getPlaintext(content).match(/\p{L}/gu) ?? [];

export const getNonLatinLetterRatio = (content: ContentItem): number | null => {
  const letters = getLetters(content);
  if (letters.length === 0) return null;
  return letters.filter(letter => !LATIN_LETTER_REGEX.test(letter)).length / letters.length;
};
