// Elasticsearch's `_english_` stopword list, which fm_synonym_analyzer applies.
const englishStopwords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not",
  "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with",
]);

/** Query tokens that survive the analyzer's stopword filter. */
export function contentTokens(search: string): string[] {
  const tokens = search.toLowerCase().replace(/[-_‐-—]/g, " ").match(/[\p{L}\p{N}]+/gu) ?? [];
  return tokens.filter(token => !englishStopwords.has(token));
}
