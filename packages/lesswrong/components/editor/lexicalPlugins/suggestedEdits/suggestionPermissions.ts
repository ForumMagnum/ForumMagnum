/**
 * Get the authorId of a suggestion from its thread's comments.
 * The authorId is stored in the first comment with commentKind='suggestionSummary'.
 */
export function getSuggestionAuthorIdFromComments(
  comments: Array<{ commentKind?: string; authorId: string }>
): string | undefined {
  const summaryComment = comments.find((c) => c.commentKind === 'suggestionSummary');
  return summaryComment?.authorId;
}
