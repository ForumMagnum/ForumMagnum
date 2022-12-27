import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { makeEditable } from '../../editor/make_editable'
import { userCanCreateTags } from '../../betas';
import { userIsAdmin } from '../../vulcan-users/permissions';
import schema from './schema';
import { tagUserHasSufficientKarma } from './helpers';
import { formGroups } from './formGroups';
import { forumTypeSetting } from '../../instanceSettings';

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
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'switching' : 'mongo',
  schema,
  resolvers: getDefaultResolvers('Tags'),
  mutations: getDefaultMutations('Tags', {
    newCheck: (user: DbUser|null, tag: DbTag|null) => {
      if (!user) return false;
      if (user.deleted) return false;

      if (!user.isAdmin) {  // skip further checks for admins
        if (!tagUserHasSufficientKarma(user, "new")) return false
      }
      return userCanCreateTags(user);
    },
    editCheck: (user: DbUser|null, tag: DbTag|null) => {
      if (!user) return false;
      if (user.deleted) return false;

      if (!user.isAdmin) {  // skip further checks for admins
        // If canEditUserIds is set only those users can edit the tag
        const restricted = tag && tag.canEditUserIds
        if (restricted && !tag.canEditUserIds.includes(user._id)) return false;
        if (!restricted && !tagUserHasSufficientKarma(user, "edit")) return false
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

export const userIsSubforumModerator = (user: DbUser|null, tag: DbTag): boolean => {
  if (!user || !tag) return false;
  return tag.subforumModeratorIds?.includes(user._id);
}

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

makeEditable({
  collection: Tags,
  options: {
    formGroup: formGroups.subforumWelcomeMessage,
    fieldName: "subforumWelcomeText",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      insertableBy: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
    },
  }
});

makeEditable({
  collection: Tags,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.subforumModerationGuidelines,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      viewableBy: ['guests'],
      editableBy: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      insertableBy: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
    },
  }
})

export default Tags;
