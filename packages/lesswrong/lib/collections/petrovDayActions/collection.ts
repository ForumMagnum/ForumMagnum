import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbPetrovDayAction> = {
  newCheck: (user: DbUser|null) => {
    return true
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
  schema
});

addUniversalFields({collection: PetrovDayActions})

export default PetrovDayActions;
