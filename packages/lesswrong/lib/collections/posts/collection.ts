import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from './helpers';
import { makeEditable } from '../../editor/make_editable';
import { formGroups } from './formGroups';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { hasAuthorModeration } from '../../betas';

export const userCanPost = (user: UsersCurrent|DbUser) => {
  if (user.deleted) return false;
  if (user.postingDisabled) return false
  return userCanDo(user, 'posts.new')
}

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return userCanPost(user)
  },

  editCheck: async (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest') ||
        userIsMemberOf(user, 'canSuggestCuration')) {
      return true
    }

    return canUserEditPostMetadata(user, document) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, document, null)
    // note: we can probably get rid of the userIsPostGroupOrganizer call since that's now covered in canUserEditPostMetadata, but the implementation is slightly different and isn't otherwise part of the PR that restrutured canUserEditPostMetadata
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'posts.edit.own') : userCanDo(user, `posts.edit.all`)
  },
}

export const Posts = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
  logChanges: true,
});

const userHasModerationGuidelines = (currentUser: DbUser|null): boolean => {
  if (!hasAuthorModeration) {
    return false;
  }
  return !!(currentUser && ((currentUser.moderationGuidelines && currentUser.moderationGuidelines.html) || currentUser.moderationStyle))
}

addUniversalFields({
  collection: Posts,
  createdAtOptions: {canRead: ['admins']},
});

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.content,
    order: 25,
    pingbacks: true,
    permissions: {
      canRead: ['guests'],
      // TODO: we also need to cover userIsPostGroupOrganizer somehow, but we can't right now since it's async
      canUpdate: ['members', 'sunshineRegiment', 'admins'],
      canCreate: ['members']
    },
    hasToc: true,
  }
})

makeEditable({
  collection: Posts,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    hidden: isFriendlyUI,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members', 'sunshineRegiment', 'admins'],
      canCreate: [userHasModerationGuidelines]
    },
  }
})

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.highlight,
    fieldName: "customHighlight",
    permissions: {
      canRead: ['guests'],
      canUpdate: ['sunshineRegiment', 'admins'],
      canCreate: ['sunshineRegiment', 'admins'],
    },
  }
})


export default Posts;
