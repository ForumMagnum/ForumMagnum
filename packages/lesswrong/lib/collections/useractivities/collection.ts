import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';
import { ensureIndex } from '../../collectionIndexUtils';

export const UserActivities: UserActivitiesCollection = createCollection({
  collectionName: 'UserActivities',
  typeName: 'UserActivity',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  logChanges: true,
});

addUniversalFields({collection: UserActivities})
ensureIndex(UserActivities, { visitorId: 1, type: 1 })

export default UserActivities;
