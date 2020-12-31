Package.describe({
  name: "lesswrong",
  summary: "The Lesswrong forum software",
  version: "2.0.0"
});

Package.onUse( function(api) {

  api.versionsFrom("METEOR@1.0");

  api.use([
    'ecmascript',
    'typescript',
    'promise',
    'fourseven:scss@4.12.0',
    
    // dependencies of vulcan-accounts
    'tracker',
    'accounts-base',
    'check',
    'random',
    'email',
    'session',
    'service-configuration',
    
    // dependencies of vulcan-lib
    'meteor@1.9.0',
    'es5-shim@4.8.0',
    'shell-server@0.3.1',
    'webapp@1.6.0',
    'server-render@0.3.1',
    
    'underscore',
    'hot-code-push',
    'mongo',
    'http',
    'meteorhacks:picker@1.0.3',
  ]);
  
  // dependencies of vulcan-accounts
  api.use('accounts-oauth', { weak: true });
  api.use('accounts-password', { weak: true });

  api.mainModule('client.js', 'client');
  api.mainModule('server.js', 'server');

  api.addFiles([
    'styles/main.scss',
  ], ['client']);

  Npm.depends({
    "@babel/core": "7.7.7",
  })
});

Package.onTest(function(api) {
  api.use('lesswrong');

  api.use([
    'typescript',
    'fourseven:scss',
    'practicalmeteor:sinon',
    'meteortesting:mocha',
  ]);

  Npm.depends({
    "@babel/core": "7.7.7",
  })
  // Entry points for tests
  api.mainModule('./testing/client.tests.ts', 'client');
  api.mainModule('./testing/server.tests.ts', 'server');
})
