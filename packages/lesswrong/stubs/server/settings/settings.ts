import type { ForumTypeString } from '@/lib/instanceSettings';

export function getSettings(_forumType: ForumTypeString): {
  public: Record<string, unknown>,
  private: Record<string, string>,
} {
  throw new Error('getSettings is only available on the server');
}
