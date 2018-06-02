import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
/**
 * @summary Initiate UserSequenceRels collection
 * @namespace UserSequenceRels
 */

const options = {

  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'usersequencerels.new.own') : Users.canDo(user, `usersequencerels.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'usersequencerels.edit.own') : Users.canDo(user, `usersequencerels.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `usersequencerels.remove.all`)
  },

}


const UserSequenceRels = createCollection({

  // collection: Meteor.notifications,

  collectionName: 'UserSequenceRels',

  typeName: 'UserSequenceRel',

  schema,

  resolvers: getDefaultResolvers('UserSequenceRels'),

  mutations: getDefaultMutations('UserSequenceRels', options),

});

UserSequenceRels.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return Users.owns(user, document) ? Users.canDo(user, 'notifications.view.own') : Users.canDo(user, `conversations.view.all`)
};

export default UserSequenceRels;
