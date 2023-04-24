import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import {makeEditable} from "../../editor/make_editable";
import { forumTypeSetting } from '../../instanceSettings';

export const ModerationTemplates: ModerationTemplatesCollection = createCollection({
  collectionName: 'ModerationTemplates',
  typeName: 'ModerationTemplate',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('ModerationTemplates'),
  mutations: getDefaultMutations('ModerationTemplates'),
  logChanges: true,
});

addUniversalFields({collection: ModerationTemplates});

makeEditable({
  collection: ModerationTemplates,
  options: {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }
})

export default ModerationTemplates;
