import { createCollection } from '@/lib/vulcan-lib/collections';
import schema from '@/lib/collections/votes/schema';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

export default Votes;
