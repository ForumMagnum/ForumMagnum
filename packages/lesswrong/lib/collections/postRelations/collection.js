import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'postRelations.new.own') : Users.canDo(user, `postRelations.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `postRelations.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `postRelations.remove.all`)
  },
}


export const PostRelations = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  schema,
  resolvers: getDefaultResolvers('PostRelations'),
  mutations: getDefaultMutations('PostRelations', options),
});

addUniversalFields({collection: PostRelations})

export default PostRelations;