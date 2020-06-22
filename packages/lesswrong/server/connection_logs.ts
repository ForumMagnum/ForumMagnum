import { LWEvents } from '../lib/collections/lwevents/collection';
import { newMutation } from './vulcan-lib';
import Users from '../lib/collections/users/collection';
import { ForwardedWhitelist } from './forwarded_whitelist';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

let dummyUser: DbUser|null = null;
async function getDummyUser(): Promise<DbUser> {
  if (!dummyUser) dummyUser = Users.findOne();
  if (!dummyUser) throw Error("No users in the database, can't get dummy user")
  return dummyUser;
}
getDummyUser();

Meteor.onConnection(async (connection) => {
  let currentUser = await getDummyUser();
  const ip = (connection.httpHeaders && connection.httpHeaders["x-real-ip"]) || connection.clientAddress;
  
  newMutation({
    collection: LWEvents,
    document: {
      name: 'newConnection',
      important: false,
      properties: {
        ip: ip,
        id: connection.id,
      }
    },
    currentUser: currentUser,
    validate: false,
  })
  //eslint-disable-next-line no-console
  console.info("new Meteor connection:", connection)

  connection.onClose(() => {
    //eslint-disable-next-line no-console
    console.info("closed Meteor connection:", connection)
    newMutation({
      collection: LWEvents,
      document: {
        name: 'closeConnection',
        important: false,
        properties: {
          ip: ip,
          id: connection.id,
        }
      },
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
