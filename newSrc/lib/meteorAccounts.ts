// import { Accounts } from 'meteor/accounts-base';
// import { Session } from 'meteor/session';
// import { Meteor } from 'meteor/meteor';

// export { Accounts, Session }

// export const meteorUsersCollection = Meteor.users;
// export const meteorCurrentUserFromFiberContext = () => Meteor.user();

// export const meteorLogout = Meteor.logout;
// export const meteorLoginWithPassword = Meteor.loginWithPassword;
// export const meteorLoginWithMethod = (loginMethod: string) => Meteor[`loginWith${loginMethod}`];

export const Accounts = {};
export const Session = {};

export const meteorUsersCollection = {};
export const meteorCurrentUserFromFiberContext = () => {};

export const meteorLogout = () => console.log("meteorLogout");
export const meteorLoginWithPassword = console.log("meteorLoginWithPassword");
export const meteorLoginWithMethod = (loginMethod: string) => console.log("login with ", loginMethod);

