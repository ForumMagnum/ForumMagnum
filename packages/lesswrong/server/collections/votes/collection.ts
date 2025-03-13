import { createCollection } from '@/lib/vulcan-lib/collections';
import schema from '@/lib/collections/votes/schema';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

export default Votes;
