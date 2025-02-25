import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { makeEditable } from "../../editor/make_editable";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const ModerationTemplates: ModerationTemplatesCollection = createCollection({
  collectionName: 'ModerationTemplates',
  typeName: 'ModerationTemplate',
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
