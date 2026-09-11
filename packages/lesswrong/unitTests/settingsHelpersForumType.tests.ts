import { crosspostKarmaThreshold, defaultVisibilityTags, localeSetting } from '@/lib/instanceSettings';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getDefaultFilterSettings } from '@/lib/filterSettings';
import postsSchema from '@/lib/collections/posts/newSchema';
import { userCanCreateField, userCanUpdateField } from '@/lib/vulcan-users/permissions';
import { createAdminContext, createAnonymousContext } from '@/server/vulcan-lib/createContexts';

describe('forum-aware settings helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('derives the locale from explicit forum overrides when constructing contexts', () => {
    jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');
    jest.spyOn(localeSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'en-GB' : 'en-US'
    );

    expect(createAnonymousContext().locale).toBe('en-US');
    expect(createAnonymousContext({ forumType: 'AlignmentForum' }).locale).toBe('en-GB');
    expect(createAdminContext({ forumType: 'AlignmentForum' }).locale).toBe('en-GB');
    expect(createAdminContext({ forumType: 'AlignmentForum', locale: 'fr-FR' }).locale).toBe('fr-FR');
  });

  it('uses each forum’s default visibility tags without retaining the previous forum’s defaults', () => {
    jest.spyOn(defaultVisibilityTags, 'get').mockImplementation(forum => [{
      tagId: forum === 'AlignmentForum' ? 'af-tag' : 'lw-tag',
      tagName: 'Default tag',
      filterMode: 'Hidden',
    }]);

    expect(getDefaultFilterSettings('LessWrong').tags).toEqual([
      { tagId: 'lw-tag', tagName: 'Default tag', filterMode: 'TagDefault' },
    ]);
    expect(getDefaultFilterSettings('AlignmentForum').tags).toEqual([
      { tagId: 'af-tag', tagName: 'Default tag', filterMode: 'TagDefault' },
    ]);
  });

  it('uses the resolver forum for crosspost creation and update permissions, preserving ownership checks', () => {
    jest.spyOn(crosspostKarmaThreshold, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 100 : 10
    );
    const context = createAdminContext({ forumType: 'AlignmentForum' });
    const user = context.currentUser;
    if (!user) throw new Error('Expected an admin context user');
    user.isAdmin = false;
    user._id = 'author';
    user.karma = 50;
    const post = { userId: user._id };
    const { canCreate, canUpdate } = postsSchema.fmCrosspost.graphql;
    const lwContext: ResolverContext = { ...context, forumType: 'LessWrong' };

    expect(userCanCreateField(user, canCreate, context)).toBe(false);
    expect(userCanCreateField(user, canCreate, lwContext)).toBe(true);
    expect(userCanUpdateField<'Posts'>(user, canUpdate, post, context)).toBe(false);
    expect(userCanUpdateField<'Posts'>(user, canUpdate, post, lwContext)).toBe(true);
    expect(userCanUpdateField<'Posts'>(user, canUpdate, { userId: 'another-author' }, lwContext)).toBe(false);
  });
});
