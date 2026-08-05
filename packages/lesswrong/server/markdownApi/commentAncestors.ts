/**
 * Walks parentCommentId links from a comment's first parent up to the root.
 * Returns the ancestor ids root-first (oldest ancestor first, immediate parent
 * last). Cycle-safe (each id visited at most once) and depth-capped.
 */
export const collectAncestorCommentIds = async (
  firstParentCommentId: string | null,
  loadParentCommentId: (commentId: string) => Promise<string | null>,
  maxDepth = 100,
): Promise<string[]> => {
  const chain: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = firstParentCommentId;
  while (currentId && !visited.has(currentId) && chain.length < maxDepth) {
    visited.add(currentId);
    chain.push(currentId);
    currentId = await loadParentCommentId(currentId);
  }
  return chain.reverse();
};
