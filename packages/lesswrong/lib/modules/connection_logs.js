import { LWEvents } from '../collections/lwevents/collection.js';
import { newMutation } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { ForwardedWhitelist } from './forwarded_whitelist.js';
import { Accounts } from 'meteor/accounts-base';

let dummyUser = null;
async function getDummyUser() {
  if (!dummyUser) dummyUser = Users.findOne();
  return dummyUser;
}
getDummyUser();

Meteor.onConnection(async (connection) => {
  let currentUser = await getDummyUser();
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
    currentUser: currentUser,
    validate: false,
  })
  //eslint-disable-next-line no-console
  console.info("new Meteor connection:", connection)

  connection.onClose(() => {
    const document = {
      name: 'closeConnection',
      important: false,
      properties: {
        ip: connection.clientAddress,
        id: connection.id,
      }
    }
    //eslint-disable-next-line no-console
    console.info("closed Meteor connection:", connection)
    newMutation({
      collection: LWEvents,
      document: document,
      currentUser: currentUser,
      validate: false,
    })
  })
})

Accounts.onLogin(async (login) => {
  const document = {
    name: 'login',
    important: false,
    userId: login.user && login.user._id,
    properties: {
      type: login.type,
      id: login.connection && login.connection.id,
      ip: login.connection && ForwardedWhitelist.getClientIP(login.connection),
      userAgent: login.connection && login.connection.httpHeaders && login.connection.httpHeaders['user-agent'],
      referrer: login.connection && login.connection.httpHeaders && login.connection.httpHeaders['referer']
    }
  }
  newMutation({
    collection: LWEvents,
    document: document,
    currentUser: await getDummyUser(),
    validate: false,
  })
})
