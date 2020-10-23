import { GardenCodes } from './collection';
import { ensureIndex } from '../../collectionUtils';

GardenCodes.addView('allGardenCodes', terms => {
  return {
    selector: {
      deleted: false,
    },
    options: {
      sort: {startTime: 1},
    },
  };
});

GardenCodes.addView('gardenCodeBySlug', terms => {
  return {
    selector: {
      slug: terms.slug
    },
  };
});

ensureIndex(GardenCodes, {deleted:1});
