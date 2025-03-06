import schema from '@/lib/collections/petrovDayLaunchs/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { addUniversalFields } from '@/lib/collectionUtils'

export const PetrovDayLaunchs: PetrovDayLaunchsCollection = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  schema
});

addUniversalFields({collection: PetrovDayLaunchs})

export default PetrovDayLaunchs;
