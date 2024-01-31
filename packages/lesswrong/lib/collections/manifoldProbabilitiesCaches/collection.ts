import schema from './schema';
import { createCollection } from "../../vulcan-lib";
import { addUniversalFields } from '../../collectionUtils';
import { ensureCustomPgIndex } from '../../collectionIndexUtils';

export const ManifoldProbabilitiesCaches = createCollection({
  collectionName: 'ManifoldProbabilitiesCaches',
  typeName: 'ManifoldProbabilitiesCache',
  schema,
  logChanges: false,
  writeAheadLogged: false,
});

addUniversalFields({collection: ManifoldProbabilitiesCaches});

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_ManifoldProbabilitiesCaches_manifoldId"
  ON public."ManifoldProbabilitiesCaches" USING btree
  ("marketId")
`);

export default ManifoldProbabilitiesCaches;
