const englishStopwords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not",
  "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with",
]);

export function contentTokens(search: string): string[] {
  const tokens = search.toLowerCase().replace(/[-_‐-—]/g, " ").match(/[\p{L}\p{N}]+/gu) ?? [];
  return tokens.filter(token => !englishStopwords.has(token));
}
