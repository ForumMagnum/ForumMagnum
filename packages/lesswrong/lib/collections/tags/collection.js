import { createCollection, getDefaultResolvers, getDefaultMutations, Utils } from 'meteor/vulcan:core';
import { addUniversalFields, schemaDefaultValue } from '../../collectionUtils'
import { denormalizedCountOfReferences } from '../../modules/utils/schemaUtils';
import { makeEditable } from '../../editor/make_editable.js'
import Users from 'meteor/vulcan:users';

const schema = {
  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },
  name: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins'],
  },
  slug: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    onInsert: (tag) => {
      return Utils.getUnusedSlugByCollectionName("Tags", Utils.slugify(tag.name))
    },
    onEdit: (modifier, tag) => {
      if (modifier.$set.title) {
        return Utils.getUnusedSlugByCollectionName("Tags", Utils.slugify(modifier.$set.name), false, tag._id)
      }
    }
  },
  postCount: {
    ...denormalizedCountOfReferences({
      fieldName: "postCount",
      collectionName: "Tags",
      foreignCollectionName: "TagRels",
      foreignTypeName: "TagRel",
      foreignFieldName: "tagId",
      //filterFn: tagRel => tagRel.baseScore > 0, //TODO: Didn't work with filter; votes are bypassing the relevant callback?
    }),
    viewableBy: ['guests'],
  },
  deleted: {
    type: Boolean,
    viewableBy: ['guests'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },
};

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  resolvers: getDefaultResolvers('Tags'),
  mutations: getDefaultMutations('Tags', {
    newCheck: (user, tag) => {
      return Users.isAdmin(user);
    },
    editCheck: (user, tag) => {
      return Users.isAdmin(user);
    },
    removeCheck: (user, tag) => {
      return false;
    },
  }),
});

Tags.checkAccess = (currentUser, tag) => {
  if (Users.isAdmin(currentUser))
    return true;
  else if (tag.deleted)
    return false;
  else
    return true;
}

addUniversalFields({collection: Tags})

export const tagDescriptionEditableOptions = {
  fieldName: "description",
  getLocalStorageId: (tag, name) => {
    if (tag._id) { return {id: `tag:${tag._id}`, verify:true} }
    return {id: `tag:create`, verify:true}
  },
};

makeEditable({
  collection: Tags,
  options: tagDescriptionEditableOptions,
});

export default Tags;
