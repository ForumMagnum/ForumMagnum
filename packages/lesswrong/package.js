Package.describe({
  name: 'lesswrong',
  summary: 'Lesswrong extensions and customizations package',
  version: '0.2.0'
})

Package.onUse(api => {
  api.versionsFrom('METEOR@1.0')

  api.use([
    'fourseven:scss',
    'vulcan:core',
    'example-forum',
    'vulcan:users',
    'vulcan:voting'
  ])

  api.mainModule('server.js', 'server')
  api.mainModule('client.js', 'client')

  api.addFiles([
    'styles/main.scss'
  ], ['client'])

  api.addAssets([
    'assets/Logo.png'
  ], ['client'])
})
