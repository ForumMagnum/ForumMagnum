import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { userIsPostGroupOrganizer } from './helpers';

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    if (user.deleted) return false;
    return userCanDo(user, 'posts.new')
  },

  editCheck: async (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest')) {
      return true
    }
    
    return userOwns(user, document) || userCanDo(user, 'posts.edit.all') || await userIsPostGroupOrganizer(user, document)
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'posts.edit.own') : userCanDo(user, `posts.edit.all`)
  },
}

interface ExtendedPostsCollection extends PostsCollection {
  getSocialPreviewImage: (post: DbPost) => string
  // In search/utils.ts
  toAlgolia: (post: DbPost) => Promise<Array<AlgoliaDocument>|null>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
  logChanges: true,
});

addUniversalFields({collection: Posts})

export default Posts;
