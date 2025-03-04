import { createCollection } from '../../vulcan-lib/collections';
import { addSlugFields, schemaDefaultValue } from '../../utils/schemaUtils';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { editableFields } from '../../editor/make_editable';
import './fragments'
import { userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"TagFlags"> = {
  ...editableFields("TagFlags", {
    order: 30,
    getLocalStorageId: (tagFlag, name) => {
      if (tagFlag._id) { return {id: `${tagFlag._id}_${name}`, verify: true} }
      return {id: `tagFlag: ${name}`, verify: false}
    },
  }),
  name: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['members', 'admins', 'sunshineRegiment'],
    canCreate: ['members', 'admins', 'sunshineRegiment'],
    order: 1
  },
  deleted: {
    optional: true,
    nullable: false,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
    order: 2,
    ...schemaDefaultValue(false),
  },
  order: {
    type: Number,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
  },
};


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
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagFlags', {deleted: 1, order: 1, name: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('TagFlags'),
  mutations: getDefaultMutations('TagFlags', options),
  logChanges: true,
});

addUniversalFields({collection: TagFlags})

addSlugFields({
  collection: TagFlags,
  getTitle: (tf) => tf.name,
  includesOldSlugs: false,
});

export default TagFlags;

