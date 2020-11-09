import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

export { Session }

export const meteorLogout = Meteor.logout;
export const meteorLoginWithPassword = Meteor.loginWithPassword;
export const meteorLoginWithMethod = (loginMethod: string) => Meteor[`loginWith${loginMethod}`];

export const sendVerificationEmail = (userId) => console.log("This should eventually send a verificatin email")

