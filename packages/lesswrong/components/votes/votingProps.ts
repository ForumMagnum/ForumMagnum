export type VoteCallback<T extends VoteableTypeClient> = (props: {
  document: T,
  voteType: string | null,
  extendedVote?: AnyBecauseHard,
  currentUser: UsersCurrent,
}) => Promise<void>;

export interface VotingProps<T extends VoteableTypeClient> {
  vote: VoteCallback<T>;
  collectionName: VoteableCollectionName;
  document: T;
  baseScore: number;
  voteCount: number;
}
