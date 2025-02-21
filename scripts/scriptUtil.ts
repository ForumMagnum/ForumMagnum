/**
 * Functions for setting up a script which connects to the database and shares
 * code with the webserver, but which is not in fact a webserver.
 */

import { existsSync } from "node:fs";
import { CommandLineOptions } from "../build";

// @ts-ignore This is a javascript file without a .d.ts
import { getDatabaseConfig } from "./startup/buildUtil";

export const initGlobals = (args: Record<string, unknown>, isProd: boolean) => {
  Object.assign(global, {
    bundleIsServer: true,
    bundleIsTest: false,
    bundleIsE2E: false,
    bundleIsProduction: isProd,
    bundleIsMigrations: true,
    defaultSiteAbsoluteUrl: "",
    serverPort: 5001,
    buildProcessPid: -1,
    enableVite: false,
  });

  const { getInstanceSettings } = require("../packages/lesswrong/lib/getInstanceSettings");
  getInstanceSettings(args); // These args will be cached for later
}

const forumTypes = ["lw", "ea", "none"] as const;
type ForumType = typeof forumTypes[number];

const getCredentialsBase = (forumType: ForumType): string => {
  const memorizedBases: Record<ForumType, string> = {
    lw: "..",
    ea: "..",
    none: ".",
  };
  return process.env.GITHUB_WORKSPACE ?? memorizedBases[forumType];
}

const credentialsPath = (forumType: ForumType) => {
  const base = getCredentialsBase(forumType);
  const memorizedRepoNames: Record<ForumType, string> = {
    lw: '/LessWrong-Credentials',
    ea: '/ForumCredentials',
    none: "",
  };
  const repoName = memorizedRepoNames[forumType];
  return `${base}${repoName}`;
}

export const detectForumType = async (): Promise<ForumType> => {
  const siteForumTypes = forumTypes.filter((forumType) => forumType !== "none");
  for (const forumType of siteForumTypes) {
    if (existsSync(credentialsPath(forumType))) {
      return forumType;
    }
  }
  return "none";
}

export const getSettingsFilePath = (fileName: string, forumType: ForumType) => {
  return `${credentialsPath(forumType)}/${fileName}`;
}

type DatabaseConfig = {
  postgresUrl?: string,
  sshTunnelCommand?: string[],
}

export const getDatabaseConfigFromModeAndForumType = (mode: string, forumType: ForumType): DatabaseConfig => {
  if (!mode) {
    return {};
  }
  const memorizedConfigPaths: Record<ForumType, Partial<CommandLineOptions>> = {
    lw: {
      db: `${credentialsPath(forumType)}/connectionConfigs/${mode}.json`,
    },
    ea: {
      postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
    },
    none: {
      postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
    },
  };
  const configPath = memorizedConfigPaths[forumType];
  return getDatabaseConfig(configPath) as DatabaseConfig;
};

export const getSettingsFileName = (mode: string, forumType: ForumType) => {
  if (!mode) {
    // With the state of the code when this comment was written, this indicates
    // an error condition, but it will be handled later, around L60
    return '';
  }
  if (forumType === 'lw') {
    if (mode === 'prod') {
      return 'settings-production-lesswrong.json';
    } else if (mode === 'local') {
      return 'settings-local-dev-localdb.json'
    } else {
      return 'settings-local-dev-devdb.json'
    }
  }
  return `settings-${mode}.json`;
};

export const normalizeModeAlias = (mode: string): string => {
  if (mode === "development") {
    return "dev";
  } else if (mode === "production") {
    return "prod";
  } else {
    return mode;
  }
}
