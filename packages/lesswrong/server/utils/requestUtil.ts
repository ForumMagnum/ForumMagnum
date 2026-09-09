import type { NextRequest } from 'next/server';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import type { ForumTypeString } from '@/lib/instanceSettings';

export function getForumTypeForRequest(_request: NextRequest): ForumTypeString {
  // TODO: Determine the forum type from the request source.
  return forumTypeSetting.get();
}
