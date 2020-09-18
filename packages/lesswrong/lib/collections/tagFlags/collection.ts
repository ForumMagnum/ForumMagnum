import { createCollection, Utils } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, schemaDefaultValue } from '../../collectionUtils'
import { SchemaType } from '../../utils/schemaUtils'
import { makeEditable } from '../../editor/make_editable';
import './fragments'


const schema: SchemaType<DbTagFlag> = {
  createdAt: {
    optional: true,
    type: Date,
    canRead: ['guests'],
    onInsert: () => new Date(),
  },
  name: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['members', 'admins', 'sunshineRegiment'],
    canCreate: ['members', 'admins', 'sunshineRegiment'],
    order: 1
  },
  deleted: {
    optional: true,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
    order: 2,
    ...schemaDefaultValue(false),
  },
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (tagFlag) => {
      return Utils.getUnusedSlugByCollectionName("TagFlags", Utils.slugify(tagFlag.name))
    },
    onEdit: (modifier, tagFlag) => {
      if (modifier.$set.name) {
        return Utils.getUnusedSlugByCollectionName("TagFlags", Utils.slugify(modifier.$set.name), false, tagFlag._id)
      }
    }
  },
  order: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
  }
};

export const TagFlags = createCollection({
  collectionName: 'TagFlags',
  typeName: 'TagFlag',
  schema,
  resolvers: getDefaultResolvers('TagFlags'),
  mutations: getDefaultMutations('TagFlags'),
});

addUniversalFields({collection: TagFlags})

export const makeEditableOptions = {
  order: 30,
  getLocalStorageId: (tagFlag, name) => {
    if (tagFlag._id) { return {id: `${tagFlag._id}_${name}`, verify: true} }
    return {id: `tagFlag: ${name}`, verify: false}
  },
}

makeEditable({
  collection: TagFlags,
  options: makeEditableOptions
})
export default TagFlags;

