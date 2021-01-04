#!/usr/bin/env node
const { build, cliopts } = require("estrella");
const fs = require('fs');

const [opts, args] = cliopts.parse(
  ["production", "Run in production mode"],
  ["settings", "A JSON config file for the server", "<file>"],
  ["mongoUrl", "A mongoDB connection connection string", "<url>"],
  ["mongoUrlFile", "The name of a text file which contains a mongoDB URL for the database", "<file>"],
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
};

build({
  entryPoints: ['./packages/lesswrong/platform/current/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: "./build/client/js/bundle.js",
  minify: isProduction,
  banner: clientBundleBanner,
  treeShaking: "ignore-annotations",
  run: false,
  define: {
    ...bundleDefinitions,
    "bundleIsServer": false,
    "global": "window",
  },
});

build({
  entryPoints: ['./packages/lesswrong/platform/current/server/serverStartup.ts'],
  bundle: true,
  outfile: './build/server/js/serverBundle.js',
  platform: "node",
  sourcemap: true,
  minify: false,
  run: cliopts.run && ["node", "-r", "source-map-support/register", "--", "./build/server/js/serverBundle.js", "--settings", settingsFile],
  onEnd: () => {
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
  ],
})

async function isServerReady() {
  // TODO
}

async function waitForServerReady() {
  // TODO
}

function initiateRefresh() {
  // TODO
}

function startWebsocketServer() {
  // TODO
}


