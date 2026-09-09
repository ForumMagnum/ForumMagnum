import type { NextRequest } from 'next/server';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import type { ForumTypeString } from '@/lib/instanceSettings';

export function getForumTypeForRequest(_request: NextRequest): ForumTypeString {
  // TODO: Determine the forum type from the request source.
  return forumTypeSetting.get();
}

/**
 * Get the forum type from an App Router server component or generateMetadata.
 * Async so callers can later use request cookies and headers without changing this interface.
 */
export async function getForumTypeForPage(): Promise<ForumTypeString> {
  // TODO: Read debugging overrides from cookies and the forum type from middleware headers.
  return forumTypeSetting.get();
}
