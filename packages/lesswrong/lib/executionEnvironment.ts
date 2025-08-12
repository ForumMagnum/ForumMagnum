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

export const nodeEnv = process.env.NODE_ENV as "production"|"development"|"codegen"|"migrations"|"test"|"e2e"|"integration";

export const isMigrations = nodeEnv === 'migrations';
export const isAnyTest = nodeEnv === 'test';
export const isIntegrationTest = nodeEnv === 'integration';


export const isE2E = nodeEnv === 'e2e';
export const isPackageTest = nodeEnv === 'test';
export const isCodegen = nodeEnv === 'codegen';


// @ts-ignore next-line
globalThis.bundleIsServer = isServer;
// @ts-ignore next-line
globalThis.bundleIsTest = isAnyTest;
// @ts-ignore next-line
globalThis.bundleIsE2E = isE2E;
// @ts-ignore next-line
globalThis.bundleIsProduction = isProduction;
// @ts-ignore next-line
globalThis.bundleIsMigrations = isMigrations;
// @ts-ignore next-line
globalThis.bundleIsIntegrationTest = isIntegrationTest;
  // @ts-ignore next-line
if (globalThis.bundleIsCodegen === undefined) {
  // @ts-ignore next-line
  globalThis.bundleIsCodegen = isCodegen;
}


// @ts-ignore next-line
globalThis.defaultSiteAbsoluteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : 'http://localhost:3000';
// @ts-ignore next-line
globalThis.buildProcessPid = 0;
// @ts-ignore next-line
globalThis.ddEnv = 'local';
// @ts-ignore next-line
globalThis.enableVite = true;
