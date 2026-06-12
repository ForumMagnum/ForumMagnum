export type CommentContentFormat = "plainText" | "markdown";

export function isCommentContentFormat(value: unknown): value is CommentContentFormat {
  return value === "plainText" || value === "markdown";
}
