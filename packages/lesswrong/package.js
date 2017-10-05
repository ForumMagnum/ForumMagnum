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
    'practicalmeteor:mocha',
    'practicalmeteor:sinon',
  ]);

  // Finally add an entry point for tests
  api.mainModule('./unitTests.js', 'client');
})
