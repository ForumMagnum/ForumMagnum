import LWEvents from '../collections/lwevents/collection.js';
import { newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

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
  console.log("New Connection: ", connection);

  connection.onClose(() => {
    console.log("Closing connection: ", connection)
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
      ip: login.connection && login.connection.clientAddress
    }
  }
  newMutation({
    collection: LWEvents,
    document: document,
    currentUser: dummyUser,
    validate: false,
  })
  console.log("New Login: ", login)
})
