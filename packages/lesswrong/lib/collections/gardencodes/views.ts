import { GardenCodes } from './collection';
import { ensureIndex } from '../../collectionUtils';

GardenCodes.addDefaultView(terms => {
  if (terms?.userId) return {
    selector: {
      userId: terms.userId,
      deleted: false
    }
  }
  if (!terms?.code) return {
    selector: {
      keyDoesNotExist: "valueDoesNotExist"
    }
  }
  return {
    selector: {
      code: terms.code,
      deleted: false
    }
  }
})

ensureIndex(GardenCodes, {code:1, deleted: 1});
ensureIndex(GardenCodes, {userId:1, deleted: 1});

GardenCodes.addView("userGardenCodes", function (terms) {
  const twoHoursAgo = new Date(new Date().getTime()-(2*60*60*1000));
  return {
    selector: { 
      startTime: {$gt: twoHoursAgo }
    }
  }
})

ensureIndex(GardenCodes, {code: 1, deleted: 1, userId: 1, });

