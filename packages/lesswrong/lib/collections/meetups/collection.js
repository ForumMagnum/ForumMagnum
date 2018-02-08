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
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'meetups.new.own')
        : Users.canDo(user, `meetups.new.all`)
     },

     editCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'meetups.edit.own')
       : Users.canDo(user, `meetups.edit.all`)
     },

     removeCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'meetups.remove.own')
       : Users.canDo(user, `meetups.remove.all`)
     },
 }

const LocalGroups = createCollection({

  collectionName: 'Meetups',

  typeName: 'Meetup',

  schema,

  resolvers: getDefaultResolvers('Meetups'),

  mutations: getDefaultMutations('Meetups', options)

});

export default LocalGroups;
