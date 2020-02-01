import { createCollection } from 'meteor/vulcan:core';
import Users from '../users/collection';
import schema from './schema';
import { makeEditable } from '../../editor/make_editable';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.new.own') : Users.canDo(user, `sequences.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.edit.own') : Users.canDo(user, `sequences.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'sequences.edit.own') : Users.canDo(user, `sequences.edit.all`)
  },
}

export const Sequences = createCollection({
  collectionName: 'Sequences',
  typeName: 'Sequence',
  schema,
  resolvers: getDefaultResolvers('Sequences'),
  mutations: getDefaultMutations('Sequences', options)
})

export const makeEditableOptions = {
  order: 20
}

makeEditable({
  collection: Sequences,
  options: makeEditableOptions
})
addUniversalFields({collection: Sequences})

export default Sequences;
