import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getResponseCounts, postGetCommentCount, postGetCommentCountStr } from '@/lib/collections/posts/helpers';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { getTocComments } from '@/lib/tableOfContents';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { userCanCreateField, userCanUpdateField } from '@/lib/vulcan-users/permissions';
import postsSchema from '@/lib/collections/posts/newSchema';

describe('forum-specific field helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('selects comment counts using the argument rather than the global setting', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Field helpers must use the supplied forum type');
    });
    const post = { commentCount: 10, afCommentCount: 1 };

    expect(postGetCommentCount(post, 'LessWrong')).toBe(10);
    expect(postGetCommentCount(post, 'AlignmentForum')).toBe(1);
    expect(postGetCommentCountStr(post, 'LessWrong')).toBe('10 comments');
    expect(postGetCommentCountStr(post, 'AlignmentForum')).toBe('1 comment');
    expect(postGetCommentCountStr(post, 'AlignmentForum', 0)).toBe('No comments');
    expect(postGetCommentCountStr(null, 'LessWrong')).toBe('No comments');
  });

  it('propagates forum type through response counts and table-of-contents labels', () => {
    const post = { commentCount: 10, afCommentCount: 1 };

    expect(getResponseCounts({ post, answers: [], forumType: 'AlignmentForum' })).toEqual({ answerCount: 0, commentCount: 1 });
    expect(getResponseCounts({ post, answers: [], forumType: 'LessWrong' })).toEqual({ answerCount: 0, commentCount: 10 });
    expect(getTocComments({ post, forumType: 'AlignmentForum' })[0].title).toBe('1 comment');
    expect(getTocComments({ post, forumType: 'LessWrong' })[0].title).toBe('10 comments');
  });

  it('preserves forum-specific display-name preferences and fallbacks', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Display names must use the supplied forum type');
    });
    const user = { displayName: ' Display Name ', fullName: ' Full Name ', username: 'username' };

    expect(userGetDisplayName(user, 'LessWrong')).toBe('Display Name');
    expect(userGetDisplayName(user, 'AlignmentForum')).toBe('Full Name');
    expect(userGetDisplayName({ ...user, fullName: null }, 'AlignmentForum')).toBe('Display Name');
    expect(userGetDisplayName({ ...user, displayName: null }, 'LessWrong')).toBe('username');
    expect(userGetDisplayName(null, 'AlignmentForum')).toBe('');
  });

  it('passes the request forum through field-update permission checks', () => {
    const context = createAdminContext({ forumType: 'AlignmentForum' });
    const user = context.currentUser;
    if (!user) throw new Error('Expected an admin context user');
    user.isAdmin = false;
    user.showHideKarmaOption = true;
    const post = { commentCount: 10, afCommentCount: 0 };
    const { canUpdate, canCreate } = postsSchema.hideCommentKarma.graphql;

    expect(userCanUpdateField<'Posts'>(user, canUpdate, post, context)).toBe(true);
    expect(userCanUpdateField<'Posts'>(user, canUpdate, post, { ...context, forumType: 'LessWrong' })).toBe(false);
    expect(userCanCreateField(user, canCreate, context)).toBe(true);
    user.showHideKarmaOption = false;
    expect(userCanUpdateField<'Posts'>(user, canUpdate, post, context)).toBe(false);
    expect(userCanCreateField(user, canCreate, context)).toBe(false);
  });
});
