import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

export { Accounts, Session }

export const meteorUsersCollection = Meteor.users;
export const meteorCurrentUserFromFiberContext = () => Meteor.user();

export const meteorLogout = Meteor.logout;
export const meteorLoginWithPassword = Meteor.loginWithPassword;
export const meteorLoginWithMethod = (loginMethod: string) => Meteor[`loginWith${loginMethod}`];

