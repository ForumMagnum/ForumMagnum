// import * as _ from 'underscore';

declare global {
  let bundleIsServer: boolean;
  let bundleIsTest: boolean;
  let bundleIsIntegrationTest: boolean;
  let bundleIsCodegen: boolean;
  let bundleIsE2E: boolean;
  let bundleIsProduction: boolean;
  let bundleIsMigrations: boolean;
  let defaultSiteAbsoluteUrl: string;
  let buildProcessPid: number;
  let ddEnv: string;
  let enableVite: boolean;
}

// export const isClient = !bundleIsServer
// export const isServer = bundleIsServer
// export const isDevelopment = !bundleIsProduction
// export const isProduction = bundleIsProduction
// export const isMigrations = bundleIsMigrations
// export const isAnyTest = bundleIsTest
// export const isIntegrationTest = bundleIsIntegrationTest
// export const isE2E = bundleIsE2E
// export const isPackageTest = bundleIsTest
// export const isCodegen = bundleIsCodegen

// // Polyfill
// import 'setimmediate';

// TODO: maybe these end up getting replaced by environment variables if we move to Vercel?

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;


export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;


export const isMigrations = process.env.NODE_ENV === 'migrations';
export const isAnyTest = process.env.NODE_ENV === 'test';
export const isIntegrationTest = process.env.NODE_ENV === 'integration';


export const isE2E = process.env.NODE_ENV === 'e2e';
export const isPackageTest = process.env.NODE_ENV === 'test';
export const isCodegen = process.env.NODE_ENV === 'codegen';


// @ts-ignore next-line
global.bundleIsServer = isServer;
// @ts-ignore next-line
global.bundleIsTest = isAnyTest;
// @ts-ignore next-line
global.bundleIsE2E = isE2E;
// @ts-ignore next-line
global.bundleIsProduction = isProduction;
// @ts-ignore next-line
global.bundleIsMigrations = isMigrations;
// @ts-ignore next-line
global.bundleIsIntegrationTest = isIntegrationTest;
// @ts-ignore next-line
global.bundleIsCodegen = isCodegen;


// @ts-ignore next-line
global.defaultSiteAbsoluteUrl = 'https://localhost:3000';
// @ts-ignore next-line
global.buildProcessPid = 0;
// @ts-ignore next-line
global.ddEnv = 'local';
// @ts-ignore next-line
global.enableVite = true;
