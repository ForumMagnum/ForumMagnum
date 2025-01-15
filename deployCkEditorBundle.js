// @ts-check
/**
 * Usage: yarn migrate up|down|pending|executed [dev|staging|prod] [forumType]
 *
 * If no environment is specified, you can use the environment variables PG_URL
 * and SETTINGS_FILE
 */
require("ts-node/register");
const { getDatabaseConfig, startSshTunnel } = require("./scripts/startup/buildUtil");
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const initGlobals = (args, isProd) => {
  global.bundleIsServer = true;
  global.bundleIsTest = false;
  global.bundleIsE2E = false;
  global.bundleIsProduction = isProd;
  global.bundleIsMigrations = true;
  global.enableVite = false;
  global.defaultSiteAbsoluteUrl = "";
  global.serverPort = 5001;
  global.estrellaPid = -1;

  const { getInstanceSettings } = require("./packages/lesswrong/lib/getInstanceSettings");
  getInstanceSettings(args); // These args will be cached for later
}

const fetchImports = (args, isProd) => {
  initGlobals(args, isProd);

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

const settingsFilePath = (fileName, forumType) => {
  return `${credentialsPath(forumType)}/${fileName}`;
}

const databaseConfig = (mode, forumType) => {
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

const settingsFileName = (mode, forumType) => {
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

  const { ckEditorBundleVersion, checkEditorBundle, uploadEditorBundle } = fetchImports(args, mode === "prod");

  const {initServer} = require("./packages/lesswrong/server/serverStartup");
  await initServer(args);

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
