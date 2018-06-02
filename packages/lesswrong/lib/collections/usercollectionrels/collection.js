import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
/**
 * @summary Initiate UserCollectionRels collection
 * @namespace UserCollectionRels
 */

const options = {

  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'usercollectionrels.new.own') : Users.canDo(user, `usercollectionrels.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'usercollectionrels.edit.own') : Users.canDo(user, `usercollectionrels.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `usercollectionrels.remove.all`)
  },

}


const UserCollectionRels = createCollection({

  // collection: Meteor.notifications,

  collectionName: 'UserCollectionRels',

  typeName: 'UserCollectionRel',

  schema,

  resolvers: getDefaultResolvers('UserCollectionRels'),

  mutations: getDefaultMutations('UserCollectionRels', options),

});

UserCollectionRels.checkAccess = (user, document) => {
  if (!user || !document) return false;
  return Users.owns(user, document) ? Users.canDo(user, 'notifications.view.own') : Users.canDo(user, `conversations.view.all`)
};


export default UserCollectionRels;
