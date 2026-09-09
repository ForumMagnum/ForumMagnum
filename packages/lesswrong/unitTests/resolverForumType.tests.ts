import { EventDebouncer } from "@/server/debouncer";
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { computeContextFromUser } from '@/server/vulcan-lib/apollo-server/context';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { runQuery } from '@/server/vulcan-lib/query';
import { sendWelcomingPM, welcomeMessageDelayer } from '@/server/callbacks/userCallbackFunctions';

describe('resolver context forum type', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses request headers and cookies for request and SSR contexts', () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');
    const lwContext = computeContextFromUser({ user: null, isSSR: false, headers: new Headers() });

    const afContext = computeContextFromUser({ user: null, isSSR: true, headers: new Headers({ host: 'alignmentforum.localhost:3000' }) });
    const cookieContext = computeContextFromUser({ user: null, isSSR: false, cookies: [{ name: 'forumType', value: 'AlignmentForum' }] });

    expect(lwContext.forumType).toBe('LessWrong');
    expect(afContext.forumType).toBe('AlignmentForum');
    expect(cookieContext.forumType).toBe('AlignmentForum');
  });

  it('preserves the forum when changing the context user', async () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('A derived context must not read the deployment forum');
    });
    const parent = createAnonymousContext({ forumType: 'AlignmentForum' });
    const user = createAdminContext({ forumType: parent.forumType }).currentUser;
    if (!user) throw new Error('Expected an admin user');
    user._id = 'moderator';

    const context = computeContextFromUser({
      user,
      forumType: parent.forumType,
      headers: new Headers({ host: 'localhost:3000' }),
      isSSR: false,
    });

    expect(context.forumType).toBe('AlignmentForum');
    expect(context.userId).toBe(user._id);
    expect(context.currentUser).toBe(user);
    expect(await context.loaders.Users.load(user._id)).toBe(user);
  });

  it('passes the queued forum to delayed callbacks', async () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    const callback = jest.fn();
    const debouncer = new EventDebouncer({
      name: 'forumContextTest',
      defaultTiming: { type: 'none' },
      callback,
    });
    await debouncer._dispatchEvent('user-id', ['notification-id'], 'AlignmentForum');
    expect(callback).toHaveBeenCalledWith('user-id', ['notification-id'], 'AlignmentForum');
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
    expect(recordEvent).toHaveBeenLastCalledWith({ key: user._id, af: false, timing: { type: 'none' } });

    getForumType.mockReturnValue('LessWrong');
    await sendWelcomingPM(user, createAnonymousContext({ forumType: 'AlignmentForum' }));
    expect(recordEvent).toHaveBeenLastCalledWith({ key: user._id, af: true, timing: undefined });
    expect(welcomeMessageDelayer.defaultTiming).toEqual({ type: 'delayed', delayMinutes: 5 });
  });
});
