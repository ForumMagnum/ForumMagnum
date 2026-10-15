jest.mock('@/server/users/sunshineNotes', () => ({ appendToSunshineNotes: jest.fn() }));
jest.mock('@/server/utils/backgroundTask', () => ({ backgroundTask: jest.fn() }));
jest.mock('@/server/vulcan-lib/createContexts', () => ({ createAnonymousContext: () => mockContext }));

import { validateUserRateLimit } from '@/lib/collections/userRateLimits/helpers';
import { getManualRateLimitInfo, getStrictestRateLimitInfo } from '@/lib/rateLimits/utils';
import { rateLimitDateWhenUserNextAbleToPost } from '@/server/rateLimitUtils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { DEFAULT_REJECTION_RATE_LIMIT_SETTINGS, getRateLimitsToCreate } from '@/components/sunshineDashboard/supermod/RejectionRateLimitForm';

function manualLimit(overrides: Partial<DbUserRateLimit> = {}): DbUserRateLimit {
  return {
    _id: 'limit', schemaVersion: 1, legacyData: null, createdAt: new Date(), userId: 'user',
    type: 'allPosts', actionsPerInterval: 0, intervalLength: 1, intervalUnit: 'days',
    endedAt: null, liftAtAverageKarma: null, liftAverageKarmaCount: null, ...overrides,
  };
}

const mockContext = {
  currentUser: { _id: 'user', karma: 100, groups: [], isAdmin: false, voteReceivedCount: 0, smallDownvoteReceivedCount: 0, smallUpvoteReceivedCount: 0, bigDownvoteReceivedCount: 0, bigUpvoteReceivedCount: 0 },
  forumType: 'LessWrong',
  ModeratorActions: { findOne: jest.fn() },
  UserRateLimits: { find: jest.fn(), rawUpdateMany: jest.fn() },
  Posts: { find: jest.fn() },
  repos: { votes: { getVotesOnRecentContent: jest.fn() } },
};

describe('manual rate-limit validation and enforcement', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockContext.ModeratorActions.findOne.mockResolvedValue(null);
    mockContext.UserRateLimits.find.mockReturnValue({ fetch: async () => [manualLimit()] });
    mockContext.Posts.find.mockReturnValue({ fetch: async () => [] });
    mockContext.repos.votes.getVotesOnRecentContent.mockResolvedValue([]);
  });

  it.each([
    { actionsPerInterval: 0.1 },
    { actionsPerInterval: -1 },
    { actionsPerInterval: null },
    { intervalLength: null },
    { intervalLength: 0 },
    { liftAtAverageKarma: 2 },
    { liftAverageKarmaCount: 2 },
    { liftAtAverageKarma: 2, liftAverageKarmaCount: 0 },
    { liftAtAverageKarma: 2, liftAverageKarmaCount: 0.1 },
    { liftAtAverageKarma: NaN, liftAverageKarmaCount: 3 },
    { endedAt: new Date('invalid') },
    { actionsPerInterval: 1 },
  ])('rejects invalid or missing end conditions: %j', invalid => {
    expect(() => validateUserRateLimit({ ...manualLimit(), ...invalid })).toThrow();
  });

  it('accepts a timed limit, paired karma lift, and explicit zero-action block', () => {
    expect(() => validateUserRateLimit(manualLimit({ actionsPerInterval: 2, endedAt: new Date(Date.now() + 10000) }))).not.toThrow();
    expect(() => validateUserRateLimit(manualLimit({ actionsPerInterval: 2, liftAtAverageKarma: 0, liftAverageKarmaCount: 3 }))).not.toThrow();
    expect(() => validateUserRateLimit(manualLimit())).not.toThrow();
  });

  it.each(['', ' ', '0', '0.1', '-1', 'nope'])('does not silently turn lift count %j into an indefinite UI restriction', liftCount => {
    const settings = { ...DEFAULT_REJECTION_RATE_LIMIT_SETTINGS, posts: { ...DEFAULT_REJECTION_RATE_LIMIT_SETTINGS.posts, liftCount } };
    expect(() => getRateLimitsToCreate(settings, 'user')).toThrow();
  });

  it('permits a blank rate count to omit that content type, but preserves exact valid lift values', () => {
    const settings = { ...DEFAULT_REJECTION_RATE_LIMIT_SETTINGS, posts: { ...DEFAULT_REJECTION_RATE_LIMIT_SETTINGS.posts, count: '' } };
    expect(getRateLimitsToCreate(settings, 'user')).toEqual([
      expect.objectContaining({ type: 'allComments', actionsPerInterval: 2, liftAtAverageKarma: 2, liftAverageKarmaCount: 10 }),
    ]);
  });

  it('keeps an indefinite zero-action block stricter than every timed limit', () => {
    const indefinite = getManualRateLimitInfo(manualLimit(), []);
    expect(indefinite?.nextEligible).toBeNull();
    expect(getStrictestRateLimitInfo([
      { nextEligible: new Date('2099-01-01'), rateLimitMessage: 'Timed' }, indefinite,
    ])).toBe(indefinite);
  });

  it('enforces an indefinite zero-action restriction even without previous posts', async () => {
    const context = createAnonymousContext();
    if (!context.currentUser) throw new Error('Test user is missing');
    expect(await rateLimitDateWhenUserNextAbleToPost(context.currentUser, context)).toMatchObject({ nextEligible: null, rateLimitType: 'moderator' });
  });

  it('lifts that restriction when the full recent-content karma condition is met', async () => {
    mockContext.UserRateLimits.find.mockReturnValue({ fetch: async () => [manualLimit({ liftAtAverageKarma: 5, liftAverageKarmaCount: 3 })] });
    mockContext.Posts.find.mockImplementation((_selector: unknown, options: { limit?: number }) => ({
      fetch: async () => options.limit ? [{ baseScore: 4 }, { baseScore: 5 }, { baseScore: 6 }] : [],
    }));
    const context = createAnonymousContext();
    if (!context.currentUser) throw new Error('Test user is missing');
    expect(await rateLimitDateWhenUserNextAbleToPost(context.currentUser, context)).toBeNull();
    expect(mockContext.UserRateLimits.rawUpdateMany).toHaveBeenCalledWith({ _id: { $in: ['limit'] } }, { $set: { endedAt: expect.any(Date) } });
  });
});
