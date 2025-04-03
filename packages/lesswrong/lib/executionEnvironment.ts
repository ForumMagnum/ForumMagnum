import * as _ from 'underscore';

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

export const isClient = !bundleIsServer
export const isServer = bundleIsServer
export const isDevelopment = !bundleIsProduction
export const isProduction = bundleIsProduction
export const isMigrations = bundleIsMigrations
export const isAnyTest = bundleIsTest
export const isIntegrationTest = bundleIsIntegrationTest
export const isE2E = bundleIsE2E
export const isPackageTest = bundleIsTest
export const isCodegen = bundleIsCodegen

// Polyfill
import 'setimmediate';
