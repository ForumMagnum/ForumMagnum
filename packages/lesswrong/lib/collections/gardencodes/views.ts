import { eventTypes, GardenCodes } from './collection';
import { ensureIndex } from '../../collectionUtils';

declare global {
  interface GardenCodesViewTerms extends ViewTermsBase {
    view?: GardenCodesViewName //Allow useMulti with no view
    types?: Array<string>
    userId?: string
    code?: string
  }
}


GardenCodes.addDefaultView((terms: GardenCodesViewTerms) => {
  let selector: any
  if (terms?.types) {
    const eventTypeStrings = eventTypes.map(type=>type.value)
    const types = terms.types?.filter(type => eventTypeStrings.includes(type))
    if (!types?.length) {
      throw Error("You didn't provide a valid type")
    }
    selector = {
      type: {$in: types},
      deleted: false
    }
  } else if (terms?.userId) {
    selector = {
      userId: terms.userId,
      deleted: false
    }
  } else if (!terms?.code) {
    selector = {
      keyDoesNotExist: "valueDoesNotExist"
    }
  }
  return {
    selector: selector || {
      code: terms.code,
      deleted: false
    },
    options: {
      sort: { 
        startTime: 1
      }
    }
  }
})

ensureIndex(GardenCodes, {code:1, deleted: 1});
ensureIndex(GardenCodes, {userId:1, deleted: 1});

GardenCodes.addView("usersPrivateGardenCodes", function (terms) {
  const twoHoursAgo = new Date(new Date().getTime()-(2*60*60*1000));
  return {
    selector: {
      // userId: terms.userId,
      type: 'private',
      $or: [{startTime: {$gt: twoHoursAgo }}, {endTime: {$gt: new Date()}}]
    }
  }
})

ensureIndex(GardenCodes, {code: 1, deleted: 1, userId: 1, });

GardenCodes.addView("semipublicGardenCodes", function (terms: GardenCodesViewTerms) {
  const twoHoursAgo = new Date(new Date().getTime()-(2*60*60*1000));
  return {
    selector: { 
      $or: [{startTime: {$gt: twoHoursAgo }}, {endTime: {$gt: new Date()}}]
    }
  }
})

ensureIndex(GardenCodes, {code: 1, deleted: 1, userId: 1, });

GardenCodes.addView("gardenCodeByCode", (terms: GardenCodesViewTerms) => ({}));
