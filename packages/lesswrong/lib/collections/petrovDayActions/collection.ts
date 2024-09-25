import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'

export const PetrovDayActions: PetrovDayActionsCollection = createCollection({
  collectionName: 'PetrovDayActions',
  typeName: 'PetrovDayAction',
  schema
});

addUniversalFields({collection: PetrovDayActions})

export default PetrovDayActions;
