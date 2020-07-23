import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { makeEditable } from '../../editor/make_editable'
import { userCanCreateTags } from '../../betas';
import Users from '../users/collection';
import { schema } from './schema';

interface ExtendedTagsCollection extends TagsCollection {
  // From search/utils.ts
  toAlgolia: (tag: DbTag) => Promise<Array<Record<string,any>>|null>
  getUrl: (tag: DbTag | TagPreviewFragment) => string
}

export const Tags: ExtendedTagsCollection = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  resolvers: getDefaultResolvers('Tags'),
  mutations: getDefaultMutations('Tags', {
    newCheck: (user, tag) => {
      return userCanCreateTags(user);
    },
    editCheck: (user, tag) => {
      return userCanCreateTags(user);
    },
    removeCheck: (user, tag) => {
      return false;
    },
  }),
});

Tags.checkAccess = async (currentUser: DbUser|null, tag: DbTag, context: ResolverContext|null): Promise<boolean> => {
  if (Users.isAdmin(currentUser))
    return true;
  else if (tag.deleted)
    return false;
  else
    return true;
}

addUniversalFields({collection: Tags})

export const tagDescriptionEditableOptions = {
  commentStyles: true,
  fieldName: "description",
  getLocalStorageId: (tag, name) => {
    if (tag._id) { return {id: `tag:${tag._id}`, verify:true} }
    return {id: `tag:create`, verify:true}
  },
  revisionsHaveCommitMessages: true,
  permissions: {
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members']
  },
};

makeEditable({
  collection: Tags,
  options: tagDescriptionEditableOptions
});

export default Tags;
