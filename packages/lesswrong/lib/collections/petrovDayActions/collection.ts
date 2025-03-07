import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbPetrovDayAction> = {
  newCheck: async (user: DbUser|null, document: DbPetrovDayAction|null) => {
    if (!user || !document) return false
    
    const userRoleInfo = await PetrovDayActions.findOne({userId: user?._id, actionType: "hasRole"})
    const userRole = userRoleInfo?.data?.role

    if (userRole === "westGeneral" && document?.actionType === "nukeTheEast") {
      return true
    }
    if (userRole === "eastGeneral" && document?.actionType === "nukeTheWest") {
      return true
    }
    if (userRole === "eastPetrov" && document?.actionType === "eastPetrovAllClear") {
      return true
    }
    if (userRole === "eastPetrov" && document?.actionType === "eastPetrovNukesIncoming") {
      return true
    }
    if (userRole === "westPetrov" && document?.actionType === "westPetrovAllClear") {
      return true
    }
    if (userRole === "westPetrov" && document?.actionType === "westPetrovNukesIncoming") {
      return true
    }
    
    return false
  },

  editCheck: async (user: DbUser|null, document: DbPetrovDayAction|null) => {
    return false
  },

  removeCheck: (user: DbUser|null, document: DbPetrovDayAction|null) => {
    return false
  },
}


export const PetrovDayActions: PetrovDayActionsCollection = createCollection({
  collectionName: 'PetrovDayActions',
  typeName: 'PetrovDayAction',
  resolvers: getDefaultResolvers('PetrovDayActions'),
  mutations: getDefaultMutations('PetrovDayActions', options),
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PetrovDayActions', { userId: 1, actionType: 1 });
    return indexSet;
  },
});

export default PetrovDayActions;
