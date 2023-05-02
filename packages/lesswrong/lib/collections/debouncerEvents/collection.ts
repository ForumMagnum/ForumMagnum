import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const DebouncerEvents: DebouncerEventsCollection = createCollection({
  collectionName: 'DebouncerEvents',
  typeName: 'DebouncerEvents',
  collectionType: forumTypeSetting.get() === "EAForum" ? "pg" : "switching",
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
