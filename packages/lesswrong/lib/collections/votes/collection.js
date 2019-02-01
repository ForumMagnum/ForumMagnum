import { createCollection } from 'meteor/vulcan:core';
import schema from './schema.js';
export const Votes = createCollection({
  collectionName: 'Votes',
  typeName: 'Vote',
  schema,
});
export default Votes;
