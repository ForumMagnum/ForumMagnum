import schema from './schema';
import { createCollection } from "../../vulcan-lib/collections";
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils';

export const ManifoldProbabilitiesCaches = createCollection({
  collectionName: 'ManifoldProbabilitiesCaches',
  typeName: 'ManifoldProbabilitiesCache',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: ManifoldProbabilitiesCaches});

ensureIndex(ManifoldProbabilitiesCaches, {
  marketId: 1
}, {unique: true})

export default ManifoldProbabilitiesCaches;
