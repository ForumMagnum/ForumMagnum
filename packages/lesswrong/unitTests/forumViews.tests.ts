import { CommentsViews } from '@/lib/collections/comments/views';
import { ConversationsViews } from '@/lib/collections/conversations/views';
import { PostsViews } from '@/lib/collections/posts/views';
import { SequencesViews } from '@/lib/collections/sequences/views';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { SCORE_BIAS, timeDecayExpr } from '@/lib/scoring';
import { getDefaultViewSelector, viewTermsToQuery } from '@/lib/utils/viewUtils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

describe('forum-specific views', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    { name: 'comments', getSelector: (context: ResolverContext) => getDefaultViewSelector(CommentsViews, context) },
    { name: 'conversations', getSelector: (context: ResolverContext) => getDefaultViewSelector(ConversationsViews, context) },
    { name: 'posts', getSelector: (context: ResolverContext) => getDefaultViewSelector(PostsViews, context) },
    { name: 'sequences', getSelector: (context: ResolverContext) => getDefaultViewSelector(SequencesViews, context) },
  ])('uses the request forum for the default $name filter', async ({ getSelector }) => {
    const lwContext = createAnonymousContext({ forumType: 'LessWrong' });
    const afContext = createAnonymousContext({ forumType: 'AlignmentForum' });
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('LessWrong');

    expect(await getSelector(afContext)).toMatchObject({ af: true });
    getForumType.mockReturnValue('AlignmentForum');
    expect(await getSelector(lwContext)).not.toHaveProperty('af');
  });

  it('combines the default and named conversation filters using the request forum', async () => {
    const lwContext = createAnonymousContext({ forumType: 'LessWrong' });
    const afContext = createAnonymousContext({ forumType: 'AlignmentForum' });
    const terms: ConversationsViewTerms = { view: 'userConversations', userId: 'user-id' };
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');

    const lwQuery = await viewTermsToQuery(ConversationsViews, terms, undefined, lwContext);
    expect(lwQuery.selector).toMatchObject({ participantIds: 'user-id', moderator: { $ne: true } });
    expect(lwQuery.selector).not.toHaveProperty('af');

    getForumType.mockReturnValue('LessWrong');
    const afQuery = await viewTermsToQuery(ConversationsViews, terms, undefined, afContext);
    expect(afQuery.selector).toMatchObject({ participantIds: 'user-id', af: true });
    expect(afQuery.selector).not.toHaveProperty('moderator');
  });

  it('chooses the post scoring algorithm from the request forum', async () => {
    const lwContext = createAnonymousContext({ forumType: 'LessWrong' });
    const afContext = createAnonymousContext({ forumType: 'AlignmentForum' });
    const terms: PostsViewTerms = {
      view: 'magic',
      filterSettings: { personalBlog: 'Default', tags: [] },
      algoStartingAgeHours: 42,
      algoDecayFactorSlowest: 1,
      algoDecayFactorFastest: 1,
    };
    const getForumType = jest.spyOn(forumTypeSetting, 'get').mockReturnValue('AlignmentForum');

    const lwQuery = await viewTermsToQuery(PostsViews, terms, undefined, lwContext);
    expect(lwQuery.syntheticFields).toMatchObject({
      filteredScore: { $divide: [expect.anything(), { $pow: [{ $add: [expect.anything(), 42] }, 1] }] },
    });

    getForumType.mockReturnValue('LessWrong');
    const afQuery = await viewTermsToQuery(PostsViews, terms, undefined, afContext);
    expect(afQuery.syntheticFields).toMatchObject({
      filteredScore: { $divide: [expect.anything(), { $pow: [{ $add: [expect.anything(), SCORE_BIAS] }, expect.any(Number)] }] },
    });
  });

  it('uses the explicit forum for the standard scoring age offset', () => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Scoring must use the supplied forum type');
    });

    expect(timeDecayExpr('LessWrong')).toMatchObject({ $pow: [{ $add: [expect.anything(), 6] }, expect.any(Number)] });
    expect(timeDecayExpr('AlignmentForum')).toMatchObject({ $pow: [{ $add: [expect.anything(), SCORE_BIAS] }, expect.any(Number)] });
  });
});
