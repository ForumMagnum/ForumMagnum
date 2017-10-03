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

});

Package.onTest(function(api) {
  // You almost definitely want to depend on the package itself,
  // this is what you are testing!
  api.use('lesswrong');
  // You should also include any packages you need to use in the test code
  api.use([
    'fourseven:scss',
    'vulcan:core',
    'example-forum',
    'vulcan:users',
    'vulcan:voting',
  ]);
  // Finally add an entry point for tests
  api.mainModule('./components/comments/comments.app-tests.js', 'client');
});
