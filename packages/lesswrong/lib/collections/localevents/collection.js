import Users from 'meteor/vulcan:users';
import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import './permissions.js';

const options = {
     newCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localevents.new.own')
        : Users.canDo(user, `localevents.new.all`)
     },

     editCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localevents.edit.own')
       : Users.canDo(user, `localevents.edit.all`)
     },

     removeCheck: (user, document) => {
       if (!user || !document) return false;
       return document.organizerIds.includes(user._id) ? Users.canDo(user, 'localevents.remove.own')
       : Users.canDo(user, `localevents.remove.all`)
     },
 }

const LocalEvents = createCollection({

  collectionName: 'LocalEvents',

  typeName: 'LocalEvent',

  schema,

  resolvers: getDefaultResolvers('LocalEvents'),

  mutations: getDefaultMutations('LocalEvents', options)

});

export default LocalEvents;
