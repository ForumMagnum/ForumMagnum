import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import schema from './schema.js';
import { makeEditable } from '../../editor/make_editable.js';

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

export default Sequences;


// description: {
//   order:20,
//   type: Object,
//   optional: true,
//   viewableBy: ['guests'],
//   editableBy: ['members'],
//   insertableBy: ['members'],
//   control: 'EditorFormComponent',
//   blackbox: true,
//   placeholder:"Sequence Description (Supports Markdown and LaTeX)"
// },

// descriptionPlaintext: {
//   type: String,
//   optional: true,
//   viewableBy: ['guests'],
// },

// htmlDescription: {
//   type: String,
//   optional: true,
//   viewableBy: ['guests'],
// },

export const makeEditableOptions = {
  order: 20,
  fieldName: "description"
}

makeEditable({
  collection: Sequences,
  options: makeEditableOptions
})