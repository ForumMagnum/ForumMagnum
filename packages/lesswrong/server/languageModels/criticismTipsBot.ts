import type { PostIsCriticismRequest } from '../resolvers/postResolvers';

/**
 * EA-specific criticism classifier is disabled after removing EA deployment paths.
 */
export async function postIsCriticism(_post: PostIsCriticismRequest, _currentUserId?: string): Promise<boolean> {
  return false;
}
