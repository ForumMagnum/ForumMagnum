import { getVotingSystemByName } from '@/lib/voting/getVotingSystem';

const validate = (votingSystemName: string, extendedVote: unknown) =>
  getVotingSystemByName(votingSystemName).validateExtendedVote(extendedVote);

describe('validateExtendedVote', () => {
  it.each([
    ['twoAxis', { agreement: 'bogus' }],
    ['twoAxis', { agreement: 1 }],
    ['twoAxis', 'smallUpvote'],
    ['namesAttachedReactions', { agreement: 'bogus' }],
    ['namesAttachedReactions', { reacts: { react: 'agree', vote: 'created' } }],
    ['namesAttachedReactions', { reacts: [{ react: 'agree', vote: 'created', quotes: 5 }] }],
    ['namesAttachedReactions', { reacts: [{ react: 'agree', vote: 'bogus' }] }],
    ['namesAttachedReactions', { reacts: [{ react: 'notAReaction', vote: 'created' }] }],
    ['namesAttachedReactions', { reacts: [{ react: 'constructor', vote: 'created' }] }],
    ['reactionsAndLikes', { reacts: [{ react: 'notAReaction', vote: 'created' }] }],
    ['reactionsAndLikes', { reacts: [{ react: 'agree', vote: 'created', quotes: 'quote' }] }],
    ['reactsBallot', { truth: 'bogus' }],
    ['reactsBallot', { skepticism: 'yes' }],
  ])('%s rejects %j', (votingSystemName, extendedVote) => {
    expect(() => validate(votingSystemName, extendedVote)).toThrow('Invalid vote');
  });

  it.each([
    ['twoAxis', { agreement: 'smallUpvote' }],
    ['namesAttachedReactions', { agreement: 'neutral', reacts: [{ react: 'agree', vote: 'created', quotes: ['first', 'second'] }] }],
    ['namesAttachedReactions', { reacts: [] }],
    ['reactionsAndLikes', { reacts: [{ react: 'agree', vote: 'disagreed' }] }],
    ['reactsBallot', { truth: 'bigUpvote', skepticism: true }],
  ])('%s accepts %j', (votingSystemName, extendedVote) => {
    expect(validate(votingSystemName, extendedVote)).toEqual(extendedVote);
  });

  it('removes fields the voting system does not use', () => {
    expect(validate('twoAxis', { agreement: 'smallUpvote', reacts: 'left over', smile: true })).toEqual({ agreement: 'smallUpvote' });
    expect(validate('default', { agreement: 'bogus' })).toBeNull();
  });

  it.each(['default', 'twoAxis', 'namesAttachedReactions', 'reactionsAndLikes', 'reactsBallot'])('%s treats a missing extended vote as none', (votingSystemName) => {
    expect(validate(votingSystemName, null)).toBeNull();
    expect(validate(votingSystemName, undefined)).toBeNull();
  });
});
