import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { makeEditable } from '../../editor/make_editable'
import { userCanCreateTags } from '../../betas';
import { userIsAdmin } from '../../vulcan-users/permissions';
import { schema } from './schema';
import { forumSelect } from '../../forumTypeUtils';

const tagMinimumKarmaPermissions = forumSelect({
  EAForum: {
    new: 10,
    edit: 10,
  },
  // Default is to allow all users to create/edit tags
  default: {
    new: -1000,
    edit: -1000,
  }
})

type getUrlOptions = {
  edit?: boolean, 
  flagId?: string
}
interface ExtendedTagsCollection extends TagsCollection {
  // From search/utils.ts
  toAlgolia: (tag: DbTag) => Promise<Array<AlgoliaDocument>|null>
}

export const Tags: ExtendedTagsCollection = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  resolvers: getDefaultResolvers('Tags'),
  mutations: getDefaultMutations('Tags', {
    newCheck: (user: DbUser|null, tag: DbTag|null) => {
      if (user?.karma ?? 0 < tagMinimumKarmaPermissions['new']) {
        return false
      }
      return userCanCreateTags(user);
    },
    editCheck: (user: DbUser|null, tag: DbTag|null) => {
      if ((user?.karma ?? 0) < tagMinimumKarmaPermissions['edit']) {
        return false
      }
      return userCanCreateTags(user);
    },
    removeCheck: (user: DbUser|null, tag: DbTag|null) => {
      return false;
    },
  }),
  logChanges: true,
});

Tags.checkAccess = async (currentUser: DbUser|null, tag: DbTag, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser))
    return true;
  else if (tag.deleted)
    return false;
  else
    return true;
}

addUniversalFields({collection: Tags})

makeEditable({
  collection: Tags,
  options: {
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
    order: 10
  }
});

export default Tags;
