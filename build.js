#!/usr/bin/env node
const { build, cliopts } = require("estrella");
const fs = require('fs');
const WebSocket = require('ws');
const fetch = require("node-fetch");
const crypto = require('crypto');

let latestCompletedBuildId = generateBuildId();
let inProgressBuildId = null;
let clientRebuildInProgress = false;
let serverRebuildInProgress = false;
const serverPort = 3000;
const websocketPort = 3001;

const [opts, args] = cliopts.parse(
  ["production", "Run in production mode"],
  ["settings", "A JSON config file for the server", "<file>"],
  ["mongoUrl", "A mongoDB connection connection string", "<url>"],
  ["mongoUrlFile", "The name of a text file which contains a mongoDB URL for the database", "<file>"],
  ["postgresUrl", "A postgresql connection connection string", "<url>"],
  ["postgresUrlFile", "The name of a text file which contains a postgresql URL for the database", "<file>"],
  ["shell", "Open an interactive shell instead of running a webserver"],
);

// Two things this script should do, that it currently doesn't:
//  * Provide a websocket server for signaling autorefresh
//  * Start a local mongodb server, if no mongo URL was provided
//      https://github.com/shelfio/jest-mongodb

const isProduction = !!opts.production;
const settingsFile = opts.settings || "settings.json"

if (isProduction) {
  process.env.NODE_ENV="production";
} else {
  process.env.NODE_ENV="development";
}
if (opts.mongoUrl) {
  process.env.MONGO_URL = opts.mongoUrl;
} else if (opts.mongoUrlFile) {
  try {
    process.env.MONGO_URL = fs.readFileSync(opts.mongoUrlFile, 'utf8').trim();
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}
if (opts.postgresUrl) {
  process.env.PG_URL = opts.postgresUrl;
} else if (opts.postgresUrlFile) {
  try {
    process.env.PG_URL = fs.readFileSync(opts.postgresUrlFile, 'utf8').trim();
  } catch(e) {
    console.log(e);
    process.exit(1);
  }
}

const clientBundleBanner = `/*
 * LessWrong 2.0 (client JS bundle)
 * Copyright (c) 2020 the LessWrong development team. See http://github.com/LessWrong2/Lesswrong2
 * for source and license details.
 *
 * Includes CkEditor.
 * Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://github.com/ckeditor/ckeditor5/blob/master/LICENSE.md
 */`

const bundleDefinitions = {
  "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
  "bundleIsProduction": isProduction,
  "bundleIsTest": false,
  "defaultSiteAbsoluteUrl": `\"${process.env.ROOT_URL || ""}\"`,
  "buildId": `"${latestCompletedBuildId}"`,
};

build({
  entryPoints: ['./packages/lesswrong/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: "./build/client/js/bundle.js",
  minify: isProduction,
  banner: clientBundleBanner,
  treeShaking: "ignore-annotations",
  run: false,
  onStart: (config, changedFiles, ctx, esbuildOptions) => {
    clientRebuildInProgress = true;
    inProgressBuildId = generateBuildId();
    esbuildOptions.define.buildId = `"${inProgressBuildId}"`;
  },
  onEnd: (config, buildResult, ctx) => {
    clientRebuildInProgress = false;
    if (buildResult?.errors?.length > 0) {
      console.log("Skipping browser refresh notification because there were build errors");
    } else {
      latestCompletedBuildId = inProgressBuildId;
      initiateRefresh();
    }
    inProgressBuildId = null;
  },
  define: {
    ...bundleDefinitions,
    "bundleIsServer": false,
    "global": "window",
  },
});

let serverCli = ["node", "-r", "source-map-support/register", "--", "./build/server/js/serverBundle.js", "--settings", settingsFile]
if (opts.shell)
  serverCli.push("--shell");

build({
  entryPoints: ['./packages/lesswrong/server/serverStartup.ts'],
  bundle: true,
  outfile: './build/server/js/serverBundle.js',
  platform: "node",
  sourcemap: true,
  minify: false,
  run: cliopts.run && serverCli,
  onStart: (config, changedFiles, ctx, esbuildOptions) => {
    serverRebuildInProgress = true;
  },
  onEnd: () => {
    serverRebuildInProgress = false;
    initiateRefresh();
  },
  define: {
    ...bundleDefinitions,
    "bundleIsServer": true,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax", "mathjax-node", "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql",
    "bcrypt", "node-pre-gyp", "@lesswrong", "intercom-client",
    "fsevents", "chokidar",
  ],
})

const openWebsocketConnections = [];

async function isServerReady() {
  try {
    const response = await fetch(`http://localhost:${serverPort}/robots.txt`);
    return response.ok;
  } catch(e) {
    return false;
  }
}

async function waitForServerReady() {
  while (!(await isServerReady())) {
    await asyncSleep(100);
  }
}

async function asyncSleep(durationMs) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), durationMs);
  });
}

function generateBuildId() {
  return crypto.randomBytes(12).toString('base64');
}

let refreshIsPending = false;
async function initiateRefresh() {
  if (!cliopts.watch) {
    return;
  }
  if (refreshIsPending || clientRebuildInProgress || serverRebuildInProgress) {
    return;
  }
  
  if (openWebsocketConnections.length > 0) {
    refreshIsPending = true;
    console.log("Initiated refresh; waiting for server to be ready");
    await waitForServerReady();
    console.log("Notifying connected browser windows to refresh");
    for (let connection of openWebsocketConnections) {
      connection.send(`{"latestBuildId": "${latestCompletedBuildId}"}`);
    }
    refreshIsPending = false;
  }
}

function startWebsocketServer() {
  const server = new WebSocket.Server({
    port: websocketPort,
  });
  server.on('connection', (ws) => {
    openWebsocketConnections.push(ws);
    
    ws.on('message', (data) => {
    });
    ws.on('close', function close() {
      const connectionIndex = openWebsocketConnections.indexOf(ws);
      if (connectionIndex >= 0) {
        openWebsocketConnections.splice(connectionIndex, 1);
      }
    });
    ws.send(`{"latestBuildId": "${latestCompletedBuildId}"}`);
  });
}

if (cliopts.watch && cliopts.run && !isProduction) {
  startWebsocketServer();
}

