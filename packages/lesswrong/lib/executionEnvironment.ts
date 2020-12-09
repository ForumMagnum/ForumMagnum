import { Meteor } from 'meteor/meteor';

export const isServer = Meteor.isServer
export const isClient = Meteor.isClient
export const isDevelopment = Meteor.isDevelopment
export const isProduction = Meteor.isProduction
export const isAnyTest = Meteor.isTest || Meteor.isAppTest || Meteor.isPackageTest
export const isPackageTest = Meteor.isPackageTest

export const onStartup = (fn: ()=>void) => {
  Meteor.startup(fn);
}

export const getInstanceSettings = () => Meteor.settings;

export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
  return Meteor.absoluteUrl(maybeRelativeUrl);
}

// Like setTimeout, but with fiber handling
export const runAfterDelay = Meteor.setTimeout;
// Like clearTimeout, but with fiber handling
export const clearRunAfterDelay = Meteor.clearTimeout;

// Like setTimeout with 0 timeout, possibly different priority, and fiber handling
export const deferWithoutDelay = Meteor.defer;

export const runAtInterval = Meteor.setInterval;

export const wrapAsync = Meteor.wrapAsync ? Meteor.wrapAsync : Meteor._wrapAsync;
