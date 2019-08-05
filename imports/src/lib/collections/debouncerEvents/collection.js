import schema from './schema.js';
import { createCollection } from 'vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { ensureIndex } from '../../collectionUtils';

export const DebouncerEvents = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  schema,
});

addUniversalFields({collection: DebouncerEvents})

ensureIndex(DebouncerEvents, { dispatched:1, af:1, delayTime:1 });
ensureIndex(DebouncerEvents, { dispatched:1, af:1, upperBoundTime:1 });
ensureIndex(DebouncerEvents, { dispatched:1, eventName:1, af:1, key:1 });

export default DebouncerEvents;
