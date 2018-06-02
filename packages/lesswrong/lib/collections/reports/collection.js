import schema from './schema.js';
import './permissions.js'
import { createCollection, getDefaultResolvers, getDefaultMutations} from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

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

Reports.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reports.view.own') : Users.canDo(user, `reports.view.all`)
  )
};

export default Reports;
