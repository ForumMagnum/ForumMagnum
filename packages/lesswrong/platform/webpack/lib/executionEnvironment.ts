
export const isClient = !webpackIsServer
export const isServer = webpackIsServer
export const isDevelopment = true
export const isProduction = false
export const isAnyTest = false
export const isPackageTest = false

export const onStartup = (fn: ()=>void) => {
  setTimeout(fn, 0);
}

export const getInstanceSettings = (): any => {
  // TODO
  return {}
}

export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
  // TODO
  return "siteUrl"
}

// Like setTimeout, but with fiber handling
export const runAfterDelay = setTimeout;
// Like clearTimeout, but with fiber handling
export const clearRunAfterDelay = clearTimeout;

// Like setTimeout with 0 timeout, possibly different priority, and fiber handling
export const deferWithoutDelay = (fn) => setTimeout(fn, 0);

export const runAtInterval = setInterval;

export const wrapAsync = (fn)=>fn

export const meteorLocalStorageWrapper: any = null;

export const throwMeteorError = (messageId: string, message: string, messageOptions?: any) => {
  throw new Error(`${messageId}: message`);
}

export const addGlobalForShell = (name: string, value: any) => {
  // TODO
}


// Polyfill
import 'setimmediate';

