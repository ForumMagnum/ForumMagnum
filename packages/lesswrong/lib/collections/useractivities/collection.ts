import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const UserActivities: UserActivitiesCollection = createCollection({
  collectionName: 'UserActivities',
  typeName: 'UserActivity',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  logChanges: true,
});

addUniversalFields({collection: UserActivities})

export default UserActivities;
