import { createCollection } from '@/lib/vulcan-lib/collections';

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
});

export default Votes;
