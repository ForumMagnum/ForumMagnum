import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { postCanEdit } from './helpers';

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return userCanDo(user, 'posts.new')
  },

  editCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest')) {
      return true
    }
    return postCanEdit(user, document)
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
});

addUniversalFields({collection: Posts})

export default Posts;
