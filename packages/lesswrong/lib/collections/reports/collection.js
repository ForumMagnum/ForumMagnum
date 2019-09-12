import schema from './schema.js';
import Users from 'meteor/vulcan:users';
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

const membersActions = [
  'reports.new',
  'reports.view.own',
];
Users.groups.members.can(membersActions);

const sunshineRegimentActions = [
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
];
Users.groups.sunshineRegiment.can(sunshineRegimentActions);

Reports.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reports.view.own') : Users.canDo(user, `reports.view.all`)
  )
};

export default Reports;
