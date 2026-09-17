import type { TabId } from './groupings';
import { REVIEW_GROUP_TO_PRIORITY } from '@/lib/collections/users/reviewGroups';

export function parseModerationQueue(value: unknown): TabId | undefined {
  if (value === 'all' || value === 'posts' || value === 'classifiedPosts' || value === 'curation') {
    return value;
  }
  return Object.keys(REVIEW_GROUP_TO_PRIORITY).find((group): group is ReviewGroup => group === value);
}

export function getModerationInboxSearch(search: string, queue: TabId, userId: string | null): string {
  const params = new URLSearchParams(search);
  params.set('queue', queue);
  if (userId) {
    params.set('user', userId);
  } else {
    params.delete('user');
  }
  return `?${params.toString()}`;
}
