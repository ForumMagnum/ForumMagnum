import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from '../../collectionUtils'

export const PetrovDayActions: PetrovDayActionsCollection = createCollection({
  collectionName: 'PetrovDayActions',
  typeName: 'PetrovDayAction',
  resolvers: getDefaultResolvers('PetrovDayActions'),
  mutations: getDefaultMutations('PetrovDayActions'),
  schema
});

addUniversalFields({collection: PetrovDayActions})

export default PetrovDayActions;
