import { createCollection } from 'meteor/vulcan:core';
import schema from './schema';
import { addUniversalFields } from '../../collectionUtils'

export const Votes = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
});

addUniversalFields({collection: Votes})

export default Votes;
