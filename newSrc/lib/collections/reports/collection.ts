import schema from './schema';
import Users from '../users/collection';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const Reports: ReportsCollection = createCollection({
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

Reports.checkAccess = async (user: DbUser|null, document: DbReport, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? Users.canDo(user, 'reports.view.own') : Users.canDo(user, `reports.view.all`)
  )
};

export default Reports;
