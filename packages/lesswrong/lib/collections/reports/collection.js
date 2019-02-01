import schema from './schema.js';
import './permissions.js'
import { createCollection, getDefaultResolvers, getDefaultMutations} from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

/**
 * @summary Telescope Messages namespace
 * @namespace Reports
 */

const Reports = createCollection({

  collectionName: 'Reports',

  typeName: 'Report',

  schema,

  resolvers: getDefaultResolvers('Reports'),

  mutations: getDefaultMutations('Reports'),

});

export default Reports;

addUniversalFields({collection: Reports})