import LWEvents from '../collections/lwevents/collection.js';
import { newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { ForwardedWhitelist } from './forwarded_whitelist.js';

const dummyUser = Users.findOne();

Meteor.onConnection((connection) => {
  const document = {
    name: 'newConnection',
    important: false,
    properties: {
      ip: connection.clientAddress,
      id: connection.id,
    }
  }
  newMutation({
    collection: LWEvents,
    document: document,
    currentUser: dummyUser,
    validate: false,
  })

  connection.onClose(() => {
    const document = {
      name: 'closeConnection',
      important: false,
      properties: {
        ip: connection.clientAddress,
        id: connection.id,
      }
    }
    newMutation({
      collection: LWEvents,
      document: document,
      currentUser: dummyUser,
      validate: false,
    })
  })
})

Accounts.onLogin((login) => {
  const document = {
    name: 'login',
    important: false,
    userId: login.user && login.user._id,
    properties: {
      type: login.type,
      id: login.connection && login.connection.id,
      ip: login.connection && ForwardedWhitelist.getClientIP(login.connection)
    }
  }
  newMutation({
    collection: LWEvents,
    document: document,
    currentUser: dummyUser,
    validate: false,
  })
})
