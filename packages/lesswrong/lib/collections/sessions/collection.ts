import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { ensureIndex } from '../../collectionIndexUtils';
import { forumTypeSetting } from '../../instanceSettings';

export const Sessions: SessionsCollection = createCollection({
  collectionName: 'Sessions',
  dbCollectionName: 'sessions',
  typeName: 'Session',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'switching' : 'mongo',
  schema,
  logChanges: false,
});

ensureIndex(Sessions, {expires: 1});

export default Sessions;
