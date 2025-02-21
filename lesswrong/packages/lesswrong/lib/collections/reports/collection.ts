import schema from './schema';
import { userCanDo, membersGroup } from '../../vulcan-users/permissions';
import { sunshineRegimentGroup } from '../../permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";

const Reports: ReportsCollection = createCollection({
  collectionName: 'Reports',
  typeName: 'Report',
  schema,
  resolvers: getDefaultResolvers('Reports'),
  mutations: getDefaultMutations('Reports'),
  logChanges: true,
});

addUniversalFields({
  collection: Reports,
  createdAtOptions: {
    canRead: ['guests'],
    canUpdate: ['admins'],
  },
});

const membersActions = [
  'reports.new',
  'reports.view.own',
];
membersGroup.can(membersActions);

const sunshineRegimentActions = [
  'reports.new',
  'reports.edit.all',
  'reports.remove.all',
  'reports.view.all',
];
sunshineRegimentGroup.can(sunshineRegimentActions);

Reports.checkAccess = async (user: DbUser|null, document: DbReport, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? userCanDo(user, 'reports.view.own') : userCanDo(user, `reports.view.all`)
  )
};

export default Reports;
