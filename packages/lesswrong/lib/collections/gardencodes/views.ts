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

GardenCodes.addView('gardenCodeByCode', terms => {
  return {
    selector: {
      code: terms.code
    },
  };
});

ensureIndex(GardenCodes, {deleted:1});
