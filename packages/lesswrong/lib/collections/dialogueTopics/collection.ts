import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';

export const DialogueTopics: DialogueTopicsCollection = createCollection({
  collectionName: 'DialogueTopics',
  typeName: 'DialogueTopics',
  collectionType: 'pg',
  schema
});

addUniversalFields({collection: DialogueTopics})

export default DialogueTopics;
