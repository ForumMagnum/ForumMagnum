import { eld } from 'eld/extrasmall';
import { compile } from 'html-to-text';

const detector = eld.newInstance();
const encoder = new TextEncoder();
const MIN_LETTERS = 20;
// ELD reads only the first ~350 UTF-8 bytes of each sample.
const MAX_SAMPLE_BYTES = 300;

const proseFromHtml = compile({
  wordwrap: false,
  selectors: [
    { selector: 'a', options: { ignoreHref: true } },
    ...['blockquote', 'q', 'pre', 'code', 'math', '.math-tex', '.mjx-chtml', 'mjx-container', 'img', 'script', 'style']
      .map(selector => ({ selector, format: 'skip' })),
    ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      .map(selector => ({ selector, options: { uppercase: false } })),
  ],
});

function letterCount(text: string): number {
  return (text.match(/\p{L}/gu) ?? []).length;
}

function languageSamples(text: string): string[] {
  const samples: string[] = [];
  let sample = '';
  let bytes = 0;
  for (const paragraph of text.split(/\n+/)) {
    for (const word of paragraph.match(/\S+\s*/gu) ?? []) {
      const wordBytes = encoder.encode(word).length;
      if (bytes + wordBytes > MAX_SAMPLE_BYTES && sample) {
        samples.push(sample);
        sample = '';
        bytes = 0;
      }
      if (wordBytes <= MAX_SAMPLE_BYTES) {
        sample += word;
        bytes += wordBytes;
        continue;
      }
      // Scripts without spaces still need bounded samples, across the full text.
      for (const character of word) {
        const characterBytes = encoder.encode(character).length;
        if (bytes + characterBytes > MAX_SAMPLE_BYTES) {
          samples.push(sample);
          sample = '';
          bytes = 0;
        }
        sample += character;
        bytes += characterBytes;
      }
    }
    if (letterCount(sample) >= MIN_LETTERS) {
      samples.push(sample);
      sample = '';
      bytes = 0;
    } else if (sample) {
      // Combine short lines instead of treating every list item as unknowable.
      sample += ' ';
      bytes += 1;
    }
  }
  if (sample) samples.push(sample);
  return samples;
}

interface ProseLanguageCounts {
  letters: number;
  nonEnglishLetters: number;
}

function getProseLanguageCounts(html: string): ProseLanguageCounts | null {
  const text = proseFromHtml(html).normalize('NFKC')
    .replace(/(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w.-]+\.[a-z]+/gi, ' ');
  const letters = letterCount(text);
  if (letters < MIN_LETTERS) return null;

  let nonEnglishLetters = 0;
  for (const sample of languageSamples(text)) {
    const sampleLetters = letterCount(sample);
    if (sampleLetters < MIN_LETTERS) continue;
    const result = detector.detect(sample);
    // Unknown text stays in the denominator; uncertainty isn't a rejection reason.
    if (result.language && result.language !== 'en' && result.isReliable()) {
      nonEnglishLetters += sampleLetters;
    }
  }
  return { letters, nonEnglishLetters };
}

/** Fraction of authored prose confidently identified as non-English. */
export function getNonEnglishProseRatio(html: string): number | null {
  const counts = getProseLanguageCounts(html);
  return counts ? counts.nonEnglishLetters / counts.letters : null;
}

/** Absolute amount of non-English prose, unaffected by an accompanying translation. */
export function getNonEnglishProseLetterCount(html: string): number | null {
  return getProseLanguageCounts(html)?.nonEnglishLetters ?? null;
}
