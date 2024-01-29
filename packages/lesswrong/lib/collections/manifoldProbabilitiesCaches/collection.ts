import schema from './schema';
import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from '../../collectionUtils';

export const ManifoldProbabilitiesCaches = createCollection({
  collectionName: 'ManifoldProbabilitiesCaches',
  typeName: 'ManifoldProbabilitiesCache',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: ManifoldProbabilitiesCaches});

export default ManifoldProbabilitiesCaches;
