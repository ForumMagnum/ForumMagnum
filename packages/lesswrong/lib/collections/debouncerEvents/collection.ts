import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '../../collectionUtils';
import { ensureCustomPgIndex, ensureIndex } from '../../collectionIndexUtils'

export const DebouncerEvents: DebouncerEventsCollection = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  schema,
});

addUniversalFields({collection: DebouncerEvents})

ensureIndex(DebouncerEvents, { dispatched:1, af:1, delayTime:1 });
ensureIndex(DebouncerEvents, { dispatched:1, af:1, upperBoundTime:1 });

void ensureCustomPgIndex(`
  CREATE UNIQUE INDEX IF NOT EXISTS "idx_DebouncerEvents_dispatched_af_key_name_filtered"
  ON public."DebouncerEvents" USING btree
  (dispatched, af, key, name)
  WHERE (dispatched IS FALSE)
`);

export default DebouncerEvents;
