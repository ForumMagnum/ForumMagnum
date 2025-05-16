/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */
import { getDatabaseConfig, startSshTunnel } from "./scripts/startup/buildUtil";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const initGlobals = (args: any, isProd: boolean) => {
  // @ts-ignore
  global.bundleIsServer = true;
  // @ts-ignore
  global.bundleIsTest = false;
  // @ts-ignore
  global.bundleIsIntegrationTest = false;
  // @ts-ignore
  global.bundleIsCodegen = false;
  // @ts-ignore
  global.bundleIsE2E = false;
  // @ts-ignore
  global.bundleIsProduction = isProd;
  // @ts-ignore
  global.bundleIsMigrations = true;
  // @ts-ignore
  global.enableVite = false;
  // @ts-ignore
  global.defaultSiteAbsoluteUrl = "";

  global.serverPort = 5001;
  global.estrellaPid = -1;

  const { getInstanceSettings } = require("./packages/lesswrong/lib/getInstanceSettings");
  getInstanceSettings(args); // These args will be cached for later
}

const fetchImports = () => {
  const { ckEditorApi: { checkEditorBundle, uploadEditorBundle } } = require('./packages/lesswrong/server/ckEditor/ckEditorApi');
  const { ckEditorBundleVersion } = require('./packages/lesswrong/lib/wrapCkEditor')

  return { ckEditorBundleVersion, checkEditorBundle, uploadEditorBundle };
}

const credentialsPath = (forumType) => {
  const memorizedBases = {
    lw: "..",
    ea: "..",
  };
  const base = process.env.GITHUB_WORKSPACE ?? memorizedBases[forumType] ?? ".";
  const memorizedRepoNames = {
    lw: 'LessWrong-Credentials',
    ea: 'ForumCredentials',
  };
  const repoName = memorizedRepoNames[forumType];
  if (!repoName) {
    return base;
  }
  return `${base}/${repoName}`;
}

const settingsFilePath = (fileName: string, forumType: string) => {
  return `${credentialsPath(forumType)}/${fileName}`;
}

const databaseConfig = (mode: string, forumType: string): Partial<{ postgresUrl: string; sshTunnelCommand: string[] | null }> => {
  if (!mode) {
    return {};
  }
  const memorizedConfigPaths = {
    lw: {
      db: `${credentialsPath(forumType)}/connectionConfigs/${mode}.json`,
    },
    ea: {
      postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
    },
  };
  const configPath = memorizedConfigPaths[forumType] || {
    postgresUrlFile: `${credentialsPath(forumType)}/${mode}-pg-conn.txt`,
  };
  return getDatabaseConfig(configPath);
};

const settingsFileName = (mode: string, forumType: string) => {
  if (!mode) {
    // With the state of the code when this comment was written, this indicates
    // an error condition, but it will be handled later, around L60
    return '';
  }
  if (forumType === 'lw') {
    if (mode === 'prod') {
      return 'settings-production-lesswrong.json';
    }
    return 'settings-local-dev-devdb.json'
  }
  return `settings-${mode}.json`;
};

(async () => {
  let mode = process.argv[2];
  if (mode === "development") {
    mode = "dev";
  } else if (mode === "production") {
    mode = "prod";
  }

  const forumType = process.argv[3];

  const dbConf = databaseConfig(mode, forumType);
  if (dbConf.postgresUrl) {
    process.env.PG_URL = dbConf.postgresUrl;
  }
  const args = {
    postgresUrl: process.env.PG_URL,
    settingsFileName: settingsFilePath(settingsFileName(mode, forumType), forumType),
    shellMode: false,
  };
  
  await startSshTunnel(databaseConfig(mode, forumType).sshTunnelCommand);

  initGlobals(args, mode === "prod");

  const {initServer} = require("./packages/lesswrong/server/serverStartup");
  await initServer(args);

  const { ckEditorBundleVersion, checkEditorBundle, uploadEditorBundle } = fetchImports();

  let exitCode = 0;

  try {
    const { exists } = await checkEditorBundle(ckEditorBundleVersion);
    if (!exists) {
      console.log(`ckEditor bundle version ${ckEditorBundleVersion} not yet uploaded; building now`);
      await execAsync(`cd ckEditor && yarn && yarn build`);
      await uploadEditorBundle(ckEditorBundleVersion);
    }
  } catch (e) {
    console.error("An error occurred while checking, building, or uploading the ckEditor bundle version:", e);
    exitCode = 1;
  }

  process.exit(exitCode);
})();
