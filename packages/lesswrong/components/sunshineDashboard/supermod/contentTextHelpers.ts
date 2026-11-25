import sumBy from "lodash/sumBy";
import { isPost, type ContentItem } from "./helpers";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

const htmlToPlaintext = (html: string) => stripHtml(html).replace(/\s+/g, ' ').trim();

export const getHtml = (content: ContentItem) => content.contents?.html ?? '';

export const getPlaintext = (content: ContentItem) => htmlToPlaintext(getHtml(content));

const PARAGRAPH_REGEX = /<p[^>]*>([\s\S]*?)<\/p>/gi;

export const getTitleAndText = (content: ContentItem) => {
  const title = isPost(content) ? content.title ?? '' : '';
  return `${title} ${getPlaintext(content)}`;
};

// Unwrapped text is one paragraph, but <br>/<li> walls return [].
export const getFormattingParagraphPlaintextsFromHtml = (html: string): string[] => {
  const paragraphs = [...html.matchAll(PARAGRAPH_REGEX)].map(match => htmlToPlaintext(match[1]));
  if (paragraphs.length > 0) return paragraphs;
  const hasOtherBlockBreaks = /<(br|li|h[1-6]|blockquote)\b/i.test(html);
  if (hasOtherBlockBreaks) return [];
  const plaintext = htmlToPlaintext(html);
  return plaintext ? [plaintext] : [];
};

// Source newlines between tags are insignificant, so blank lines only come from markup.
const BLOCK_BOUNDARY = /<\/(?:p|div|li|h[1-6]|blockquote|figure|table|tr)\s*>|<br\s*\/?>/gi;
const NON_BREAKING_SPACE = /&nbsp;|&#160;|&#xa0;|\u00a0/gi;

interface BlankLineStats {
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

export const getBlankLineRatioFromHtml = (html: string): number | null => {
  const { blankRuns, textBlocks } = getBlankLineStatsFromHtml(html);
  if (blankRuns + textBlocks === 0) return null;
  return blankRuns / (blankRuns + textBlocks);
};

const FORMATTING_SENTENCE_BOUNDARY = /[.!?]+(?:\s+|$)/;

export const getRepeatedPunctuationRunCountFromHtml = (html: string): number => {
  return (stripHtml(html).match(/[.!?]{3,}/g) ?? []).length;
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
  const [firstParagraph] = getHtml(content).matchAll(PARAGRAPH_REGEX);
  if (!firstParagraph) return null;
  return stripHtml(firstParagraph[1]).trim().length;
};

const BOLD_REGEX = /<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi;

const countLetters = (text: string) => (text.match(/\p{L}/gu) ?? []).length;

export const getBoldLetterRatioFromHtml = (html: string): number | null => {
  const letterCount = countLetters(stripHtml(html));
  if (letterCount === 0) return null;
  const boldLetterCount = sumBy([...html.matchAll(BOLD_REGEX)], match => countLetters(stripHtml(match[2])));
  return Math.min(1, boldLetterCount / letterCount);
};
