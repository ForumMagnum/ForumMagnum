import schema from './schema';
import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';

export const LcMarkets = createCollection({
  collectionName: 'LcMarkets',
  typeName: 'LcMarket',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: LcMarkets});

ensureIndex(LcMarkets, {
    userId: 1
  }, {unique: true})

export default LcMarkets;