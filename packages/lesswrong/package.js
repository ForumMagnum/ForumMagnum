Package.describe({
  name: "lesswrong",
  summary: "Lesswrong extensions and customizations package",
  version: "0.1.0"
});

Package.onUse( function(api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'promise',
    'fourseven:scss',

    // vulcan core
    'vulcan:core',

    // vulcan packages
    'vulcan:accounts',
    'vulcan:forms',
    'vulcan:events',
    'vulcan:embed',
    'vulcan:admin',
    'vulcan:users',
    'vulcan:routing',
  ]);

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.addFiles([
    'styles/main.scss',
  ], ['client']);
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
  // Entry points for tests
  api.mainModule('./testing/client.tests.js', 'client');
  api.mainModule('./testing/server.tests.js', 'server');
})
