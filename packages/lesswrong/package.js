Package.describe({
  name: "lesswrong",
  summary: "Lesswrong extensions and customizations package",
  version: "0.1.0"
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
    'littledata:synced-cron@1.1.0',
    'meteorhacks:inject-initial@1.0.4',
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
    "@babel/plugin-proposal-optional-chaining": "7.2.0",
    "@babel/plugin-syntax-optional-chaining": "7.2.0"
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
    "@babel/plugin-proposal-optional-chaining": "7.2.0",
    "@babel/plugin-syntax-optional-chaining": "7.2.0"
  })
  // Entry points for tests
  api.mainModule('./testing/client.tests.ts', 'client');
  api.mainModule('./testing/server.tests.ts', 'server');
})
