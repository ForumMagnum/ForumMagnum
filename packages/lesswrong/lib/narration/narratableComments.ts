/**
 * Whether a comment can be narrated. A deleted comment has nothing to read,
 * and a comment whose author is hidden can't be read in its author's voice.
 */
export function isCommentNarratable(comment: Pick<DbComment, "deleted"|"draft"|"hideAuthor">): boolean {
  return !comment.deleted && !comment.draft && !comment.hideAuthor;
}
