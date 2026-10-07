function getSimpleSortKey(user: SunshineUsersList): [number, number] {
  const hasPendingComments = (user.pendingCommentCount ?? 0) > 0;
  // Users with comments pending sort on their comment words, even if they also have posts pending
  const words = hasPendingComments ? user.pendingCommentWordCount : user.pendingPostWordCount;
  return [hasPendingComments ? 0 : 1, words ?? 0];
}

/**
 * The fixed order for the Simple tab: users with comments pending, then users
 * with posts pending, each shortest first.
 */
export function sortSimpleUsers(users: SunshineUsersList[]): SunshineUsersList[] {
  return [...users].sort((a, b) => {
    const [aSection, aWords] = getSimpleSortKey(a);
    const [bSection, bWords] = getSimpleSortKey(b);
    return aSection - bSection || aWords - bWords;
  });
}
