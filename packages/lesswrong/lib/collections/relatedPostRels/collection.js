import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'relatedPostRels.new.own') : Users.canDo(user, `relatedPostRels.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `relatedPostRels.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `relatedPostRels.remove.all`)
  },
}


export const RelatedPostRels = createCollection({
  collectionName: 'RelatedPostRels',
  typeName: 'RelatedPostRel',
  schema,
  resolvers: getDefaultResolvers('RelatedPostRels'),
  mutations: getDefaultMutations('RelatedPostRels', options),
});

addUniversalFields({collection: RelatedPostRels})

export default RelatedPostRels;