import * as _ from 'underscore';

declare global {
  let bundleIsServer: boolean;
  let bundleIsTest: boolean;
  let bundleIsE2E: boolean;
  let bundleIsProduction: boolean;
  let bundleIsMigrations: boolean;
  let defaultSiteAbsoluteUrl: string;
  let buildProcessPid: number;
  let ddEnv: string;
  let enableVite: boolean;
}

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;


export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;


export const isMigrations = process.env.NODE_ENV === 'migrations';
export const isAnyTest = process.env.NODE_ENV === 'test';


export const isE2E = process.env.NODE_ENV === 'e2e';
export const isPackageTest = process.env.NODE_ENV === 'test';


// ts-ignore next-line
global.bundleIsServer = isServer;
// ts-ignore next-line
global.bundleIsTest = isAnyTest;
// ts-ignore next-line
global.bundleIsE2E = isE2E;
// ts-ignore next-line
global.bundleIsProduction = isProduction;
// ts-ignore next-line
global.bundleIsMigrations = isMigrations;


// ts-ignore next-line
global.defaultSiteAbsoluteUrl = 'https://localhost:3000';
// ts-ignore next-line
global.buildProcessPid = 0;
// ts-ignore next-line
global.ddEnv = 'local';
// ts-ignore next-line
global.enableVite = true;

export const addGlobalForShell = (name: string, value: any) => {
  // TODO
}

// Polyfill
import 'setimmediate';
