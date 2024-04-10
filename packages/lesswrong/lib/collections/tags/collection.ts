import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { makeEditable } from '../../editor/make_editable'
import { userCanCreateTags } from '../../betas';
import { userIsAdmin } from '../../vulcan-users/permissions';
import schema from './schema';
import { tagUserHasSufficientKarma, userIsSubforumModerator } from './helpers';
import { formGroups } from './formGroups';

export const EA_FORUM_COMMUNITY_TOPIC_ID = 'ZCihBFp5P64JCvQY6';
export const EA_FORUM_TRANSLATION_TOPIC_ID = 'f4d3KbWLszzsKqxej';
export const EA_FORUM_APRIL_FOOLS_DAY_TOPIC_ID = '4saLTjJHsbduczFti';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
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
        if (restricted && !tag.canEditUserIds?.includes(user._id)) return false;
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
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members']
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
      canRead: ['guests'],
      canUpdate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      canCreate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
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
    hidden: true,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      canRead: ['guests'],
      canUpdate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
      canCreate: [userIsSubforumModerator, 'sunshineRegiment', 'admins'],
    },
  }
})

export default Tags;
