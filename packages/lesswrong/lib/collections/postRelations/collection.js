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


export const RelatedPostRels = createCollection({
  collectionName: 'RelatedPostRels',
  typeName: 'PostRelation',
  schema,
  resolvers: getDefaultResolvers('RelatedPostRels'),
  mutations: getDefaultMutations('RelatedPostRels', options),
});

addUniversalFields({collection: RelatedPostRels})

export default RelatedPostRels;