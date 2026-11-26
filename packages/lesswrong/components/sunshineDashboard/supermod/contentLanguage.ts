import { eld } from 'eld/extrasmall';
import { compile } from 'html-to-text';
import sumBy from 'lodash/sumBy';
import { countLetters } from './contentTextHelpers';

const MIN_LETTERS = 20;

const proseFromHtml = compile({
  wordwrap: false,
  selectors: [
    { selector: 'a', options: { ignoreHref: true } },
    ...['blockquote', 'q', 'pre', 'code', 'math', '.math-tex', '.mjx-chtml', 'mjx-container', 'img', 'script', 'style']
      .map(selector => ({ selector, format: 'skip' })),
  ],
});

function nonEnglishLetterCount(paragraph: string): number {
  const letters = countLetters(paragraph);
  if (letters < MIN_LETTERS) return 0;
  const result = eld.detect(paragraph);
  return result.language !== 'en' && result.isReliable() ? letters : 0;
}

interface ProseLanguageCounts {
  letters: number;
  nonEnglishLetters: number;
}

/** Letters of authored prose, and how many are in paragraphs confidently identified as non-English. */
export function getProseLanguageCounts(html: string): ProseLanguageCounts | null {
  const text = proseFromHtml(html).normalize('NFKC')
    .replace(/(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w.-]+\.[a-z]+/gi, ' ');
  const letters = countLetters(text);
  if (letters < MIN_LETTERS) return null;
  return { letters, nonEnglishLetters: sumBy(text.split(/\n+/), nonEnglishLetterCount) };
}
