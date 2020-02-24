import { createCollection } from '../../vulcan-lib';
import schema from './schema';
import { addUniversalFields } from '../../collectionUtils'

export const Votes: VotesCollection = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
});

addUniversalFields({collection: Votes})

export default Votes;
