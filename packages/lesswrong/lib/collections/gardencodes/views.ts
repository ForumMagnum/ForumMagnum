import { eventTypes } from "./constants";
import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface GardenCodesViewTerms extends ViewTermsBase {
    view?: GardenCodesViewName //Allow useMulti with no view
    types?: Array<string>
    userId?: string
    code?: string
  }
}

function defaultView(terms: GardenCodesViewTerms) {
  let selector: any = {
    deleted: false,
  };
  
  if (terms?.types) {
    const eventTypeStrings = eventTypes.map(type=>type.value)
    const types = terms.types?.filter(type => eventTypeStrings.includes(type))
    if (!types?.length) {
      throw Error("You didn't provide a valid type")
    }
    selector = {
      ...selector,
      type: {$in: types},
    }
  }
  if (terms?.userId) {
    selector = {
      ...selector,
      userId: terms.userId,
    }
  }
  if (terms?.code) {
    selector = {
      ...selector,
      code: terms.code,
    }
  } else {
    selector = {
      ...selector,
      hidden: false,
    }
  }
  
  return {
    selector,
    options: {
      sort: {
        startTime: 1
      }
    }
  }
}

function usersPrivateGardenCodes(terms: GardenCodesViewTerms) {
  const twoHoursAgo = new Date(new Date().getTime()-(2*60*60*1000));
  return {
    selector: {
      type: 'private',
      $or: [{startTime: {$gt: twoHoursAgo }}, {endTime: {$gt: new Date()}}]
    }
  }
}

function publicGardenCodes(terms: GardenCodesViewTerms) {
  const twoHoursAgo = new Date(new Date().getTime()-(2*60*60*1000));
  return {
    selector: { 
      type: 'public',
      $or: [{startTime: {$gt: twoHoursAgo }}, {endTime: {$gt: new Date()}}]
    }
  }
}

function gardenCodeByCode(terms: GardenCodesViewTerms) {
  return {}
}

export const GardenCodesViews = new CollectionViewSet('GardenCodes', {
  usersPrivateGardenCodes,
  publicGardenCodes,
  gardenCodeByCode
}, defaultView);
