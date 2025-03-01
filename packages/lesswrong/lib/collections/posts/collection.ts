import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '../../vulcan-users/permissions';
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from './helpers';
import { addSlugFields } from '@/lib/utils/schemaUtils';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { postCheckAccess } from './checkAccess';

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
  voteable: {
    timeDecayScoresCronjob: true,
  },
  dependencies: [
    {type: "extension", name: "btree_gin"},
    {type: "extension", name: "earthdistance"},
  ],
});

addUniversalFields({
  collection: Posts,
  createdAtOptions: {canRead: ['admins']},
});
addSlugFields({
  collection: Posts,
  getTitle: (post) => post.title,
  includesOldSlugs: false,
  slugOptions: {
  },
  oldSlugsOptions: {
  },
});

Posts.checkAccess = postCheckAccess;


export default Posts;
