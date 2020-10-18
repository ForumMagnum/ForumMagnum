// import { Meteor } from 'meteor/meteor';

// export const isServer = Meteor.isServer
// export const isClient = Meteor.isClient
// export const isDevelopment = Meteor.isDevelopment
// export const isProduction = Meteor.isProduction
// export const isAnyTest = Meteor.isTest || Meteor.isAppTest || Meteor.isPackageTest
// export const isPackageTest = Meteor.isPackageTest

// export const onStartup = (fn: ()=>void) => {
//   Meteor.startup(fn);
// }

// export const getInstanceSettings = () => Meteor.settings;

// export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
//   return Meteor.absoluteUrl(maybeRelativeUrl);
// }

// // Like setTimeout, but with fiber handling
// export const runAfterDelay = Meteor.setTimeout;

// // Like setTimeout with 0 timeout, possibly different priority, and fiber handling
// export const deferWithoutDelay = Meteor.delay;

// export const runAtInterval = Meteor.setInterval;

// export const wrapAsync = Meteor.wrapAsync ? Meteor.wrapAsync : Meteor._wrapAsync;




export const isClient = (typeof window != 'undefined' && window.document)
export const isServer = !isClient
export const isDevelopment = true
export const isProduction = false
export const isAnyTest = false
export const isPackageTest = false

export const onStartup = (fn: ()=>void) => {
  console.log("onStartup")
  setTimeout(fn, 0)
}

export const getInstanceSettings = () => {
  console.log("instanceSettings");
  return {};
}

export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
  console.log("getAbsoluteUrl")
  return "siteUrl"
}

// Like setTimeout, but with fiber handling
export const runAfterDelay = setTimeout;

// Like setTimeout with 0 timeout, possibly different priority, and fiber handling
export const deferWithoutDelay = (fun) => setTimeout(fun, 0)

export const runAtInterval = setInterval;

export const wrapAsync = (fn) => fn
