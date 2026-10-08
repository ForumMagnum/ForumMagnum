function getSimpleSortKey(user: SunshineUsersList): [number, number] {
  const hasPendingComments = (user.pendingCommentCount ?? 0) > 0;
  const words = hasPendingComments ? user.pendingCommentWordCount : user.pendingPostWordCount;
  return [hasPendingComments ? 0 : 1, words ?? 0];
}

export function sortSimpleUsers(users: SunshineUsersList[]): SunshineUsersList[] {
  return [...users].sort((a, b) => {
    const [aSection, aWords] = getSimpleSortKey(a);
    const [bSection, bWords] = getSimpleSortKey(b);
    return aSection - bSection || aWords - bWords;
  });
}
