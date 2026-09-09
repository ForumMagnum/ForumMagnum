import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { computeContextFromUser } from '@/server/vulcan-lib/apollo-server/context';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { runQuery } from '@/server/vulcan-lib/query';
import { sendWelcomingPM, welcomeMessageDelayer } from '@/server/callbacks/userCallbackFunctions';

describe('resolver context forum type', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('captures the setting separately for each request and SSR context', () => {
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    const lwContext = computeContextFromUser({ user: null, isSSR: false });

    getForumType.mockReturnValue('AlignmentForum');
    const afContext = computeContextFromUser({ user: null, isSSR: true });

    expect(lwContext.forumType).toBe('LessWrong');
    expect(afContext.forumType).toBe('AlignmentForum');
  });

  it('initializes anonymous and admin contexts while preserving explicit overrides', () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');

    expect(createAnonymousContext().forumType).toBe('AlignmentForum');
    expect(createAdminContext().forumType).toBe('AlignmentForum');
    expect(createAnonymousContext({ forumType: 'LessWrong' }).forumType).toBe('LessWrong');
    expect(createAdminContext({ forumType: 'LessWrong' }).forumType).toBe('LessWrong');
  });

  it('defaults recommendations to the context forum, while respecting an explicit AF argument', async () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    const context = createAnonymousContext({ forumType: 'AlignmentForum' });
    const getPosts = jest.spyOn(context.repos.posts, 'getCuratedAndPopularPosts').mockResolvedValue([]);

    await runQuery('{ CuratedAndPopularThisWeek(limit: 3) { results { _id } } }', {}, context);
    expect(getPosts).toHaveBeenLastCalledWith({ currentUser: null, limit: 3, af: true });

    await runQuery('{ CuratedAndPopularThisWeek(limit: 3, af: false) { results { _id } } }', {}, context);
    expect(getPosts).toHaveBeenLastCalledWith({ currentUser: null, limit: 3, af: false });
  });

  it('uses the callback context to choose the welcome-message delay', async () => {
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');
    const recordEvent = jest.spyOn(welcomeMessageDelayer, 'recordEvent').mockResolvedValue(undefined);
    const user = { _id: 'new-user' };

    await sendWelcomingPM(user, createAnonymousContext({ forumType: 'LessWrong' }));
    expect(recordEvent).toHaveBeenLastCalledWith({ key: user._id, timing: { type: 'none' } });

    getForumType.mockReturnValue('LessWrong');
    await sendWelcomingPM(user, createAnonymousContext({ forumType: 'AlignmentForum' }));
    expect(recordEvent).toHaveBeenLastCalledWith({ key: user._id, timing: undefined });
    expect(welcomeMessageDelayer.defaultTiming).toEqual({ type: 'delayed', delayMinutes: 5 });
  });
});
