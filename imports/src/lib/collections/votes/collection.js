import { createCollection } from 'vulcan:core';
import schema from './schema.js';
import SimpleSchema from 'simpl-schema';
import { addUniversalFields } from '../../collectionUtils'

SimpleSchema.extendOptions([ 'foreignKey' ]);

export const Votes = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
});

addUniversalFields({collection: Votes})

export default Votes;