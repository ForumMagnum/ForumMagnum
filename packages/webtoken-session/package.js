Package.describe({
  name: 'webtoken-session',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Provides a session object on the Vulcan.js render context.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  'jsonwebtoken': '8.0.1',
  'deepmerge': '1.2.0'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5.1');
  api.use([
    'ecmascript',
    'vulcan:lib'
  ]);
  api.mainModule('webtoken-session.js', ['server']);
});
