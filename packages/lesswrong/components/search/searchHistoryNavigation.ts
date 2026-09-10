export interface SearchHistoryNavigation {
  entries: readonly string[];
  index: number;
  draft: string;
}

export function navigateSearchHistory(
  navigation: SearchHistoryNavigation | null,
  history: readonly string[],
  currentQuery: string,
  direction: 'ArrowUp' | 'ArrowDown',
): {navigation: SearchHistoryNavigation | null; query: string} {
  if (!navigation) {
    if (direction === 'ArrowDown' || !history.length) return {navigation: null, query: currentQuery};
    const next = {entries: [...history], index: 0, draft: currentQuery};
    return {navigation: next, query: next.entries[0]};
  }
  const index = direction === 'ArrowUp'
    ? Math.min(navigation.index + 1, navigation.entries.length - 1)
    : navigation.index - 1;
  if (index < 0) return {navigation: null, query: navigation.draft};
  return {navigation: {...navigation, index}, query: navigation.entries[index]};
}
