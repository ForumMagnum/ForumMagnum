import { LWEvents } from '../lib/collections/lwevents/collection';
import { createMutator } from './vulcan-lib';
import Users from '../lib/collections/users/collection';
import { Meteor } from 'meteor/meteor';

let dummyUser: DbUser|null = null;
async function getDummyUser(): Promise<DbUser> {
  if (!dummyUser) dummyUser = Users.findOne();
  if (!dummyUser) throw Error("No users in the database, can't get dummy user")
  return dummyUser;
}
void getDummyUser();

Meteor.onConnection(async (connection) => {
  let currentUser = await getDummyUser();
  const ip = (connection.httpHeaders && connection.httpHeaders["x-real-ip"]) || connection.clientAddress;
  
  void createMutator({
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
  console.info(`new Meteor connection from ${connection.clientAddress}`);

  connection.onClose(() => {
    //eslint-disable-next-line no-console
    console.info(`closed Meteor connection from ${connection.clientAddress}`);
    void createMutator({
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