declare global {
  let bundleIsServer: boolean;
  let bundleIsTest: boolean;
  let bundleIsE2E: boolean;
  let bundleIsProduction: boolean;
  let bundleIsMigrations: boolean;
  let defaultSiteAbsoluteUrl: string;
  let serverPort: number;
  let estrellaPid: number;
  let ddEnv: string;
}

export const isClient = !bundleIsServer
export const isServer = bundleIsServer
export const isDevelopment = !bundleIsProduction
export const isProduction = bundleIsProduction
export const isMigrations = bundleIsMigrations
export const isAnyTest = bundleIsTest
export const isE2E = bundleIsE2E
export const isPackageTest = bundleIsTest

export interface CommandLineArguments {
  postgresUrl: string
  postgresReadUrl: string
  settingsFileName: string
  shellMode: boolean,
  command?: string,
}

let instanceSettings: any = null;
export const getInstanceSettings = (args?: CommandLineArguments): any => {
  if (!instanceSettings) {
    if (bundleIsServer) {
      // eslint-disable-next-line import/no-restricted-paths
      const { loadInstanceSettings } = require('../server/commandLine.ts');
      instanceSettings = loadInstanceSettings(args);
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

export const getAbsoluteUrl = (): string => {
  if (defaultSiteAbsoluteUrl?.length>0) {
    return defaultSiteAbsoluteUrl;
  } else {
    return `http://localhost:${getServerPort()}/`
  }
}

export const getServerPort = () => serverPort;
export const getWebsocketPort = () => serverPort + 1;

// Polyfill
import 'setimmediate';
