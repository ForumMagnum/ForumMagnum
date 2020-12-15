const esbuild = require("esbuild");

const isProduction = false;

esbuild.buildSync({
  entryPoints: ['./src/platform/current/server/serverStartup.ts'],
  bundle: true,
  outfile: './build/server/js/bundle2.js',
  platform: "node",
  sourcemap: true,
  minify: false,
  define: {
    "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
    "webpackIsServer": true,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax", "mathjax-node", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql",
    "bcrypt", "node-pre-gyp", "@lesswrong",
  ],
})

esbuild.buildSync({
  entryPoints: ['./src/platform/current/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: "./build/client/js/bundle.js",
  minify: false,
  define: {
    "process.env.NODE_ENV": isProduction ? "\"production\"" : "\"development\"",
    "webpackIsServer": false,
    "global": "window",
  },
});

