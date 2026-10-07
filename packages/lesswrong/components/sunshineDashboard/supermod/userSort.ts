import { TupleSet, type UnionOf } from '@/lib/utils/typeGuardUtils';

export const userSortKeys = new TupleSet(['hasPendingComments', 'oldestPendingContent', 'pendingItemCount'] as const);
export type UserSortKey = UnionOf<typeof userSortKeys>;

export const sortDirections = new TupleSet(['asc', 'desc'] as const);
export type SortDirection = UnionOf<typeof sortDirections>;

export interface UserSortSpec {
  key: UserSortKey;
  direction: SortDirection;
}

export interface UserSort {
  primary: UserSortSpec;
  secondary: UserSortSpec | null;
}

// Held comments can't go live until reviewed, so they come first by default
export const DEFAULT_USER_SORT: UserSort = {
  primary: { key: 'hasPendingComments', direction: 'desc' },
  secondary: { key: 'oldestPendingContent', direction: 'asc' },
};

export const USER_SORT_KEY_LABELS: Record<UserSortKey, string> = {
  hasPendingComments: 'Has comments pending',
  oldestPendingContent: 'Earliest submission',
  pendingItemCount: 'Total # pending',
};

export const USER_SORT_DIRECTION_LABELS: Record<UserSortKey, Record<SortDirection, string>> = {
  hasPendingComments: { desc: 'Yes first', asc: 'No first' },
  oldestPendingContent: { asc: 'Oldest first', desc: 'Newest first' },
  pendingItemCount: { desc: 'Most first', asc: 'Fewest first' },
};

function getSortValue(user: SunshineUsersList, key: UserSortKey): number | null {
  switch (key) {
    case 'hasPendingComments':
      return (user.pendingCommentCount ?? 0) > 0 ? 1 : 0;
    case 'oldestPendingContent':
      return user.oldestPendingContentAt ? new Date(user.oldestPendingContentAt).getTime() : null;
    case 'pendingItemCount':
      return (user.pendingPostCount ?? 0) + (user.pendingCommentCount ?? 0);
  }
}

function compareUsers(a: SunshineUsersList, b: SunshineUsersList, { key, direction }: UserSortSpec): number {
  const aValue = getSortValue(a, key);
  const bValue = getSortValue(b, key);
  if (aValue === bValue) return 0;
  // Users with nothing pending have no submission time; they go last in either direction
  if (aValue === null) return 1;
  if (bValue === null) return -1;
  return direction === 'asc' ? aValue - bValue : bValue - aValue;
}

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

/** Stable, so users tied on every sort key keep the server's order. */
export function sortUsers(users: SunshineUsersList[], { primary, secondary }: UserSort): SunshineUsersList[] {
  const specs = secondary ? [primary, secondary] : [primary];
  return [...users].sort((a, b) => {
    for (const spec of specs) {
      const comparison = compareUsers(a, b, spec);
      if (comparison !== 0) return comparison;
    }
    return 0;
  });
}
