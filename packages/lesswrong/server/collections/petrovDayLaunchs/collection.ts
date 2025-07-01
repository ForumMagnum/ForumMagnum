import schema from '@/lib/collections/petrovDayLaunchs/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const PetrovDayLaunchs = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  schema,
  // schema
});


export default PetrovDayLaunchs;
