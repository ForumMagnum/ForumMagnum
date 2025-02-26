import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from '../../collectionUtils';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DebouncerEvents: DebouncerEventsCollection = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('DebouncerEvents', { dispatched:1, af:1, delayTime:1 });
    indexSet.addIndex('DebouncerEvents', { dispatched:1, af:1, upperBoundTime:1 });
    indexSet.addCustomPgIndex(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_DebouncerEvents_dispatched_af_key_name_filtered"
      ON public."DebouncerEvents" USING btree
      (dispatched, af, key, name)
      WHERE (dispatched IS FALSE)
    `);
    return indexSet;
  },
});

addUniversalFields({collection: DebouncerEvents})

export default DebouncerEvents;
