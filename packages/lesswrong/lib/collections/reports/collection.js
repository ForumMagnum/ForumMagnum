import schema from './schema.js';
import './permissions.js'
import { createCollection, getDefaultResolvers, getDefaultMutations} from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

const Reports = createCollection({
  collectionName: 'Reports',
  typeName: 'Report',
  schema,
  resolvers: getDefaultResolvers('Reports'),
  mutations: getDefaultMutations('Reports'),
});

addUniversalFields({collection: Reports})

export default Reports;