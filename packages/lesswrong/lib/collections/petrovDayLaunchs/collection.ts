import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';

export const PetrovDayLaunchs: PetrovDayLaunchsCollection = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  schema
});

export default PetrovDayLaunchs;
