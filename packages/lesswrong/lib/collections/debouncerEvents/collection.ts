import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'

export const DebouncerEvents: DebouncerEventsCollection = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  collectionType: 'pg',
  schema,
});

addUniversalFields({collection: DebouncerEvents})

ensureIndex(DebouncerEvents, { dispatched:1, af:1, delayTime:1 });
ensureIndex(DebouncerEvents, { dispatched:1, af:1, upperBoundTime:1 });

ensureIndex(
  DebouncerEvents,
  { dispatched: 1, af: 1, key: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dispatched: false,
    },
  },
);

export default DebouncerEvents;
