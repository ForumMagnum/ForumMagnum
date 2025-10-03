import type { VotingSystem } from './votingSystemTypes';

// This is in its own file to avoid a breaking dependency cycle.
export const defineVotingSystem = <V, S>(votingSystem: VotingSystem<V, S>) => {
  return votingSystem;
};
