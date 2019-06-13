import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { addUniversalFields } from '../../collectionUtils'

const options = {
  newCheck: (user) => {
    if (!user) return false;
    return Users.canDo(user, 'posts.new')
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    if (Users.canDo(user, 'posts.alignment.move.all') ||
        Users.canDo(user, 'posts.alignment.suggest')) {
      return true
    }
    return Users.owns(user, document) ? Users.canDo(user, 'posts.edit.own') : Users.canDo(user, `posts.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'posts.edit.own') : Users.canDo(user, `posts.edit.all`)
  },
}

export const Posts = createCollection({
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