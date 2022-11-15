import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  collectionType: 'mongo',
  schema,
  resolvers: getDefaultResolvers('Votes'),
});

addUniversalFields({collection: Votes})

export default Votes;
