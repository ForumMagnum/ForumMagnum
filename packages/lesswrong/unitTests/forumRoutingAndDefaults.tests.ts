import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { isHomeRoute } from '@/lib/routeChecks';
import { commentDefaultToAlignment } from '@/lib/collections/comments/helpers';
import { userNeedsAFNonMemberWarning } from '@/lib/alignment-forum/users/helpers';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { createPaginatedResolver } from '@/server/resolvers/paginatedResolver';

describe('forum-specific routing and defaults', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the supplied forum for home routes and comment defaults', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Helpers must use the supplied forum type');
    });

    expect(isHomeRoute('/', 'LessWrong')).toBe(true);
    expect(isHomeRoute('/', 'AlignmentForum')).toBe(false);
    expect(isHomeRoute('/allPosts', 'LessWrong')).toBe(false);
    expect(commentDefaultToAlignment(null, undefined, 'AlignmentForum')).toBe(true);
    expect(commentDefaultToAlignment(null, undefined, 'LessWrong')).toBe(false);
  });

  it('preserves non-member warning preferences while using the supplied forum', () => {
    const user = createAdminContext().currentUser;
    if (!user) throw new Error('Expected an admin context user');
    user.isAdmin = false;
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');

    expect(userNeedsAFNonMemberWarning(user, 'LessWrong')).toBe(false);
    expect(userNeedsAFNonMemberWarning(user, 'AlignmentForum')).toBe(true);
    user.hideAFNonMemberInitialWarning = true;
    expect(userNeedsAFNonMemberWarning(user, 'AlignmentForum')).toBe(false);
    expect(userNeedsAFNonMemberWarning(user, 'AlignmentForum', false)).toBe(true);
    user.isAdmin = true;
    expect(userNeedsAFNonMemberWarning(user, 'AlignmentForum', false)).toBe(false);
    expect(userNeedsAFNonMemberWarning(null, 'AlignmentForum')).toBe(false);
  });

  it('only reuses paginated resolver results for the same forum', async () => {
    const callback = jest.fn(async (context: ResolverContext) => [{ forumType: context.forumType }]);
    const { Query } = createPaginatedResolver({
      name: 'ForumCacheTest',
      graphQLType: 'ForumCacheTestItem',
      callback,
      cacheMaxAgeMs: 300000,
    });
    const resolve = Query.ForumCacheTest;
    const lwContext = createAnonymousContext({ forumType: 'LessWrong' });
    const afContext = createAnonymousContext({ forumType: 'AlignmentForum' });

    expect(await resolve(undefined, { limit: 1 }, lwContext)).toEqual({ results: [{ forumType: 'LessWrong' }] });
    expect(await resolve(undefined, { limit: 1 }, lwContext)).toEqual({ results: [{ forumType: 'LessWrong' }] });
    expect(callback).toHaveBeenCalledTimes(1);

    expect(await resolve(undefined, { limit: 1 }, afContext)).toEqual({ results: [{ forumType: 'AlignmentForum' }] });
    expect(await resolve(undefined, { limit: 1 }, afContext)).toEqual({ results: [{ forumType: 'AlignmentForum' }] });
    expect(callback).toHaveBeenCalledTimes(2);

    expect(await resolve(undefined, { limit: 1 }, lwContext)).toEqual({ results: [{ forumType: 'LessWrong' }] });
    expect(callback).toHaveBeenCalledTimes(3);
  });
});
