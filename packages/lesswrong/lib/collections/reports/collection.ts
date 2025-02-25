import schema from './schema';
import { userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

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

Reports.checkAccess = async (user: DbUser|null, document: DbReport, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (
    document.userId === user._id ? userCanDo(user, 'reports.view.own') : userCanDo(user, `reports.view.all`)
  )
};

export default Reports;
