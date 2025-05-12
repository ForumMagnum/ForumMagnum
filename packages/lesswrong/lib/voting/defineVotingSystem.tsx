import type { VotingSystem } from './votingSystems';

// This is in its own file to avoid a breaking dependency cycle.
export const defineVotingSystem = <V, S>(votingSystem: VotingSystem<V, S>) => {
  return votingSystem;
};
