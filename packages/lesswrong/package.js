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
    'vulcan:voting',
    'vulcan:accounts',
    'vulcan:email',
    'vulcan:forms',
    'vulcan:events',
    'vulcan:embed',
    'vulcan:admin',
    'vulcan:users',
    'vulcan:voting',
  ]);

  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');

  api.addFiles([
    'styles/main.scss',
  ], ['client']);

  api.addAssets([
    'server/emails/templates/newPost.handlebars',
    'server/emails/templates/wrapper.handlebars',
  ], ['server']);
});

Package.onTest(function(api) {
  api.use('lesswrong');

  api.use([
    'fourseven:scss',
    'vulcan:core',
    'vulcan:users',
    'vulcan:voting',
    'practicalmeteor:sinon',
    'coffeescript',
    'meteortesting:mocha',
  ]);
  // Entry points for tests
  api.mainModule('./testing/client.tests.js', 'client');
  api.mainModule('./testing/server.tests.js', 'server');
})
