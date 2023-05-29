#!/usr/bin/env node
const { build, cliopts } = require("estrella");
const fs = require('fs');
const process = require('process');
const { zlib } = require("mz");
const { getDatabaseConfig, startSshTunnel } = require("./scripts/startup/buildUtil");
const { setClientRebuildInProgress, setServerRebuildInProgress, generateBuildId, startAutoRefreshServer, initiateRefresh } = require("./scripts/startup/autoRefreshServer");
/**
 * This is used for clean exiting in Github workflows by the dev
 * only route /api/quit
 */
process.on("SIGQUIT", () => process.exit(0));

const [opts, args] = cliopts.parse(
  ["production", "Run in production mode"],
  ["settings", "A JSON config file for the server", "<file>"],
  ["db", "A path to a database connection config file", "<file>"],
  ["mongoUrl", "A mongoDB connection connection string", "<url>"],
  ["mongoUrlFile", "The name of a text file which contains a mongoDB URL for the database", "<file>"],
  ["postgresUrl", "A postgresql connection connection string", "<url>"],
  ["postgresUrlFile", "The name of a text file which contains a postgresql URL for the database", "<file>"],
  ["shell", "Open an interactive shell instead of running a webserver"],
  ["command", "Run the given server shell command, then exit", "<string>"],
);

const defaultServerPort = 3000;

const getServerPort = () => {
  if (opts.command) {
    return 5001;
  }
  const port = parseInt(process.env.PORT ?? "");
  return Number.isNaN(port) ? defaultServerPort : port;
}

let latestCompletedBuildId = generateBuildId();
let inProgressBuildId = null;
const serverPort = getServerPort();
const websocketPort = serverPort + 1;

const outputDir = `build${serverPort === defaultServerPort ? "" : serverPort}`;

// Two things this script should do, that it currently doesn't:
//  * Provide a websocket server for signaling autorefresh
//  * Start a local mongodb server, if no mongo URL was provided
//      https://github.com/shelfio/jest-mongodb

const isProduction = !!opts.production;
const settingsFile = opts.settings || "settings.json"

const databaseConfig = getDatabaseConfig(opts);
process.env.MONGO_URL = databaseConfig.mongoUrl;
process.env.PG_URL = databaseConfig.postgresUrl;

if (databaseConfig.sshTunnelCommand) {
  startSshTunnel(databaseConfig.sshTunnelCommand);
}

if (isProduction) {
  process.env.NODE_ENV="production";
} else {
  process.env.NODE_ENV="development";
}

const clientBundleBanner = `/*
 * LessWrong 2.0 (client JS bundle)
 * Copyright (c) 2022 the LessWrong development team. See https://github.com/ForumMagnum/ForumMagnum
 * for source and license details.
 *
 * Includes CkEditor.
 * Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://github.com/ckeditor/ckeditor5/blob/master/LICENSE.md
 */`

const bundleDefinitions = {
  "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
  "bundleIsProduction": isProduction,
  "bundleIsTest": false,
  "bundleIsMigrations": false,
  "defaultSiteAbsoluteUrl": `\"${process.env.ROOT_URL || ""}\"`,
  "buildId": `"${latestCompletedBuildId}"`,
  "serverPort": getServerPort(),
  "ddEnv": `\"${process.env.DD_ENV || "local"}\"`,
};

const clientBundleDefinitions = {
  "bundleIsServer": false,
  "global": "window",
}

const serverBundleDefinitions = {
  "bundleIsServer": true,
  "estrellaPid": process.pid,
}

const clientOutfilePath = `./${outputDir}/client/js/bundle.js`;
build({
  entryPoints: ['./packages/lesswrong/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  sourcesContent: true,
  outfile: clientOutfilePath,
  minify: isProduction,
  banner: {
    js: clientBundleBanner,
  },
  treeShaking: "ignore-annotations",
  run: false,
  onStart: (config, changedFiles, ctx) => {
    setClientRebuildInProgress(true);
    inProgressBuildId = generateBuildId();
    config.define.buildId = `"${inProgressBuildId}"`;
  },
  onEnd: (config, buildResult, ctx) => {
    setClientRebuildInProgress(false);
    if (buildResult?.errors?.length > 0) {
      console.log("Skipping browser refresh notification because there were build errors");
    } else {
      // Creating brotli compressed version of bundle.js to save on client download size:
      const brotliOutfilePath = `${clientOutfilePath}.br`;
      // Always delete compressed version if it exists, to avoid stale files
      if (fs.existsSync(brotliOutfilePath)) {
        fs.unlinkSync(brotliOutfilePath);
      }
      if (isProduction) {
        fs.writeFileSync(brotliOutfilePath, zlib.brotliCompressSync(fs.readFileSync(clientOutfilePath, 'utf8')));
      }

      latestCompletedBuildId = inProgressBuildId;
      if (cliopts.watch) {
        initiateRefresh();
      }
    }
    inProgressBuildId = null;
  },
  define: {
    ...bundleDefinitions,
    ...clientBundleDefinitions,
  },
});

let serverCli = ["node", "-r", "source-map-support/register", "--", `./${outputDir}/server/js/serverBundle.js`, "--settings", settingsFile]
if (opts.shell)
  serverCli.push("--shell");
if (opts.command) {
  serverCli.push("--command");
  serverCli.push(opts.command);
}
if (!isProduction)
  serverCli.splice(1, 0, "--inspect");

build({
  entryPoints: ['./packages/lesswrong/server/runServer.ts'],
  bundle: true,
  outfile: `./${outputDir}/server/js/serverBundle.js`,
  platform: "node",
  sourcemap: true,
  sourcesContent: true,
  minify: false,
  run: cliopts.run && serverCli,
  onStart: (config, changedFiles, ctx) => {
    setServerRebuildInProgress(true);
  },
  onEnd: () => {
    setServerRebuildInProgress(false);
    if (cliopts.watch) {
      initiateRefresh();
    }
  },
  define: {
    ...bundleDefinitions,
    ...serverBundleDefinitions,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax", "mathjax-node", "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql", "csso", "io-ts", "fp-ts",
    "bcrypt", "node-pre-gyp", "intercom-client", "node:*",
    "fsevents", "chokidar", "auth0", "dd-trace", "pg-formatter",
    "gpt-3-encoder",
  ],
})

if (cliopts.watch && cliopts.run && !isProduction) {
  startAutoRefreshServer(websocketPort);
}
