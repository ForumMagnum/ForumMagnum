import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { recalculateScore, timeDecayExpr } from '@/lib/scoring';
import { isVoteWithReactsAllowed, type NamesAttachedReactionsScore, type UserVoteOnSingleReaction } from '@/lib/voting/namesAttachedReactions';

const document: DbVoteableType = {
  _id: 'comment',
  userId: 'author',
  schemaVersion: 1,
  score: 0,
  baseScore: 0,
  voteCount: 0,
};

function checkReaction(karma: number, reaction: UserVoteOnSingleReaction, existing: boolean) {
  const user = createAdminContext().currentUser;
  if (!user) throw new Error('Expected a context user');
  user._id = 'voter';
  user.isAdmin = false;
  user.karma = karma;
  const oldExtendedScore: NamesAttachedReactionsScore = {
    approvalVoteCount: 0,
    agreement: 0,
    agreementVoteCount: 0,
    reacts: existing ? { insightful: [] } : {},
  };
  return isVoteWithReactsAllowed({ user, document, oldExtendedScore, extendedVote: { reacts: [reaction] } });
}

describe('shared voting constants', () => {
  it('preserves the shared decay exponent in calculated scores and query expressions', () => {
    const now = new Date('2026-01-02T00:00:00Z');
    jest.useFakeTimers('modern');
    jest.setSystemTime(now);
    try {
      const post = { ...document, baseScore: 100, postedAt: new Date('2026-01-01T00:00:00Z') };
      expect(recalculateScore(post)).toBeCloseTo(100 / Math.pow(26, 1.15), 6);
      expect(timeDecayExpr('LessWrong').$pow[1]).toBe(1.15);
      expect(timeDecayExpr('AlignmentForum').$pow[1]).toBe(1.15);
    } finally {
      jest.useRealTimers();
    }
  });

  it('requires 5 karma to join an existing reaction', () => {
    expect(checkReaction(4, { react: 'insightful', vote: 'seconded' }, true)).toEqual({
      allowed: false, reason: 'You need at least 5 karma to use reacts',
    });
    expect(checkReaction(5, { react: 'insightful', vote: 'seconded' }, true)).toEqual({ allowed: true });
  });

  it('requires 10 karma to introduce a reaction', () => {
    expect(checkReaction(9, { react: 'insightful', vote: 'created' }, false)).toEqual({
      allowed: false, reason: 'You need at least 10 karma to be the first to use a new react on a given comment',
    });
    expect(checkReaction(10, { react: 'insightful', vote: 'created' }, false)).toEqual({ allowed: true });
  });

  it('requires 20 karma to antireact', () => {
    expect(checkReaction(19, { react: 'insightful', vote: 'disagreed' }, true)).toEqual({
      allowed: false, reason: 'You need at least 20 karma to antireact',
    });
    expect(checkReaction(20, { react: 'insightful', vote: 'disagreed' }, true)).toEqual({ allowed: true });
  });
});
