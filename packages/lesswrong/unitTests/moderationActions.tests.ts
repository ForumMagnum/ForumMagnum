const mockCreateMessage = jest.fn();
const mockCreateConversation = jest.fn();
const mockUpdatePost = jest.fn();
const mockUpdateComment = jest.fn();
const mockCreateRateLimit = jest.fn();
const mockCreateModeratorAction = jest.fn();
const mockUpdateUser = jest.fn();
const mockAppendNote = jest.fn();
const mockCreateEvent = jest.fn();
const mockIsModerator = jest.fn();

jest.mock('@/server/collections/messages/mutations', () => ({ createMessage: (...args: unknown[]) => mockCreateMessage(...args) }));
jest.mock('@/server/collections/conversations/mutations', () => ({ createConversation: (...args: unknown[]) => mockCreateConversation(...args) }));
jest.mock('@/server/collections/posts/mutations', () => ({ updatePost: (...args: unknown[]) => mockUpdatePost(...args) }));
jest.mock('@/server/collections/comments/mutations', () => ({ updateComment: (...args: unknown[]) => mockUpdateComment(...args) }));
jest.mock('@/server/collections/users/mutations', () => ({ updateUser: (...args: unknown[]) => mockUpdateUser(...args) }));
jest.mock('@/server/collections/userRateLimits/mutations', () => ({ createUserRateLimit: (...args: unknown[]) => mockCreateRateLimit(...args) }));
jest.mock('@/server/collections/moderatorActions/mutations', () => ({ createModeratorAction: (...args: unknown[]) => mockCreateModeratorAction(...args) }));
jest.mock('@/server/collections/lwevents/mutations', () => ({ createLWEvent: (...args: unknown[]) => mockCreateEvent(...args) }));
jest.mock('@/server/users/sunshineNotes', () => ({ appendToSunshineNotes: (...args: unknown[]) => mockAppendNote(...args) }));
jest.mock('@/lib/vulcan-users/permissions', () => ({ userIsAdminOrMod: () => mockIsModerator() }));
jest.mock('@/server/callbacks/messageCallbacks', () => ({
  checkIfNewMessageIsEmpty: (message: Pick<CreateMessageDataInput, 'contents'>) => {
    if (!message.contents?.originalContents?.data) throw new Error('Empty message');
  },
}));
jest.mock('@/server/vulcan-lib/createContexts', () => ({ createAnonymousContext: () => mockContext }));

import { completeUserModeration, type UserModerationOptions } from '@/server/resolvers/moderationActions';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { getPendingContentSelector } from '@/lib/collections/users/reviewGroups';

interface TestContent {
  _id: string;
  userId: string;
  rejected: boolean;
}
interface CreatedDocument {
  _id: string;
  endedAt?: Date | null;
}
const mockUser = { _id: 'user', displayName: 'User', needsReview: true, reviewedAt: null, postingDisabled: false, allCommentingDisabled: false, conversationsDisabled: false };
const mockPosts: TestContent[] = [];
const mockComments: TestContent[] = [];
const mockMessages = new Map<string, CreatedDocument>();
const mockConversations = new Map<string, CreatedDocument>();
const mockRateLimits = new Map<string, CreatedDocument>();
const mockActions = new Map<string, CreatedDocument>();
const mockEvents = new Map<string, CreatedDocument>();
const mockContext = {
  currentUser: { _id: 'moderator', displayName: 'Moderator' },
  Users: { findOne: jest.fn() },
  Posts: { findOne: jest.fn(), find: jest.fn() },
  Comments: { findOne: jest.fn(), find: jest.fn() },
  Conversations: { findOne: jest.fn() },
  Messages: { findOne: jest.fn() },
  UserRateLimits: { findOne: jest.fn() },
  ModeratorActions: { findOne: jest.fn(), find: jest.fn() },
  LWEvents: { findOne: jest.fn() },
  ModerationTemplates: { find: jest.fn() },
};

function storeCreatedDocument(store: Map<string, CreatedDocument>, { data }: { data: CreatedDocument }) {
  if (store.has(data._id)) throw new Error('Duplicate document creation');
  store.set(data._id, data);
  return data;
}

function rejectContent(content: TestContent[], { selector, data }: UpdatePostInput | UpdateCommentInput) {
  const document = content.find(item => item._id === selector._id);
  if (!document) throw new Error('Missing content');
  Object.assign(document, data);
  return document;
}

function moderationOptions(overrides: Partial<UserModerationOptions> = {}): UserModerationOptions {
  return {
    operationId: 'moderation_operation_1', userId: 'user',
    rejection: { documentId: 'post0', collectionName: 'Posts', reason: 'Reason', templateIds: ['template'] },
    message: { contents: { originalContents: { type: 'html', data: '<p>Message</p>' } } },
    disablePermissions: true,
    rateLimits: [{ userId: 'user', type: 'allPosts', intervalLength: 1, intervalUnit: 'days', actionsPerInterval: 1, liftAtAverageKarma: 5, liftAverageKarmaCount: 3 }],
    rejectAll: true, removeFromQueue: true, ...overrides,
  };
}

describe('completeUserModeration', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.assign(mockUser, { needsReview: true, postingDisabled: false, allCommentingDisabled: false, conversationsDisabled: false });
    mockPosts.splice(0, mockPosts.length, ...Array.from({ length: 30 }, (_, index) => ({ _id: `post${index}`, userId: 'user', rejected: false })));
    mockComments.splice(0, mockComments.length, ...Array.from({ length: 25 }, (_, index) => ({ _id: `comment${index}`, userId: 'user', rejected: false })));
    for (const store of [mockMessages, mockConversations, mockRateLimits, mockActions, mockEvents]) store.clear();
    mockIsModerator.mockReturnValue(true);
    mockContext.Users.findOne.mockResolvedValue(mockUser);
    mockContext.Posts.findOne.mockImplementation((id: string) => mockPosts.find(post => post._id === id));
    mockContext.Comments.findOne.mockImplementation((id: string) => mockComments.find(comment => comment._id === id));
    mockContext.Posts.find.mockImplementation(() => ({ fetch: async () => mockPosts.filter(post => !post.rejected) }));
    mockContext.Comments.find.mockImplementation(() => ({ fetch: async () => mockComments.filter(comment => !comment.rejected) }));
    mockContext.Conversations.findOne.mockImplementation((id: string) => mockConversations.get(id));
    mockContext.Messages.findOne.mockImplementation((id: string) => mockMessages.get(id));
    mockContext.UserRateLimits.findOne.mockImplementation((id: string) => mockRateLimits.get(id));
    mockContext.ModeratorActions.findOne.mockImplementation((id: string) => mockActions.get(id));
    mockContext.ModeratorActions.find.mockImplementation(() => ({ fetch: async () => [...mockActions.values()] }));
    mockContext.LWEvents.findOne.mockImplementation((id: string) => mockEvents.get(id));
    mockContext.ModerationTemplates.find.mockReturnValue({ fetch: async () => [{ _id: 'template' }] });
    mockCreateMessage.mockImplementation(storeCreatedDocument.bind(null, mockMessages));
    mockCreateConversation.mockImplementation(storeCreatedDocument.bind(null, mockConversations));
    mockCreateRateLimit.mockImplementation(storeCreatedDocument.bind(null, mockRateLimits));
    mockCreateModeratorAction.mockImplementation(storeCreatedDocument.bind(null, mockActions));
    mockCreateEvent.mockImplementation(storeCreatedDocument.bind(null, mockEvents));
    mockUpdatePost.mockImplementation(rejectContent.bind(null, mockPosts));
    mockUpdateComment.mockImplementation(rejectContent.bind(null, mockComments));
    mockUpdateUser.mockImplementation(({ data }: UpdateUserInput) => Object.assign(mockUser, data));
  });

  it('rejects all eligible pending content, including content beyond the displayed twenty, before removing the user', async () => {
    await completeUserModeration(moderationOptions(), createAnonymousContext());
    expect(mockContext.Posts.find).toHaveBeenCalledWith({ userId: 'user', ...getPendingContentSelector('Posts') });
    expect(mockContext.Comments.find).toHaveBeenCalledWith({ userId: 'user', ...getPendingContentSelector('Comments') });
    expect(mockUpdatePost).toHaveBeenCalledTimes(30);
    expect(mockUpdateComment).toHaveBeenCalledTimes(25);
    expect(mockUser.needsReview).toBe(false);
    expect(mockUpdateUser.mock.invocationCallOrder.at(-1)).toBeGreaterThan(mockAppendNote.mock.invocationCallOrder.at(-1) ?? 0);
    expect(mockUpdateUser.mock.invocationCallOrder.at(-1)).toBeGreaterThan(mockUpdateComment.mock.invocationCallOrder.at(-1) ?? 0);
  });

  it('retries partial completion without duplicating messages, limits, voting restrictions or template events', async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error('User update failed'));
    const options = moderationOptions();
    await expect(completeUserModeration(options, createAnonymousContext())).rejects.toThrow('User update failed');
    expect(mockUser.needsReview).toBe(true);
    await completeUserModeration(options, createAnonymousContext());
    expect(mockCreateMessage).toHaveBeenCalledTimes(1);
    expect(mockCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockCreateRateLimit).toHaveBeenCalledTimes(1);
    expect(mockCreateModeratorAction).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockUpdatePost).toHaveBeenCalledTimes(30);
    expect(mockUpdateComment).toHaveBeenCalledTimes(25);
    expect(mockUser.needsReview).toBe(false);
  });

  it('leaves the user in the queue when a note fails, and permits a retry', async () => {
    mockAppendNote.mockRejectedValueOnce(new Error('Note failed'));
    const options = moderationOptions({ disablePermissions: false });
    await expect(completeUserModeration(options, createAnonymousContext())).rejects.toThrow('Note failed');
    expect(mockUser.needsReview).toBe(true);
    await completeUserModeration(options, createAnonymousContext());
    expect(mockUser.needsReview).toBe(false);
    expect(mockCreateMessage).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid lift conditions before sending, rejecting, or creating a conversation', async () => {
    const options = moderationOptions();
    options.rateLimits[0].liftAverageKarmaCount = 0;
    await expect(completeUserModeration(options, createAnonymousContext())).rejects.toThrow('Karma lift');
    expect(mockCreateMessage).not.toHaveBeenCalled();
    expect(mockCreateConversation).not.toHaveBeenCalled();
    expect(mockUpdatePost).not.toHaveBeenCalled();
  });

  it('validates ownership before creating a conversation', async () => {
    mockPosts[0].userId = 'otherUser';
    await expect(completeUserModeration(moderationOptions(), createAnonymousContext())).rejects.toThrow('must belong');
    expect(mockCreateConversation).not.toHaveBeenCalled();
    expect(mockCreateMessage).not.toHaveBeenCalled();
  });

  it('authorizes every retry before looking up the user or writing', async () => {
    mockIsModerator.mockReturnValue(false);
    await expect(completeUserModeration(moderationOptions(), createAnonymousContext())).rejects.toThrow('Only moderators');
    expect(mockContext.Users.findOne).not.toHaveBeenCalled();
    expect(mockCreateMessage).not.toHaveBeenCalled();
  });
});
