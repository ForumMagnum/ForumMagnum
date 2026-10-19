import { PostsViews } from '@/lib/collections/posts/views';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

describe('drafts view', () => {
  it("includes the user's rejected drafts and scheduled posts as well as drafts", async () => {
    const context = createAnonymousContext({ forumType: 'LessWrong' });
    const terms: PostsViewTerms = { view: 'drafts', userId: 'user-id', includeShared: true };
    const { selector } = await viewTermsToQuery(PostsViews, terms, undefined, context);

    expect(selector).not.toHaveProperty('draft');
    expect(selector).not.toHaveProperty('rejected');
    expect(selector).not.toHaveProperty('isFuture');
    expect(selector).toMatchObject({ deletedDraft: false });
    expect(selector.$or).toEqual([{ userId: 'user-id' }, { shareWithUsers: 'user-id' }, { coauthorUserIds: 'user-id' }]);
    expect(selector.$and).toEqual([{ $or: [{ draft: true }, { isFuture: true }] }]);
  });
});
