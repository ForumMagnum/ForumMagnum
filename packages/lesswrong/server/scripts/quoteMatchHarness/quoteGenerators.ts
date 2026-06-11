import { findMathSpansInMarkdown } from "@/lib/utils/mathTokens";

/**
 * Synthetic quote generation for the quote-locator comparison harness.
 *
 * Quotes are sliced out of a document's agent-visible markdown (the exact
 * string the read API serves), giving each one a known ground truth: a
 * locator that matches the quote should select a range whose projected text
 * equals the quote's own rendered-plaintext projection. Perturbations then
 * simulate the ways agents fail to reproduce markdown verbatim; a perturbed
 * quote "means" the same text as its base quote, so it is scored against the
 * base quote's projection.
 */

export type QuoteGeneratorKind = "within-block" | "cross-block" | "full-block";

export interface GeneratedQuote {
  generator: QuoteGeneratorKind
  /** Perturbation name, or null for a verbatim slice. */
  perturbation: string | null
  /** The quote as the simulated agent would send it. */
  quote: string
  /** The verbatim slice this quote derives from (=== quote when unperturbed). */
  baseQuote: string
  /** Index of the (first) source block within the document's blocks. */
  blockIndex: number
}

export interface SelfQuoteOptions {
  withinBlockSamples: number
  crossBlockSamples: number
  fullBlockSamples: number
  /** Word-count bounds for within-block slices. */
  minWords: number
  maxWords: number
}

export const DEFAULT_SELF_QUOTE_OPTIONS: SelfQuoteOptions = {
  withinBlockSamples: 6,
  crossBlockSamples: 3,
  fullBlockSamples: 2,
  minWords: 4,
  maxWords: 32,
};

function hashStringToSeed(value: string): number {
  let h = 1779033703 ^ value.length;
  for (let i = 0; i < value.length; i++) {
    h = Math.imul(h ^ value.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/**
 * Deterministic PRNG (mulberry32) seeded from a string, so harness runs are
 * reproducible per document.
 */
export function createSeededRng(seed: string): () => number {
  let a = hashStringToSeed(seed);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Split agent-visible markdown into blocks on blank lines, keeping fenced
 * code blocks (which may contain blank lines) intact as single blocks.
 */
export function splitMarkdownBlocks(markdown: string): string[] {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
    }
    if (!inFence && line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }
  return blocks;
}

function isFencedBlock(block: string): boolean {
  return /^\s*(```|~~~)/.test(block);
}

interface CharSpan {
  start: number
  end: number
}

/**
 * Spans of a block that a slice boundary must not fall strictly inside:
 * math tokens, links/images, and inline code. Cutting through these produces
 * markdown fragments no real agent would send, which would contaminate the
 * failure statistics with generator artifacts.
 */
function findProtectedSpans(block: string): CharSpan[] {
  const spans: CharSpan[] = findMathSpansInMarkdown(block)
    .map((span) => ({ start: span.start, end: span.end }));
  const linkRegex = /!?\[[^\]]*\]\([^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(block))) {
    spans.push({ start: match.index, end: match.index + match[0].length });
  }
  const inlineCodeRegex = /`[^`\n]*`/g;
  while ((match = inlineCodeRegex.exec(block))) {
    spans.push({ start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

function boundaryAllowed(spans: CharSpan[], index: number): boolean {
  return !spans.some((span) => index > span.start && index < span.end);
}

function findWordSpans(block: string): CharSpan[] {
  const words: CharSpan[] = [];
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(block))) {
    words.push({ start: match.index, end: match.index + match[0].length });
  }
  return words;
}

/**
 * Generate verbatim quote slices from a document's blocks. Fenced code blocks
 * are skipped entirely: their match semantics are their own project, and a
 * mis-sliced fence would measure generator artifacts rather than matcher
 * behavior.
 */
/** Append a verbatim quote unless empty or already generated; returns whether it was added. */
function pushQuote(
  quotes: GeneratedQuote[],
  seenQuotes: Set<string>,
  generator: QuoteGeneratorKind,
  quote: string,
  blockIndex: number,
): boolean {
  const trimmed = quote.trim();
  if (!trimmed || seenQuotes.has(trimmed)) return false;
  seenQuotes.add(trimmed);
  quotes.push({ generator, perturbation: null, quote: trimmed, baseQuote: trimmed, blockIndex });
  return true;
}

export function generateSelfQuotes(
  blocks: string[],
  rng: () => number,
  options: SelfQuoteOptions = DEFAULT_SELF_QUOTE_OPTIONS,
): GeneratedQuote[] {
  const quotes: GeneratedQuote[] = [];
  const seenQuotes = new Set<string>();
  const usableIndexes = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => !isFencedBlock(block) && findWordSpans(block).length >= 2);
  if (usableIndexes.length === 0) return quotes;

  // Within-block slices at word boundaries, avoiding protected spans.
  const withinAttempts = options.withinBlockSamples * 4;
  let withinProduced = 0;
  for (let attempt = 0; attempt < withinAttempts && withinProduced < options.withinBlockSamples; attempt++) {
    const { block, index } = usableIndexes[Math.floor(rng() * usableIndexes.length)];
    const words = findWordSpans(block);
    if (words.length < options.minWords) continue;
    const protectedSpans = findProtectedSpans(block);
    const wordCount = options.minWords
      + Math.floor(rng() * (options.maxWords - options.minWords + 1));
    const startWord = Math.floor(rng() * Math.max(1, words.length - options.minWords + 1));
    const endWord = Math.min(startWord + wordCount - 1, words.length - 1);
    const start = words[startWord].start;
    const end = words[endWord].end;
    if (!boundaryAllowed(protectedSpans, start) || !boundaryAllowed(protectedSpans, end)) continue;
    if (pushQuote(quotes, seenQuotes, "within-block", block.slice(start, end), index)) {
      withinProduced++;
    }
  }

  // Cross-block slices: the tail of one block, a blank line, and the head of
  // the next. These are the quotes the current matcher structurally cannot
  // locate precisely (block boundaries project to nothing in its segment walk).
  const adjacentPairs = usableIndexes
    .filter(({ index }) => {
      const next = blocks[index + 1];
      return next !== undefined && !isFencedBlock(next) && findWordSpans(next).length >= 2;
    });
  for (let sample = 0; sample < options.crossBlockSamples && adjacentPairs.length > 0; sample++) {
    const { block, index } = adjacentPairs[Math.floor(rng() * adjacentPairs.length)];
    const nextBlock = blocks[index + 1];
    const tailWords = findWordSpans(block);
    const headWords = findWordSpans(nextBlock);
    const tailCount = 3 + Math.floor(rng() * 10);
    const headCount = 3 + Math.floor(rng() * 10);
    const tailStart = tailWords[Math.max(0, tailWords.length - tailCount)].start;
    const headEnd = headWords[Math.min(headCount, headWords.length) - 1].end;
    if (
      !boundaryAllowed(findProtectedSpans(block), tailStart)
      || !boundaryAllowed(findProtectedSpans(nextBlock), headEnd)
    ) continue;
    pushQuote(
      quotes,
      seenQuotes,
      "cross-block",
      `${block.slice(tailStart)}\n\n${nextBlock.slice(0, headEnd)}`,
      index,
    );
  }

  // Whole blocks.
  for (let sample = 0; sample < options.fullBlockSamples; sample++) {
    const { block, index } = usableIndexes[Math.floor(rng() * usableIndexes.length)];
    pushQuote(quotes, seenQuotes, "full-block", block, index);
  }

  return quotes;
}

export interface QuotePerturbation {
  name: string
  /** Returns the perturbed quote, or null when the perturbation is a no-op for this quote. */
  apply: (quote: string) => string | null
}

/**
 * Apply a string transform to the non-math segments of a quote. Math bodies
 * are LaTeX, where backslashes/underscores/asterisks are all meaningful, so
 * agent-infidelity perturbations must leave them alone.
 */
function transformOutsideMath(quote: string, transform: (segment: string) => string): string {
  const spans = findMathSpansInMarkdown(quote);
  let result = "";
  let cursor = 0;
  for (const span of spans) {
    result += transform(quote.slice(cursor, span.start)) + quote.slice(span.start, span.end);
    cursor = span.end;
  }
  return result + transform(quote.slice(cursor));
}

// Private-use character; never appears in real document text.
const SWAP_SENTINEL = String.fromCharCode(0xE001);

function swapAllOutsideMath(quote: string, a: string, b: string): string {
  return transformOutsideMath(quote, (segment) =>
    segment.split(a).join(SWAP_SENTINEL).split(b).join(a).split(SWAP_SENTINEL).join(b));
}

function nullIfUnchanged(original: string, perturbed: string): string | null {
  return perturbed === original ? null : perturbed;
}

/**
 * Simulated agent transcription infidelities, each modeling a failure class
 * observed or expected in real agent traffic. A perturbed quote refers to the
 * same document text as its base quote, so a correct locator should still
 * find the base quote's range.
 */
export const QUOTE_PERTURBATIONS: QuotePerturbation[] = [
  {
    // Agents "clean up" Turndown's escapes when quoting.
    name: "drop-escapes",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment.replace(/\\([\\`*_{}[\]()#+\-.!~<>|"'])/g, "$1"),
    )),
  },
  {
    name: "ellipsis-to-unicode",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment.replace(/\.\.\./g, "…"),
    )),
  },
  {
    name: "ellipsis-to-ascii",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment.replace(/…/g, "..."),
    )),
  },
  {
    name: "straighten-quotes",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment.replace(/[‘’]/g, "'").replace(/[“”]/g, '"'),
    )),
  },
  {
    name: "curlify-quotes",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment
        .replace(/(\w)'(\w)/g, "$1’$2")
        .replace(/"(\S)/g, "“$1")
        .replace(/(\S)"/g, "$1”"),
    )),
  },
  {
    name: "swap-emphasis-markers",
    apply: (quote) => {
      const doubled = swapAllOutsideMath(quote, "**", "__");
      return nullIfUnchanged(quote, swapAllOutsideMath(doubled, "*", "_"));
    },
  },
  {
    name: "collapse-newlines",
    apply: (quote) => nullIfUnchanged(quote, quote.replace(/[ \t]*\n+[ \t]*/g, " ")),
  },
  {
    // Agents sometimes quote the rendered text rather than the markdown,
    // dropping inline formatting markers entirely.
    name: "strip-inline-markers",
    apply: (quote) => nullIfUnchanged(quote, transformOutsideMath(
      quote,
      (segment) => segment.replace(/[*_`]/g, ""),
    )),
  },
];

/**
 * Expand a list of verbatim quotes with every applicable perturbation of each.
 */
export function withPerturbedVariants(baseQuotes: GeneratedQuote[]): GeneratedQuote[] {
  const expanded: GeneratedQuote[] = [];
  for (const base of baseQuotes) {
    expanded.push(base);
    for (const perturbation of QUOTE_PERTURBATIONS) {
      const perturbed = perturbation.apply(base.quote);
      if (perturbed === null) continue;
      expanded.push({
        ...base,
        perturbation: perturbation.name,
        quote: perturbed,
      });
    }
  }
  return expanded;
}
