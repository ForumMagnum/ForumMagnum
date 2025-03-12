/**
 * Functions for setting up a script which connects to the database and shares
 * code with the webserver, but which is not in fact a webserver.
 */

import { existsSync } from "node:fs";
import { CommandLineOptions } from "../build";

// @ts-ignore This is a javascript file without a .d.ts
import { getDatabaseConfig } from "./startup/buildUtil";

export const initGlobals = (args: Record<string, unknown>, isProd: boolean, globalOverrides?: Record<string, unknown>) => {
  Object.assign(global, {
    bundleIsServer: true,
    bundleIsTest: false,
    bundleIsIntegrationTest: false,
    bundleIsCodegen: false,
    bundleIsE2E: false,
    bundleIsProduction: isProd,
    bundleIsMigrations: true,
    defaultSiteAbsoluteUrl: "",
    serverPort: 5001,
    buildProcessPid: -1,
    enableVite: false,
    ...globalOverrides,
  });

  const { getInstanceSettings } = require("../packages/lesswrong/lib/getInstanceSettings");
  getInstanceSettings(args); // These args will be cached for later
}

const forumTypes = ["lw", "ea", "none"] as const;
export type ForumType = typeof forumTypes[number];
const environmentTypes = ["dev", "local", "staging", "prod", "xpost"] as const;
export type EnvironmentType = typeof environmentTypes[number];

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

export const detectForumType = (): ForumType => {
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
      noSshTunnel: true, //workaround for a timing issue
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



export const normalizeEnvironmentType = (t: string): string => {
  if (t === "development") {
    return "dev";
  } else if (t === "production") {
    return "prod";
  } else {
    return t;
  }
}

export const isForumType = (t: string): t is ForumType =>
  forumTypes.includes(t as ForumType)
export const isEnvironmentType = (t: string): t is EnvironmentType =>
  environmentTypes.includes(t as EnvironmentType);
export const isCodegen = (t: string): t is 'codegen' =>
  t === 'codegen';
