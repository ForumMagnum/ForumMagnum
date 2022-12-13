import * as _ from 'underscore';

declare global {
  let bundleIsServer: boolean;
  let bundleIsTest: boolean;
  let bundleIsProduction: boolean;
  let defaultSiteAbsoluteUrl: string;
  let serverPort: number;
  let estrellaPid: number;
  let ddEnv: string;
}

export const isClient = !bundleIsServer
export const isServer = bundleIsServer
export const isDevelopment = !bundleIsProduction
export const isProduction = bundleIsProduction
export const isAnyTest = bundleIsTest
export const isPackageTest = bundleIsTest

let alreadyRunStartupFuntions = false

type StartupFunction = {
  fn: ()=>void|Promise<void>,
  order: number
}
const onStartupFunctions: StartupFunction[] = [];
// Register a function to be executed on startup (after top-level import is
// done). Startup functions have a numeric order attached, and are executed in
// order from lowest to highest. If no order is given, the order is 0. Between
// functions with the same order number, order of execution is undefined.
export const onStartup = (fn: ()=>void|Promise<void>, order?: number) => {
  if (alreadyRunStartupFuntions) {
    throw new Error("Startup functions have already been run, can no longer register more")
  }
  onStartupFunctions.push({fn, order: order||0});
}

export const runStartupFunctions = async () => {
  alreadyRunStartupFuntions = true
  for (let startupFunction of _.sortBy(onStartupFunctions, f=>f.order)) {
    await startupFunction.fn();
  }
}

let instanceSettings: any = null;
export const getInstanceSettings = (): any => {
  if (!instanceSettings) {
    if (bundleIsServer) {
      const { loadInstanceSettings } = require('../server/commandLine.ts');
      instanceSettings = loadInstanceSettings();
    } else {
      instanceSettings = {
        public: window.publicInstanceSettings,
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
    return `http://localhost:${getServerPort()}/`
  }
}

export const addGlobalForShell = (name: string, value: any) => {
  // TODO
}

export const getServerPort = () => serverPort;
export const getWebsocketPort = () => serverPort + 1;

// Polyfill
import 'setimmediate';
