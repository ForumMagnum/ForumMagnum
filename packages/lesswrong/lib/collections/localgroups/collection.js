import Users from 'meteor/vulcan:users';
import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import './permissions.js';

/**
 * @summary Telescope Conversations namespace
 * @namespace Conversations
 */

const options = {
     newCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localgroups.new.own')
        : Users.canDo(user, `localgroups.new.all`)
     },

     editCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localgroups.edit.own')
       : Users.canDo(user, `localgroups.edit.all`)
     },

     removeCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localgroups.remove.own')
       : Users.canDo(user, `localgroups.remove.all`)
     },
 }

const LocalGroups = createCollection({

  collectionName: 'LocalGroups',

  typeName: 'LocalGroup',

  schema,

  resolvers: getDefaultResolvers('LocalGroups'),

  mutations: getDefaultMutations('LocalGroups', options)

});

export default LocalGroups;
