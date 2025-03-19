export async function getPostReviewWinnerInfo(postId: string, context: ResolverContext): Promise<DbReviewWinner | null> {
  throw new Error("This function can only be run on the server");
}
