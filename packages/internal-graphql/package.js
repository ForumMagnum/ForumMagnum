Package.describe({
  name: 'internal-graphql',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Prevent extraneous HTTP connections created by Vulcan to itself.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5.1');
  api.use([
    'ecmascript',
    'vulcan:lib'
  ]);
  api.mainModule('internal-graphql.js', ['server']);
});
