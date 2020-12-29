
declare global {
  var bundleIsServer: boolean
  var bundleIsTest: boolean
  var bundleIsProduction: boolean
}

export const isClient = !bundleIsServer
export const isServer = bundleIsServer
export const isDevelopment = !bundleIsProduction
export const isProduction = bundleIsProduction
export const isAnyTest = bundleIsTest
export const isPackageTest = bundleIsTest

export const onStartupFunctions: Array<()=>void> = [];
export const onStartup = (fn: ()=>void) => {
  onStartupFunctions.push(fn);
}

let instanceSettings: any = null;
export const getInstanceSettings = (): any => {
  if (!instanceSettings) {
    if (bundleIsServer) {
      const { loadInstanceSettings } = require('../server/commandLine.ts');
      instanceSettings = loadInstanceSettings();
    } else {
      instanceSettings = {
        public: (window as any).publicInstanceSettings,
      };
    }
  }
  return instanceSettings;
}
export const setInstanceSettings = (settings: any) => {
  instanceSettings = settings;
}

export const getAbsoluteUrl = (maybeRelativeUrl?: string): string => {
  return "http://localhost:3000/" // TODO
}

// Like setTimeout, but with fiber handling
export const runAfterDelay = setTimeout;
// Like clearTimeout, but with fiber handling
export const clearRunAfterDelay = clearTimeout;

// Like setTimeout with 0 timeout, possibly different priority, and fiber handling
export const deferWithoutDelay = (fn) => setTimeout(fn, 0);

export const runAtInterval = setInterval;

export const wrapAsync = (fn)=>fn

export const throwMeteorError = (messageId: string, message: string, messageOptions?: any) => {
  throw new Error(`${messageId}: message`);
}

export const addGlobalForShell = (name: string, value: any) => {
  // TODO
}


// Polyfill
import 'setimmediate';
