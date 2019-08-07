Package.describe({
  name: "lesswrong",
  summary: "Lesswrong extensions and customizations package",
  version: "0.1.0"
});

Package.onUse( function(api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'ecmascript',
    'promise',
    'fourseven:scss',

    // vulcan core
    'vulcan:core',

    // vulcan packages
    'vulcan:accounts',
    'vulcan:forms',
    'vulcan:events',
    'vulcan:admin',
    'vulcan:users',
  ]);

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.addFiles([
    'styles/main.scss',
  ], ['client']);

  Npm.depends({
    "@babel/core": "7.4.3",
    "@babel/plugin-proposal-optional-chaining": "7.2.0",
    "@babel/plugin-syntax-optional-chaining": "7.2.0"
  })
});

Package.onTest(function(api) {
  api.use('lesswrong');

  api.use([
    'fourseven:scss',
    'vulcan:core',
    'vulcan:users',
    'practicalmeteor:sinon',
    'coffeescript',
    'meteortesting:mocha',
  ]);

  Npm.depends({
    "@babel/core": "7.4.3",
    "@babel/plugin-proposal-optional-chaining": "7.2.0",
    "@babel/plugin-syntax-optional-chaining": "7.2.0"
  })
  // Entry points for tests
  api.mainModule('./testing/client.tests.js', 'client');
  api.mainModule('./testing/server.tests.js', 'server');
})
