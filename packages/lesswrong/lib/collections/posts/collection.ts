import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'
import { postCanEdit } from './helpers';

const options = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return Users.canDo(user, 'posts.new')
  },

  editCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'posts.alignment.move.all') ||
        Users.canDo(user, 'posts.alignment.suggest')) {
      return true
    }
    return postCanEdit(user, document)
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'posts.edit.own') : Users.canDo(user, `posts.edit.all`)
  },
}

// The set of fields required for calling postGetPageUrl. Could be supplied by
// either a fragment or a DbPost.
export interface PostsMinimumForGetPageUrl {
  _id: string
  slug: string
  isEvent?: boolean
  groupId?: string|undefined
}

interface ExtendedPostsCollection extends PostsCollection {
  // In search/utils.ts
  toAlgolia: (post: DbPost) => Promise<Array<Record<string,any>>|null>
  
  // Things in lib/collections/posts/collection.ts
  config: Record<string,number>
  statuses: Array<{value: number, label: string}>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
});

// refactor: moved here from schema.js
Posts.config = {};

Posts.config.STATUS_PENDING = 1;
Posts.config.STATUS_APPROVED = 2;
Posts.config.STATUS_REJECTED = 3;
Posts.config.STATUS_SPAM = 4;
Posts.config.STATUS_DELETED = 5;


// Post statuses
Posts.statuses = [
  {
    value: 1,
    label: 'pending'
  },
  {
    value: 2,
    label: 'approved'
  },
  {
    value: 3,
    label: 'rejected'
  },
  {
    value: 4,
    label: 'spam'
  },
  {
    value: 5,
    label: 'deleted'
  }
];

addUniversalFields({collection: Posts})

export default Posts;
