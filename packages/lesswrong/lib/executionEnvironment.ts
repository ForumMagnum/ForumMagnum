
declare global {
  var bundleIsServer: boolean
  var bundleIsTest: boolean
  var bundleIsProduction: boolean
  var defaultSiteAbsoluteUrl: string
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
  if (defaultSiteAbsoluteUrl?.length>0) {
    return defaultSiteAbsoluteUrl;
  } else {
    return "http://localhost:3000/"
  }
}

export const addGlobalForShell = (name: string, value: any) => {
  // TODO
}


// Polyfill
import 'setimmediate';
