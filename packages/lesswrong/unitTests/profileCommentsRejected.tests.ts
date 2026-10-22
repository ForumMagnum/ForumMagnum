import { CommentsViews } from '@/lib/collections/comments/views';
import { hideUnreviewedAuthorCommentsSettings } from '@/lib/instanceSettings';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';

const AUTHOR_ID = 'author-id';

async function getProfileCommentsSelector(currentUser: Pick<DbUser, '_id' | 'isAdmin'> | null, terms: Partial<CommentsViewTerms>) {
  const context = createAnonymousContext({ forumType: 'LessWrong' });
  // TODO: I AM AN INSTANCE OF Claude Opus 5.5 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  context.currentUser = currentUser as DbUser | null;
  const query = await viewTermsToQuery(CommentsViews, { view: 'profileComments', authorIsUnreviewed: null, ...terms }, undefined, context);
  return JSON.stringify(query.selector);
}

describe('profileComments view with includeRejected', () => {
  beforeEach(() => {
    jest.spyOn(hideUnreviewedAuthorCommentsSettings, 'get').mockReturnValue('2023-04-04T18:54:35.895Z');
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows an admin the user's rejected and unreviewed comments", async () => {
    const selector = await getProfileCommentsSelector({ _id: 'admin-id', isAdmin: true }, { userId: AUTHOR_ID, includeRejected: true });
    expect(selector).not.toContain('"rejected"');
    expect(selector).not.toContain('authorIsUnreviewed');
  });

  it("shows the author their own rejected comments", async () => {
    const selector = await getProfileCommentsSelector({ _id: AUTHOR_ID, isAdmin: false }, { userId: AUTHOR_ID, includeRejected: true });
    expect(selector).not.toContain('"rejected"');
  });

  it("still hides rejected and new unreviewed comments from other users", async () => {
    const selector = await getProfileCommentsSelector({ _id: 'other-id', isAdmin: false }, { userId: AUTHOR_ID, includeRejected: true });
    expect(selector).toContain('"rejected":{"$ne":true}');
    expect(selector).toContain('"authorIsUnreviewed":{"$ne":true}');
  });

  it("doesn't include rejected comments when no user is specified", async () => {
    const selector = await getProfileCommentsSelector(null, { includeRejected: true });
    expect(selector).toContain('"rejected":{"$ne":true}');
  });

  it("hides new unreviewed comments from admins when not opted in", async () => {
    const selector = await getProfileCommentsSelector({ _id: 'admin-id', isAdmin: true }, { userId: AUTHOR_ID });
    expect(selector).toContain('"rejected":{"$ne":true}');
    expect(selector).toContain('"authorIsUnreviewed":{"$ne":true}');
  });
});
