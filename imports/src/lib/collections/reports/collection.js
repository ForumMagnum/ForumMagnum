import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations} from 'vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

const Reports = createCollection({
  collectionName: 'Reports',
  typeName: 'Report',
  schema,
  resolvers: getDefaultResolvers('Reports'),
  mutations: getDefaultMutations('Reports'),
});

Reports.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reports.view.own') : Users.canDo(user, `reports.view.all`)
  )
};

addUniversalFields({collection: Reports})

export default Reports;