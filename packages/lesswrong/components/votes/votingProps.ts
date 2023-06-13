
export interface VotingProps<T extends VoteableTypeClient> {
  vote: (props: { document: T; voteType: string | null; extendedVote?: any; currentUser: UsersCurrent; }) => void;
  collectionName: VoteableCollectionName;
  document: T;
  baseScore: number;
  voteCount: number;
}
