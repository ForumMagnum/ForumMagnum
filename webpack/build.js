const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ['./src/platform/current/server/serverStartup.ts'],
  bundle: true,
  outfile: './build/server/js/bundle2.js',
  platform: "node",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": "\"development\"",
    "webpackIsServer": true,
  },
  external: [
    "akismet-api", "mongodb", "canvas", "express", "mz", "pg", "pg-promise",
    "mathjax-node", "jsdom", "@sentry/node", "node-fetch", "later", "turndown",
    "apollo-server", "apollo-server-express", "graphql",
  ],
})

esbuild.buildSync({
  entryPoints: ['./src/platform/current/client/clientStartup.ts'],
  bundle: true,
  target: "es6",
  sourcemap: true,
  outfile: "./build/client/js/bundle.js",
  define: {
    "process.env.NODE_ENV": "\"development\"",
    "webpackIsServer": false,
    "global": "window",
  },
});

