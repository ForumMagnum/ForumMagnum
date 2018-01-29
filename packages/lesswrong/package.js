Package.describe({
  name: "lesswrong",
  summary: "Lesswrong extensions and customizations package",
  version: "0.1.0"
});

Package.onUse( function(api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'fourseven:scss',
    'vulcan:core',
    'example-forum',
    'vulcan:users',
    'vulcan:voting',
  ]);

  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');

  api.addFiles([
    'styles/main.scss',
  ], ['client']);

  api.addAssets([
    'assets/Logo.png',
  ], ['client']);
});

Package.onTest(function(api) {
  api.use('lesswrong');

  api.use([
    'fourseven:scss',
    'vulcan:core',
    'example-forum',
    'vulcan:users',
    'vulcan:voting',
    'practicalmeteor:sinon',
    'coffeescript',
    'practicalmeteor:mocha',
  ]);
  // Entry points for tests
  api.mainModule('./testing/unit.tests.js', 'client');
  api.mainModule('./testing/server.tests.js', 'server');
})
