import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const PetrovDayLaunchs: PetrovDayLaunchsCollection = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'switching',
  schema
});

addUniversalFields({collection: PetrovDayLaunchs})

export default PetrovDayLaunchs;
