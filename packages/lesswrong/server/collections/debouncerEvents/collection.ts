import schema from '@/lib/collections/debouncerEvents/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const DebouncerEvents = createCollection({
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


export default DebouncerEvents;
