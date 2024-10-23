
export const getUserFromResults = <T extends UsersMinimumInfo>(results: Array<T> | null | undefined): T | null => {
  // HOTFIX: Filtering out invalid users
  return results?.find(user => !!user.displayName) || results?.[0] || null;
};
