import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { makeEditable } from "../../editor/make_editable";

export const CurationNotices: CurationNoticesCollection = createCollection({
  collectionName: 'CurationNotices',
  typeName: 'CurationNotice',
  schema,
  resolvers: getDefaultResolvers('CurationNotices'),
  mutations: getDefaultMutations('CurationNotices'),
  logChanges: true,
});

addUniversalFields({collection: CurationNotices});

makeEditable({
  collection: CurationNotices,
  options: {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }
})

export default CurationNotices;
