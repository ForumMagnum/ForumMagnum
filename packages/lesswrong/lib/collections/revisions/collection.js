import schema from './schema.js';
import { createCollection, getDefaultResolvers /*, getDefaultMutations */} from 'meteor/vulcan:core';

/**
 * @summary Telescope Messages namespace
 * @namespace Reports
 */

const Revisions = createCollection({

  collectionName: 'Revisions',

  typeName: 'Revision',

  schema,

  resolvers: getDefaultResolvers('Revisions'),

  // mutations: getDefaultMutations('Revisions'),

});

export default Revisions;
