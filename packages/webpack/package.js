Package.describe({
    name: 'webpack:webpack',
    version: '1.3.3',
    summary: 'Seamlessly integrate Webpack to improve Meteor build system',
    git: 'https://github.com/thereactivestack/meteor-webpack.git',
    documentation: 'README.md'
});

Package.registerBuildPlugin({
    name: 'webpack:webpack',
    use: [
      'meteor',
      'ecmascript@0.1.5',
      'webpack:npmworkaround@1.0.0'
    ],
    sources: [
      'plugin/WebpackSourceMapFix.js',
      'plugin/WebpackCompiler.js',
      'plugin/webpack-plugin.js'
    ],
    npmDependencies: {
      'underscore': '1.8.3',
      'connect': '3.4.1',
      'cors': '2.7.1',
      'webpack': '1.13.0',
      'webpack-dev-middleware': '1.6.1',
      'webpack-hot-middleware': '2.10.0',
      'memory-fs': '0.3.0',
      'mime': '1.3.4'
    }
});

Package.onUse(function(api) {
    api.versionsFrom('1.3');

    api.use('isobuild:compiler-plugin@1.0.0');
    api.use('webpack:reload@1.0.1');

    api.use('webpack:assets@1.0.1');
    api.use('webpack:css@1.1.1');
    api.use('webpack:json@1.0.1');

    // Meteor polyfill for ecmascript and Promise
    api.imply('ecmascript-runtime@0.2.6');
    api.imply('promise@0.5.1');
});
