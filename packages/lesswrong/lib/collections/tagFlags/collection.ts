import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, schemaDefaultValue } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { makeEditable } from '../../editor/make_editable';
import './fragments'
import { adminsGroup, userCanDo } from '../../vulcan-users/permissions';
import { forumTypeSetting } from '../../instanceSettings';

const schema: SchemaType<DbTagFlag> = {
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
    canRead: ['guests'],
    hasServerSide: true,
  },
  order: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
  }
};


const adminActions = [
  'tagFlags.new',
  'tagFlags.edit.all',
];

adminsGroup.can(adminActions);

const options: MutationOptions<DbTagFlag> = {
  newCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `tagFlags.new`)
  },

  editCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `tagFlags.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    // Nobody should be allowed to remove documents completely from the DB. 
    // Deletion is handled via the `deleted` flag.
    return false
  },
}

export const TagFlags: TagFlagsCollection = createCollection({
  collectionName: 'TagFlags',
  typeName: 'TagFlag',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  resolvers: getDefaultResolvers('TagFlags'),
  mutations: getDefaultMutations('TagFlags', options),
  logChanges: true,
});

addUniversalFields({collection: TagFlags})

makeEditable({
  collection: TagFlags,
  options: {
    order: 30,
    getLocalStorageId: (tagFlag, name) => {
      if (tagFlag._id) { return {id: `${tagFlag._id}_${name}`, verify: true} }
      return {id: `tagFlag: ${name}`, verify: false}
    },
  }
})
export default TagFlags;

