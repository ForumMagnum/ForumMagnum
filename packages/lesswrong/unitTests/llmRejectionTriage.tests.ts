import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { isEligibleForLlmRejectionTriage, runLlmRejectionTriage } from '@/server/llmRejectionTriage/triage';
import * as classifier from '@/server/llmRejectionTriage/classifier';
import * as moderation from '@/server/users/moderationUtils';
import { UNREVIEWED_POST, UNREVIEWED_BIO_UPDATE, UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_PROFILE_IMAGE_UPDATE } from '@/lib/collections/moderatorActions/constants';

// All database methods used below are mocked; no SQL connection is created.
jest.mock('@/server/sql/sqlClient', () => ({ getSqlClient: jest.fn(() => ({})) }));
jest.mock('@/server/llmRejectionTriage/classifier', () => ({ classifyLlmRejectedUser: jest.fn() }));
jest.mock('@/server/users/moderationUtils', () => ({ purgeSpamUser: jest.fn() }));

function setupTriage() {
  const context = createAdminContext({ forumType: 'LessWrong' });
  const template = context.currentUser;
  if (!template) throw new Error('Expected a context user');
  const user: DbUser = {
    ...template,
    _id: 'author', displayName: 'Author', createdAt: new Date('2026-01-01'),
    isAdmin: false, groups: [], needsReview: true, deleted: false, banned: null,
    biography: null,
  };
  let latestUser = user;
  let html = '<p>Original submission</p>';
  const actionTypes: ModeratorActionType[] = [UNREVIEWED_POST];
  jest.spyOn(context.Users, 'findOne').mockImplementation(async () => latestUser);
  jest.spyOn(context.repos.users, 'getPendingContentStats').mockResolvedValue([{
    pendingPostCount: 0, pendingCommentCount: 0, oldestPendingContentAt: null, approvedContentCount: 0,
  }]);
  jest.spyOn(context.repos.users, 'getLastRemovedFromReviewQueueAt').mockResolvedValue([null]);
  const actionCursor = context.ModeratorActions.find({});
  jest.spyOn(context.ModeratorActions, 'find').mockReturnValue(Object.assign(actionCursor, {
    fetch: jest.fn().mockImplementation(async () => actionTypes.map(type => ({ type, createdAt: new Date('2026-01-01'), endedAt: null }))),
  }));
  const postCursor = context.Posts.find({});
  jest.spyOn(context.Posts, 'find').mockReturnValue(Object.assign(postCursor, {
    fetch: jest.fn().mockResolvedValue([{
      _id: 'post', title: 'Submission', postedAt: new Date('2026-01-01'), contents_latest: 'revision',
      rejected: true, rejectedReason: 'This is an automated rejection',
    }]),
  }));
  const commentCursor = context.Comments.find({});
  jest.spyOn(context.Comments, 'find').mockReturnValue(Object.assign(commentCursor, { fetch: jest.fn().mockResolvedValue([]) }));
  const revisionCursor = context.Revisions.find({});
  jest.spyOn(context.Revisions, 'find').mockReturnValue(Object.assign(revisionCursor, {
    fetch: jest.fn().mockImplementation(async () => [{ _id: 'revision', html }]),
  }));
  const evaluationCursor = context.AutomatedContentEvaluations.find({});
  jest.spyOn(context.AutomatedContentEvaluations, 'find').mockReturnValue(Object.assign(evaluationCursor, { fetch: jest.fn().mockResolvedValue([]) }));
  const purge = jest.spyOn(moderation, 'purgeSpamUser').mockResolvedValue(undefined);
  return {
    context, user, actionTypes, purge,
    editSubmission: () => { html = '<p>Edited submission</p>'; },
    editBio: () => {
      latestUser = { ...user, biography: {
        html: '<p>New bio</p>', wordCount: 2, editedAt: new Date(), userId: user._id,
        version: '1.0.0', originalContents: { type: 'html', data: '<p>New bio</p>', yjsState: null },
      } };
    },
  };
}

describe('LLM rejection triage evidence', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it.each(['submission', 'bio'])("does not apply a verdict after the %s changes during classification", async field => {
    const state = setupTriage();
    jest.spyOn(classifier, 'classifyLlmRejectedUser').mockImplementation(async () => {
      if (field === 'submission') state.editSubmission();
      else state.editBio();
      return { verdict: 'spam', reason: 'Spam' };
    });
    expect(await runLlmRejectionTriage(state.user._id, state.context)).toBeNull();
    expect(state.purge).not.toHaveBeenCalled();
  });

  it('retains the existing decision when the evidence is unchanged', async () => {
    const { context, user } = setupTriage();
    jest.spyOn(classifier, 'classifyLlmRejectedUser').mockResolvedValue({ verdict: 'spam', reason: 'Spam' });
    expect(await runLlmRejectionTriage(user._id, context, { dryRun: true })).toMatchObject({ action: 'purge' });
  });

  it.each<ModeratorActionType>([UNREVIEWED_MAP_LOCATION_UPDATE, UNREVIEWED_PROFILE_IMAGE_UPDATE])('leaves unexamined profile evidence for a moderator: %s', async type => {
    const { context, user, actionTypes } = setupTriage();
    actionTypes.push(type);
    expect(await isEligibleForLlmRejectionTriage(user, context)).toBe(false);
  });

  it('supports bio review triggers because the classifier reads the bio', async () => {
    const { context, user, actionTypes } = setupTriage();
    actionTypes.push(UNREVIEWED_BIO_UPDATE);
    expect(await isEligibleForLlmRejectionTriage(user, context)).toBe(true);
  });
});
