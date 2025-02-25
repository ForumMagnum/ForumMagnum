// NOTE: This file is used early in server startup and is import-order-sensitive;
// importing things from here can break things, by making it so that global
// variables get initialized from database settings before the settings have been
// loaded from the database.

export const registeredSettings: Record<string, "server" | "public" | "instance"> = {}

let serverSettingsCache: Record<string,any> = {}
let serverSettingsLoaded = false;
export const setServerSettingsCache = (newCacheContents: Record<string,any>) => {
  serverSettingsCache = newCacheContents;
  serverSettingsLoaded = true;
}
export const getServerSettingsCache = () => serverSettingsCache;
export const getServerSettingsLoaded = () => serverSettingsLoaded;

// We initialize these public settings to make it available on both the client and the server,
// but they get initialized via separate pathways on the client and on the server
// Server: See databaseSettings.ts in the server directory
// Client: See publicSettings.ts in the client directory
let publicSettings: Record<string, any> = {}
let publicSettingsLoaded = false;
export const setPublicSettings = (newCacheContents: Record<string,any>) => {
  publicSettings = newCacheContents;
  publicSettingsLoaded = true;
}
export const getPublicSettings = () => publicSettings;
export const getPublicSettingsLoaded = () => publicSettingsLoaded;

export function initializeSetting(settingName: string, settingType: 'server' | 'public' | 'instance') {
  if (registeredSettings[settingName]) {
    if (!enableVite) {
      // If using Vite, allow this to rerun. Otherwise enforce that a setting
      // is only initialized once.
      throw Error(`Already initialized a setting with name ${settingName} before.`)
    }
  }
  registeredSettings[settingName] = settingType
}
