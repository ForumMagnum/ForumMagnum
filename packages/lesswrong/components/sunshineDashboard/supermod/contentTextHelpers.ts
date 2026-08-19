import { isPost, type ContentItem } from "./helpers";

export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

export const getPlaintext = (content: ContentItem) =>
  stripHtml(content.contents?.html ?? '').replace(/\s+/g, ' ').trim();

export const getTitleAndText = (content: ContentItem) => {
  const title = isPost(content) ? content.title ?? '' : '';
  return `${title} ${getPlaintext(content)}`;
};

/** Paragraph text used by the formatting highlight rule, including fully unwrapped content. */
export const getFormattingParagraphPlaintextsFromHtml = (html: string): string[] => {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => stripHtml(match[1]).replace(/\s+/g, ' ').trim());
  if (paragraphs.length > 0) return paragraphs;

  const hasOtherBlockBreaks = /<(br|li|h[1-6]|blockquote)\b/i.test(html);
  if (hasOtherBlockBreaks) return [];
  const plaintext = stripHtml(html).replace(/\s+/g, ' ').trim();
  return plaintext ? [plaintext] : [];
};

const FORMATTING_SENTENCE_BOUNDARY = /[.!?]+(?:\s+|$)/;

/** Runs of three or more sentence punctuation characters, such as ellipses or repeated exclamation marks. */
export const getRepeatedPunctuationRunCountFromHtml = (html: string): number => {
  const plaintext = stripHtml(html).replace(/\s+/g, ' ').trim();
  return (plaintext.match(/[.!?]{3,}/g) ?? []).length;
};

/** Longest sentence-like run in one formatting paragraph, measured in plain-text characters. */
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

/** Length of the content's first paragraph, or null if it doesn't have one */
export const getFirstParagraphLength = (content: ContentItem): number | null => {
  const firstParagraph = (content.contents?.html ?? '').match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!firstParagraph) return null;
  return stripHtml(firstParagraph[1]).trim().length;
};

// Basic Latin plus Latin-1/Extended (accented European letters)
const LATIN_LETTER_REGEX = /[A-Za-zÀ-ɏ]/;

export const getLetters = (content: ContentItem) => getPlaintext(content).match(/\p{L}/gu) ?? [];

export const getNonLatinLetterRatio = (content: ContentItem): number | null => {
  const letters = getLetters(content);
  if (letters.length === 0) return null;
  return letters.filter(letter => !LATIN_LETTER_REGEX.test(letter)).length / letters.length;
};
