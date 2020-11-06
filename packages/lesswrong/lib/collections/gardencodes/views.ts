import { GardenCodes } from './collection';
import { ensureIndex } from '../../collectionUtils';

GardenCodes.addDefaultView(terms => {
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
