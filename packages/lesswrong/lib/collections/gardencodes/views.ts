import { GardenCodes } from './collection';
import { ensureIndex } from '../../collectionUtils';
import moment from 'moment';

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
  const twoHoursAgo = moment().subtract(2, 'hours').toISOString()
  return {
    selector: { 
      startDate: {$gt: twoHoursAgo}
    }
  }
})

ensureIndex(GardenCodes, {code: 1, deleted: 1, userId: 1, });

