import schema from './schema';
import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';

export const LcOrders = createCollection({
  collectionName: 'LcOrders',
  typeName: 'LcOrder',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: LcOrders});

ensureIndex(LcOrders, {
  userId: 1
}, {unique: true})

export default LcOrders;
