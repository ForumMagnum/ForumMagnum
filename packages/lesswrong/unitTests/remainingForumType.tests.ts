import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getForumTheme } from '@/themes/forumTheme';
import { defineStyles } from '@/components/hooks/defineStyles';
import { styleDefinitionToCSS } from '@/components/hooks/serverEmbeddedStyles';
import { getCommentViewOptions, isValidCommentView } from '@/lib/commentViewOptions';
import { getGitHubCredentials } from '@/lib/auth/githubOAuth';
import { githubClientIdSetting, githubOAuthSecretSetting, afGithubClientIdSetting, afGithubOAuthSecretSetting } from '@/server/databaseSettings';
import { userIdsWithAccessToLlmChat } from '@/lib/instanceSettings';
import { userCanCreateField } from '@/lib/vulcan-users/permissions';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import llmConversationsSchema from '@/lib/collections/llmConversations/newSchema';
import tagsSchema from '@/lib/collections/tags/newSchema';

const styles = defineStyles('RemainingForumTypeTest', (theme: ThemeType) => ({
  root: { fontWeight: theme.isAF ? 500 : 400 },
}));

describe('remaining forum-specific behavior', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps themes and generated styles separate for each forum', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Theme creation must use the supplied forum type');
    });
    const lw = getForumTheme({ name: 'default' }, 'LessWrong');
    const af = getForumTheme({ name: 'default' }, 'AlignmentForum');

    expect(lw.isLW).toBe(true);
    expect(af.isAF).toBe(true);
    expect(lw.palette.fonts.serifStack).not.toBe(af.palette.fonts.serifStack);
    expect(af.typography.postStyle.fontVariantNumeric).toBe('lining-nums');
    expect(lw.typography.postStyle.fontVariantNumeric).toBeUndefined();
    expect(getForumTheme({ name: 'default' }, 'LessWrong')).toBe(lw);

    const lwCss = styleDefinitionToCSS({ name: 'default' }, styles, 'LessWrong');
    const afCss = styleDefinitionToCSS({ name: 'default' }, styles, 'AlignmentForum');
    expect(lwCss).toMatch(/font-weight:\s*400/);
    expect(afCss).toMatch(/font-weight:\s*500/);
    expect(styleDefinitionToCSS({ name: 'default' }, styles, 'LessWrong')).toBe(lwCss);
  });

  it('selects and validates comment views for the supplied forum', () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    expect(getCommentViewOptions('AlignmentForum')).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: 'afPostCommentsTop' }),
      expect.objectContaining({ value: 'postLWComments' }),
    ]));
    expect(isValidCommentView('postLWComments', 'AlignmentForum')).toBe(true);
    expect(isValidCommentView('postLWComments', 'LessWrong')).toBe(false);
    expect(isValidCommentView('postCommentsDeleted', 'LessWrong')).toBe(false);
    expect(isValidCommentView('postCommentsDeleted', 'LessWrong', { includeAdminViews: true })).toBe(true);
  });

  it('selects OAuth credentials explicitly without consulting the global forum', () => {
    jest.spyOn(githubClientIdSetting, 'get').mockReturnValue('lw-client');
    jest.spyOn(githubOAuthSecretSetting, 'get').mockReturnValue('lw-test-secret');
    jest.spyOn(afGithubClientIdSetting, 'get').mockReturnValue('af-client');
    jest.spyOn(afGithubOAuthSecretSetting, 'get').mockReturnValue('af-test-secret');
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('OAuth must use the supplied forum type');
    });
    expect(getGitHubCredentials('LessWrong')).toEqual({ clientId: 'lw-client', clientSecret: 'lw-test-secret' });
    expect(getGitHubCredentials('AlignmentForum')).toEqual({ clientId: 'af-client', clientSecret: 'af-test-secret' });
  });

  it('passes the request forum through field-create permissions', () => {
    const context = createAdminContext({ forumType: 'LessWrong' });
    const user = context.currentUser;
    if (!user) throw new Error('Expected an admin context user');
    user.isAdmin = false;
    user._id = 'authorized-user';
    jest.spyOn(userIdsWithAccessToLlmChat, 'get').mockReturnValue([user._id]);
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');

    const canCreate = llmConversationsSchema.title.graphql.canCreate;
    expect(userCanCreateField(user, canCreate, context)).toBe(true);
    expect(userCanCreateField(user, canCreate, { ...context, forumType: 'AlignmentForum' })).toBe(false);
    const canCreateWikiOnly = tagsSchema.wikiOnly.graphql.canCreate;
    expect(userCanCreateField(null, canCreateWikiOnly, context)).toBe(false);
    expect(userCanCreateField(null, canCreateWikiOnly, { ...context, forumType: 'AlignmentForum' })).toBe(true);
  });
});
