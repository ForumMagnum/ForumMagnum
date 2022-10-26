import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

addUniversalFields({collection: Votes})

export default Votes;
