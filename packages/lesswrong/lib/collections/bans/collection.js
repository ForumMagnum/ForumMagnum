import schema from './schema.js';
import Users from 'meteor/vulcan:users'
import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
/**
 * @summary Initiate Bans collection
 * @namespace Bans
 */

const options = {

  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, 'bans.new');
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `bans.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `bans.remove.all`)
  },

}


export const Bans = createCollection({

  // collection: Meteor.notifications,

  collectionName: 'Bans',

  typeName: 'Ban',

  schema,

  resolvers: getDefaultResolvers('Bans'),

  mutations: getDefaultMutations('Bans', options),

});


addUniversalFields({collection: Bans})