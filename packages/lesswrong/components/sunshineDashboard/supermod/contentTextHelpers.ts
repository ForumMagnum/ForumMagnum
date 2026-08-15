import { isPost, type ContentItem } from "./helpers";

export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ');

export const getPlaintext = (content: ContentItem) =>
  stripHtml(content.contents?.html ?? '').replace(/\s+/g, ' ').trim();

export const getTitleAndText = (content: ContentItem) => {
  const title = isPost(content) ? content.title ?? '' : '';
  return `${title} ${getPlaintext(content)}`;
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
