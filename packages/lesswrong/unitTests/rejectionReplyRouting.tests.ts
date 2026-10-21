import { sendAppealLinkReplyIfFirstReply } from '@/server/collections/rejectionAppeals/helpers';
import { createAnonymousContext, createAdminContext } from '@/server/vulcan-lib/createContexts';

const mockClassify = jest.fn();
const mockSendMessage = jest.fn();
const mockTeamInbox = jest.fn();
jest.mock('@/server/collections/rejectionAppeals/classifyReply', () => ({
  isRejectionReplyAppeal: (...args: unknown[]) => mockClassify(...args),
}));
jest.mock('@/server/utils/teamInbox', () => ({
  isTeamInboxConversation: (...args: unknown[]) => mockTeamInbox(...args),
  sendMessageAs: (...args: unknown[]) => mockSendMessage(...args),
}));
jest.mock('@/server/utils/adminTeamAccount', () => ({
  getAdminTeamAccountId: async () => 'team',
  getAdminTeamAccount: async () => ({ _id: 'team', isAdmin: true }),
}));

const message: DbMessage = {
  _id: 'reply', schemaVersion: 1, userId: 'author', conversationId: 'conversation',
  createdAt: new Date(), contents: null, contents_latest: null, legacyData: null,
  noEmail: true, baseScore: 0, score: 0, voteCount: 0, extendedScore: null,
  afBaseScore: null, afExtendedScore: null, afVoteCount: null,
};

function setup() {
  const context = createAnonymousContext({ forumType: 'LessWrong' });
  const baseUser = createAdminContext().currentUser;
  if (!baseUser) throw new Error('Expected a test user');
  jest.spyOn(context.loaders.Conversations, 'load').mockResolvedValue({
    _id: 'conversation', schemaVersion: 1, af: false, archivedByIds: [],
    awaitingModeratorReply: true, createdAt: new Date(), latestActivity: new Date(),
    legacyData: null, messageCount: 2, moderator: true, participantIds: ['author', 'team'], title: 'Rejection',
  });
  jest.spyOn(context.loaders.Users, 'load').mockResolvedValue({ ...baseUser, _id: 'author', isAdmin: false, groups: [] });
  const count = jest.fn().mockResolvedValue(1);
  jest.spyOn(context.Messages, 'find').mockImplementation(jest.fn().mockReturnValue({ count }));
  const latestMessage = jest.spyOn(context.Messages, 'findOne').mockImplementation(jest.fn().mockResolvedValue(message));
  const post = jest.spyOn(context.Posts, 'findOne').mockImplementation(jest.fn().mockResolvedValue({ _id: 'post' }));
  jest.spyOn(context.Comments, 'findOne').mockImplementation(jest.fn().mockResolvedValue(null));
  const appeal = jest.spyOn(context.RejectionAppeals, 'findOne').mockImplementation(jest.fn().mockResolvedValue(null));
  mockClassify.mockResolvedValue(true);
  mockTeamInbox.mockResolvedValue(true);
  return { context, count, post, appeal, latestMessage };
}

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

describe('first rejection reply routing', () => {
  it('sends the form link for an appeal in the first reply', async () => {
    const { context } = setup();
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockClassify).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
      conversationId: 'conversation', html: expect.stringContaining('/rejection-review?postId=post'),
    }));
  });

  it('does not classify later replies', async () => {
    const { context, count } = setup();
    count.mockResolvedValue(2);
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockClassify).not.toHaveBeenCalled();
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not reply to a non-appeal', async () => {
    const { context } = setup();
    mockClassify.mockResolvedValue(false);
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not reply when the classifier fails', async () => {
    const { context } = setup();
    mockClassify.mockRejectedValue(new Error('Model unavailable'));
    await expect(sendAppealLinkReplyIfFirstReply(message, context)).rejects.toThrow('Model unavailable');
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('does not classify staff replies or non-team conversations', async () => {
    const { context } = setup();
    await sendAppealLinkReplyIfFirstReply({ ...message, userId: 'team' }, context);
    mockTeamInbox.mockResolvedValue(false);
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockClassify).not.toHaveBeenCalled();
  });

  it('does not classify content that already has an appeal', async () => {
    const { context, appeal } = setup();
    appeal.mockImplementation(jest.fn().mockResolvedValue({ _id: 'appeal' }));
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockClassify).not.toHaveBeenCalled();
  });

  it('rechecks eligibility and newer replies after classification', async () => {
    const { context, post, latestMessage } = setup();
    post.mockImplementation(jest.fn().mockResolvedValueOnce({ _id: 'post' }).mockResolvedValue(null));
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockSendMessage).not.toHaveBeenCalled();
    post.mockImplementation(jest.fn().mockResolvedValue({ _id: 'post' }));
    latestMessage.mockImplementation(jest.fn().mockResolvedValue({ ...message, _id: 'moderator-reply' }));
    await sendAppealLinkReplyIfFirstReply(message, context);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
