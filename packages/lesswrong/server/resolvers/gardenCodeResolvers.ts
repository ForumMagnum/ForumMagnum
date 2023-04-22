import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { augmentFieldsDict } from '../utils/serverSchemaUtils';
import { getUnusedSlugByCollectionName } from '../utils/slugUtils';
import { slugify } from '../../lib/vulcan-lib/utils';

augmentFieldsDict(GardenCodes, {
  slug: {
    onInsert: async (gardenCode) => {
      return await getUnusedSlugByCollectionName("GardenCodes", slugify(gardenCode.title))
    },
  },
});
