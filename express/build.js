const esbuild = require("esbuild");

const isProduction = false;

const clientBundleBanner = `/*
 * LessWrong 2.0 (client JS bundle)
 * Copyright (c) 2020 the LessWrong development team. See http://github.com/LessWrong2/Lesswrong2
 * for source and license details.
 *
 * Includes CkEditor.
 * Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see https://github.com/ckeditor/ckeditor5/blob/master/LICENSE.md
 */`

esbuild.buildSync({
  entryPoints: ['./src/platform/current/server/serverStartup.ts'],
  bundle: true,
  outfile: './build/server/js/serverBundle.js',
  platform: "node",
  sourcemap: true,
  minify: false,
  define: {
    "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
    "webpackIsServer": true,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax", "mathjax-node", "mathjax-node-page", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql",
    "bcrypt", "node-pre-gyp", "@lesswrong", "intercom-client",
  ],
})

esbuild.buildSync({
  entryPoints: ['./src/platform/current/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: "./build/client/js/bundle.js",
  minify: isProduction,
  banner: clientBundleBanner,
  treeShaking: "ignore-annotations",
  define: {
    "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
    "webpackIsServer": false,
    "global": "window",
  },
});

