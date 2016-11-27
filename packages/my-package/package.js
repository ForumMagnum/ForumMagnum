Package.describe({
  name: 'my-package'
});

Package.onUse(function (api) {

  api.use([
    'nova:core@0.27.4-nova',
    'nova:forms@0.27.4-nova',
    'std:accounts-ui@1.2.9',
  ]);

  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');
  
  api.addFiles('lib/style.css', 'client');

});