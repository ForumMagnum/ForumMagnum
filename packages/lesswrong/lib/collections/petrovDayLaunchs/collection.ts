import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'

export const PetrovDayLaunchs: PetrovDayLaunchsCollection = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  schema
});

addUniversalFields({collection: PetrovDayLaunchs})

export default PetrovDayLaunchs;
