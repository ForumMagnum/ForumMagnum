const webpack = Npm.require('webpack');
const _ = Npm.require('underscore');
const MemoryFS = Npm.require('memory-fs');

const fs = Plugin.fs;
const path = Plugin.path;

const _fs = Npm.require('fs');
const _path = Npm.require('path');
const _os = Npm.require('os');

const http = Npm.require('http');
const connect = Npm.require('connect');
const cors = Npm.require('cors');

let devServerApp = null;
let devServerMiddleware = {};
let devServerHotMiddleware = {};
let configHashes = {};
let webpackStats = null;

const CWD = _path.resolve('./');
const PROCESS_ENV = process.env;

const argv = process.argv.map(arg => arg.toLowerCase());

const IS_MAC = process.platform === 'darwin';

// Detect production mode
const IS_BUILD =
  argv.indexOf('build') >= 0 ||
  argv.indexOf('bundle') >= 0 ||
  argv.indexOf('deploy') >= 0;

const IS_TEST = argv.indexOf('test') >= 0;
const IS_FULLAPP_TEST = IS_TEST && argv.indexOf('--full-app') >= 0;

const IS_DEBUG =
  argv.indexOf('--production') < 0 &&
  (!IS_BUILD || argv.indexOf('--debug') >= 0);

WebpackCompiler = class WebpackCompiler {
  processFilesForTarget(files) {
    if (IS_TEST) {
      generateTestRunner();
    }

    files = files.filter(file => file.getPackageName() !== 'webpack:webpack');
    const packageFiles = files.filter(file => file.getPackageName() !== null);

    if (packageFiles && packageFiles.length > 0) {
      throw new Error('You cannot use the webpack compiler inside a package');
    }

    const configFiles = filterFiles(files, ['webpack.conf.js', 'webpack.config.js'])
      .filter(file => file.getPathInPackage().indexOf('node_modules') < 0);

    const platform = files[0].getArch();
    const shortName =
      (platform.indexOf('cordova') >= 0) ?
        'cordova' :
        (platform.indexOf('web') >= 0) ? 'web' : 'server';

    const entryFileName = getEntryFileName(shortName);
    let entry;
    let entryFile;

    if (IS_TEST && !IS_FULLAPP_TEST) {
      entryFile = files.find(file => /\.(spec|test)(s)?\.(.*)$/.test(file.getPathInPackage()));

      if (!entryFile) {
        return;
      }

      entry = './WebpackTestRunner.js';
    } else {
      entryFile = files.find(file => file.getPathInPackage() === entryFileName);

      if (!entryFile) {
        console.error('Cannot find the entry point "' + entryFileName + '" for the ' + shortName);
        process.exit(1);
      }

      entry = entryFile ? _path.join(CWD, entryFile.getPathInPackage()) : null;

      if (IS_FULLAPP_TEST) {
        entry = [entry, './WebpackTestRunner.js'];
      }
    }

    const settingsFiles = filterFiles(files, ['webpack.json']);
    const settings = readSettings(settingsFiles, shortName);

    let webpackConfig = {
      context: CWD,
      entry,
      module: {
        loaders: []
      },
      plugins: [],
      resolve: {
        extensions: ['']
      },
      externals: {},
      devServer: settings.devServer,
      devtool: settings.devtool
    };

    if (settings.root && typeof settings.root === 'string') {
      webpackConfig.resolve.root = _path.join(CWD, settings.root);
    }

    if (settings.resolve && settings.resolve.modules && typeof settings.resolve.modules === 'object' && Array.isArray(settings.resolve.modules)) {
      webpackConfig.resolve.modulesDirectories = settings.resolve.modules;
      webpackConfig.resolve.modules = settings.resolve.modules;
    }

    if (settings.resolve && settings.resolve.alias && typeof settings.resolve.alias === 'object' && !Array.isArray(settings.resolve.alias)) {
      
      // iterate through alias properties and resolve paths
      _.keys(settings.resolve.alias).forEach(key => {
        const absolutePath = _path.resolve(settings.resolve.alias[key]);
        console.log(settings.resolve.alias[key]);
        console.log(absolutePath);
        settings.resolve.alias[key] = absolutePath;
      });

      webpackConfig.resolve.alias = settings.resolve.alias;
    }

    if (settings.externals && typeof settings.externals === 'object' && !Array.isArray(settings.externals)) {
      webpackConfig.externals = settings.externals;
    }

    if (settings.noParse && typeof settings.noParse === 'object' && Array.isArray(settings.noParse)) {
      webpackConfig.module.noParse = new RegExp('(' + settings.noParse.join('|') + ')');
    }

    const unibuilds = files[0]._resourceSlot.packageSourceBatch.processor.unibuilds;
    settings.packages = unibuilds.map(unibuild => unibuild.pkg.name);
    generateExternals(webpackConfig, unibuilds);
    const configs = readPackageConfig(shortName, webpackConfig, unibuilds, settings);

    // Don't need to run NPM install again on mirrors
    if (!PROCESS_ENV.IS_MIRROR) {
      updateNpmPackages(shortName, configs);
    }

    configs.load();

    runWebpack(shortName, webpackConfig, entryFile, configFiles, settings);

    // Every startup.js files are sent directly to Meteor
    files.filter(file => file.getBasename() === 'meteor.startup.js').forEach(file => {
      file.addJavaScript({
        path: file.getPathInPackage(),
        data: file.getContentsAsString()
      });
    });
  }
}

function getEntryFileName(platform) {
  let name;

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(CWD, 'package.json')).toString());
    name = platform === 'server' ? pkg.main : pkg.browser || pkg.main;
  } catch(e) {
    console.error('Error in your package.json: ' + e.message);
    process.exit(1);
  }

  return name || 'index.js';
}

function readSettings(settingsFiles, platform) {
  let settings = {};

  settingsFiles.forEach(file => {
    try {
      const setting = JSON.parse(file.getContentsAsString());
      settings = _.extend(settings, setting);
    } catch(e) {
      file.error({
        message: e.message
      });
    }
  });

  settings.platform = platform;
  settings.isDebug = IS_DEBUG;
  settings.isTest = IS_TEST && !IS_FULLAPP_TEST;
  settings.isAppTest = IS_FULLAPP_TEST;

  return settings;
}

let npmPackagesCache = { web: {}, cordova: {}, server: {} };

function updateNpmPackages(target, configs) {
  // List the dependencies
  // Fix peer dependencies for webpack
  // webpack-hot-middleware is required for HMR

  let dependencies = configs.dependencies;

  let devDependencies = _.extend({
    'webpack': '^1.13.0',
    'webpack-hot-middleware': '^2.10.0'
  }, configs.devDependencies);

  let pkg = {};
  const packageFile = path.join(CWD, 'package.json');

  try {
    pkg = JSON.parse(fs.readFileSync(packageFile).toString());
  } catch(e) {
    // Do nothing if we can't read the file
  }

  if (!pkg.dependencies) {
    pkg.dependencies = {};
  }

  if (!pkg.devDependencies) {
    pkg.devDependencies = {};
  }

  let hasChanged = false;

  for (let depName in dependencies) {
    if (isNpmPackageOlder(dependencies[depName], pkg.dependencies[depName])) {
      pkg.dependencies[depName] = dependencies[depName];
      hasChanged = true;
    }
  }

  for (let depName in devDependencies) {
    if (isNpmPackageOlder(devDependencies[depName], pkg.devDependencies[depName])) {
      pkg.devDependencies[depName] = devDependencies[depName];
      hasChanged = true;
    }
  }

  if (hasChanged) {
    fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2));
    console.log('Your package.json has been updated. Please, run npm install in your project directory.')
    process.exit(1);
  }
}

function isNpmPackageOlder(depVersion, currentVersion) {
  if (!currentVersion) {
    return true;
  }

  const depVersions = depVersion.replace(/^[\^~]/, '').split('.');
  const currentVersions = currentVersion.replace(/^[\^~]/, '').split('.');

  for (let i = depVersions.length; i < 3; ++i) {
    depVersions.push('0');
  }

  for (let i = currentVersions.length; i < 3; ++i) {
    depVersions.push('0');
  }

  if (depVersions[0] > currentVersions[0]) {
    return true;
  } else if (depVersions[0] < currentVersions[0]) {
    return false;
  }

  if (depVersions[1] > currentVersions[1]) {
    return true;
  } else if (depVersions[1] < currentVersions[1]) {
    return false;
  }

  if (depVersions[2] > currentVersions[2]) {
    return true;
  } else if (depVersions[2] < currentVersions[2]) {
    return false;
  }

  return false;
}

function runWebpack(shortName, webpackConfig, entryFile, configFiles, settings) {
  configFiles.forEach(configFile => {
    const filePath = configFile.getPathInPackage();
    const data = configFile.getContentsAsString();

    readWebpackConfig(webpackConfig, shortName, configFile, filePath, data);
  });

  const usingDevServer =
    IS_DEBUG && !IS_BUILD && !IS_TEST &&
    shortName !== 'server' &&
    !PROCESS_ENV.IS_MIRROR; // Integration tests (velocity) should not use dev server

  prepareConfig(shortName, webpackConfig, usingDevServer, settings);

  if (usingDevServer) {
    compileDevServer(shortName, entryFile, configFiles, webpackConfig);
  } else {
    compile(shortName, entryFile, configFiles, webpackConfig);
  }
}

function readPackageConfig(platform, webpackConfig, unibuilds, settings) {
  let deps = {};
  let devDeps = {};
  let configs = [];

  for (let i = 0; i < unibuilds.length; ++i) {
    if (unibuilds[i].uses.find(use => use.package === 'webpack:core-config')) {
      const resource = unibuilds[i].resources.find(resource => resource.path === 'webpack.config.js');

      try {
        eval(resource.data.toString());
        const dep = dependencies(settings);
        deps = _.extend(deps, dep.dependencies);
        devDeps = _.extend(devDeps, dep.devDependencies);
        configs.push({ weight, config });
      } catch(e) {
        console.error(e);
      }
    }
  }

  configs = configs
    .sort((config1, config2) => config1.weight > config2.weight)
    .map(config => config.config);

  return {
    dependencies: deps,
    devDependencies: devDeps,
    load: () => {
      configs.forEach(config => {
        try {
          const result = config(settings, requirePolyfill);

          if (result.loaders) {
            webpackConfig.module.loaders = webpackConfig.module.loaders.concat(result.loaders);
          }

          if (result.plugins) {
            webpackConfig.plugins = webpackConfig.plugins.concat(result.plugins);
          }

          if (result.extensions) {
            webpackConfig.resolve.extensions = webpackConfig.resolve.extensions.concat(result.extensions);
          }

          // Save the configs we want to set in the webpack config directly (like postcss)
          if (result.config && typeof result.config === 'object') {
            for (let key in result.config) {
              webpackConfig[key] = result.config[key];
            }
          }

          if (result.externals) {
            for (let key in result.externals) {
              webpackConfig.externals[key] = result.externals[key];
            }
          }
        } catch(e) {
          console.error(e.stack);
        }
      });
    }
  };
}

function requirePolyfill(module) {
  if (module === 'webpack') {
    return Npm.require(module);
  }

  if (module === 'fs') {
    return _fs;
  }

  if (module === 'path') {
    return _path;
  }

  try {
    return NpmWorkaround.require(CWD + '/node_modules/' + module);
  } catch(e) {}

  return NpmWorkaround.require(module);
}

function readWebpackConfig(webpackConfig, target, file, filePath, data) {
  let module = { exports: {} };
  var fileSplit = filePath.split('/');
  fileSplit.pop();

  const __dirname = _path.join(CWD, fileSplit.join(_path.sep));
  const process = {
    env: _.assign({}, PROCESS_ENV, { 'NODE_ENV': IS_DEBUG ? 'development' : 'production' })
  };

  const require = requirePolyfill;

  const Meteor = {
    isServer: target === 'server',
    isClient: target !== 'server',
    isCordova: target === 'cordova',
    isDevelopment: IS_DEBUG,
    isProduction: !IS_DEBUG
  };

  try {
    eval(data);

    // Make sure the entry path is relative to the correct folder
    if (module.exports && !module.exports.context && module.exports.entry) {
      module.exports.context = __dirname;
    }
  } catch(e) {
    file.error({
      message: e.message
    });
  }

  webpackConfig = _.extend(webpackConfig, module.exports);
}

function prepareConfig(target, webpackConfig, usingDevServer, settings) {
  if (!webpackConfig.output) {
    webpackConfig.output = {};
  }

  if (target === 'server') {
    webpackConfig.target = 'node';
    webpackConfig.node = {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: true,
      __dirname: true
    };
  }

  if (IS_DEBUG) {
    if (target === 'server') {
      webpackConfig.devtool = webpackConfig.devtool || '#cheap-module-source-map';
    } else {
      webpackConfig.devtool = webpackConfig.devtool || '#cheap-module-eval-source-map';
    }

    if (!webpackConfig.devServer) {
      webpackConfig.devServer = {};
    }

    webpackConfig.devServer.protocol = webpackConfig.devServer.protocol || 'http:';
    webpackConfig.devServer.host = webpackConfig.devServer.host || 'localhost';
    webpackConfig.devServer.port = process.env.WEBPACK_PORT || webpackConfig.devServer.port || 3500;
  } else {
    webpackConfig.devtool = webpackConfig.devtool || '#cheap-source-map';
  }

  if (usingDevServer) {
    let options = 'path=' + webpackConfig.devServer.protocol + '//' + webpackConfig.devServer.host + ':' + webpackConfig.devServer.port + '/__webpack_hmr';

    if (webpackConfig.hotMiddleware) {
      for (let key in webpackConfig.hotMiddleware) {
        const val = webpackConfig.hotMiddleware[key];
        options += '&' + key + '=';

        if (typeof val === 'boolean') {
          options += val ? 'true' : 'false';
        } else {
          options += val;
        }
      }
    }

    webpackConfig.entry = [].concat(
      'webpack-hot-middleware/client?' + options,
      webpackConfig.entry
    );
  }

  webpackConfig.output.path = '/memory/webpack';
  webpackConfig.output.publicPath = IS_DEBUG ? webpackConfig.devServer.protocol + '//' + webpackConfig.devServer.host + ':' + webpackConfig.devServer.port + '/assets/' : '/assets/';
  webpackConfig.output.filename = target + '.js';

  if (!webpackConfig.plugins) {
    webpackConfig.plugins = [];
  }

  if (!IS_DEBUG && !settings.disableDedupePlugin) {
    webpackConfig.plugins.unshift(new webpack.optimize.DedupePlugin());
  }

  let definePlugin = {
    'process.env.NODE_ENV': JSON.stringify(IS_DEBUG ? 'development' : 'production'),
    'Meteor.isClient': JSON.stringify(target !== 'server'),
    'Meteor.isServer': JSON.stringify(target === 'server'),
    'Meteor.isCordova': JSON.stringify(target === 'cordova'),
    'Meteor.isDevelopment': JSON.stringify(IS_DEBUG),
    'Meteor.isProduction': JSON.stringify(!IS_DEBUG),
    'Meteor.isTest': JSON.stringify(IS_TEST && !IS_FULLAPP_TEST),
    'Meteor.isAppTest': JSON.stringify(IS_FULLAPP_TEST),
    'Package.meteor.Meteor.isClient': JSON.stringify(target !== 'server'),
    'Package.meteor.Meteor.isServer': JSON.stringify(target === 'server'),
    'Package.meteor.Meteor.isCordova': JSON.stringify(target === 'cordova'),
    'Package.meteor.Meteor.isProduction': JSON.stringify(!IS_DEBUG),
    'Package.meteor.Meteor.isDevelopment': JSON.stringify(IS_DEBUG),
    'Package.meteor.Meteor.isTest': JSON.stringify(IS_TEST && !IS_FULLAPP_TEST),
    'Package.meteor.Meteor.isAppTest': JSON.stringify(IS_FULLAPP_TEST)
  };

  for (let name in PROCESS_ENV) {
    if (name === 'NODE_ENV') {
      continue;
    }

    definePlugin['process.env.' + name] = JSON.stringify(PROCESS_ENV[name]);
  }

  webpackConfig.plugins.unshift(new webpack.DefinePlugin(definePlugin));

  if (!IS_DEBUG) {
    // Production optimizations
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: true
      }
    }));

    if (!settings.disableOccurenceOrderPlugin) {
      webpackConfig.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
    }
  }

  if (usingDevServer) {
    webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    webpackConfig.plugins.push(new webpack.NoErrorsPlugin());
  }
}

const compilers = {};

function compile(target, entryFile, configFiles, webpackConfig) {
  if (!configHashes[target] || _.some(configFiles, file => !configHashes[target][file.getSourceHash()])) {
    compilers[target] = new webpack(webpackConfig);
    compilers[target].outputFileSystem = new MemoryFS();

    configHashes[target] = {};
    configFiles.forEach(file => { configHashes[target][file.getSourceHash()] = true; });
  }

  const file = entryFile || configFiles[0];
  const fs = compilers[target].outputFileSystem;
  let errors = null;

  Meteor.wrapAsync(done => {
    compilers[target].run(function(err, stats) {
      if (stats) {
        if (stats.hasErrors()) {
          errors = stats.toJson({ errorDetails: true }).errors;
        }

        // Save the chunk file names in the private folder of your project
        if (target === 'web') {
          webpackStats = stats.toJson({ chunks: true });

          // Only keep what we need for code splitting
          for (var key in webpackStats) {
            if (key !== 'assetsByChunkName' && key !== 'publicPath') {
              delete webpackStats[key];
            }
          }
        }
      }

      if (err) {
        if (errors) {
          errors.unshift(err);
        } else {
          errors = [err];
        }
      }

      done();
    });
  })();

  if (errors) {
    for (let error of errors) {
      file.error({
        message: error
      });
    }
  } else {
    const outputPath = path.join(webpackConfig.output.path, webpackConfig.output.filename);
    const sourceMapPath = `/memory/webpack/${target}.js.map`;

    // We have to fix the source map until Meteor update source-map:
    // https://github.com/meteor/meteor/pull/5411

    let sourceMapData;
    let sourceMap;

    // In case the source map isn't in a file
    try {
      sourceMapData = fs.readFileSync(sourceMapPath);
    } catch(e) {}

    if (sourceMapData) {
      sourceMap = JSON.parse(sourceMapData.toString());
      WebpackSourceMapFix(sourceMap);
    }

    let data = fs.readFileSync(outputPath).toString();

    if (target === 'server') {
      data =
        'if (typeof global.jQuery === \'undefined\') { global.jQuery = {}; }\n' + // Polyfill so importing jquery in a file doesn't crash the server
        'WebpackStats = ' + JSON.stringify(webpackStats) + ';\n' + // Infos on Webpack build
        data;

      if (IS_BUILD) {
        // Copy the NPM modules you need in production for the server
        // Meteor 1.3 might fix that later ¯\_(ツ)_/¯
        data = 'global.require = ' + function(module) {
          return Npm.require(module);
        }.toString() + ';\n' + data;
      } else {
        // Polyfill the require to Meteor require
        data = 'global.require = Npm.require;\n' + data;
      }
    }

    file.addJavaScript({
      path: target + '.js',
      data,
      sourceMap
    });

    if (!IS_DEBUG && target !== 'server') {
      addAssets(target, file, fs);
    }


    if (target === 'server' && IS_BUILD) {

    }
  }
}

function addAssets(target, file, fs) {
  const assets = fs.readdirSync('/memory/webpack');

  for (let asset of assets) {
    if (asset !== target + '.js' && asset !== target + '.js.map') {
      const data = fs.readFileSync('/memory/webpack/' + asset);

      // Send CSS files to Meteor
      if (/\.css$/.test(asset)) {
        file.addStylesheet({
          path: 'assets/' + asset,
          data: data.toString()
        });
      } else {
        file.addAsset({
          path: 'assets/' + asset,
          data
        });
      }
    }
  }
}

function compileDevServer(target, entryFile, configFiles, webpackConfig) {
  if (webpackConfig.devServer) {
    const file = entryFile || configFiles[0];

    file.addJavaScript({
      path: 'webpack.conf.js',
      data: '__WebpackDevServerConfig__ = ' + JSON.stringify(webpackConfig.devServer) + ';'
    });
  }

  if (configHashes[target] && configFiles && _.every(configFiles, file => configHashes[target][file.getSourceHash()])) {
    // Webpack is already watching the files, only restart if the config has changed
    return;
  }

  configHashes[target] = {};
  configFiles.forEach(file => { configHashes[target][file.getSourceHash()] = true; });

  if (!devServerApp) {
    devServerApp = connect();
    devServerApp.use(cors());

    http.createServer(devServerApp).listen(webpackConfig.devServer.port);
  }

  if (devServerMiddleware[target]) {
    devServerMiddleware[target].close();

    devServerApp.stack.splice(
      devServerApp.stack.indexOf(devServerMiddleware[target]),
      1
    );

    devServerApp.stack.splice(
      devServerApp.stack.indexOf(devServerHotMiddleware[target]),
      1
    );
  }

  const compiler = webpack(webpackConfig);

  if (!webpackConfig.watchOptions) {
    webpackConfig.watchOptions = {};
  }

  // Temp fix for mac so CPU usage doesn't go to the roof
  // until we can ignore .meteor|node_modules folder
  // https://github.com/webpack/watchpack/issues/2
  if (IS_MAC) {
    if (typeof webpackConfig.watchOptions.poll === 'undefined') {
      webpackConfig.watchOptions.poll = 1000;
    }
  }

  devServerMiddleware[target] = Npm.require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath,
    stats: { colors: true },
    watchOptions: webpackConfig.watchOptions
  });

  devServerHotMiddleware[target] = Npm.require('webpack-hot-middleware')(compiler);

  devServerApp.use(devServerMiddleware[target]);
  devServerApp.use(devServerHotMiddleware[target]);
}

function filterFiles(files, names) {
  return files
    .filter(file => names.indexOf(file.getBasename()) >= 0)
    // Sort by shallower files
    .sort((file1, file2) => file1.getPathInPackage().split('/').length - file2.getPathInPackage().split('/').length);
}

function generateExternals(webpackConfig, isobuilds) {
  webpackConfig.externals = webpackConfig.externals || {};

  // Support import from Meteor packages
  for (let i = 0; i < isobuilds.length; ++i) {
    const { declaredExports } = isobuilds[i];
    webpackConfig.externals['meteor/' + isobuilds[i].pkg.name] = 'Package[\'' + isobuilds[i].pkg.name + '\']';
  }
}

function generateTestRunner() {
  // This makes sure we don't go through big folders like .meteor and node_modules
  const directories = _fs.readdirSync(CWD).filter(file =>
    file[0] !== '.' &&
    file !== 'packages' &&
    file !== 'node_modules' &&
    file !== 'bower_components' &&
    _fs.statSync(_path.join(CWD, file)).isDirectory()
  );

  _fs.writeFileSync(_path.join(CWD, 'WebpackTestRunner.js'), `// This file is auto-generated
// Any change will be overriden
const ignoreTarget = Meteor.isServer ? 'client' : 'server';

let testFiles = [];

if (Meteor.isAppTest) {
${directories.map(directory => `  testFiles = testFiles.concat(require.context('./${directory}', true, /\.(test|spec|app-test|app-spec)(s)?\.(.+)$/i).keys()).map(file => './${directory}' + file.substr(1));\n`).join('')}} else {
${directories.map(directory => `  testFiles = testFiles.concat(require.context('./${directory}', true, /\.(test|spec)(s)?\.(.+)$/i).keys()).map(file => './${directory}' + file.substr(1));\n`).join('')}}

testFiles
  .filter(file => file.indexOf('/' + ignoreTarget + '/') < 0)
  .map(file => require(file));
`);
}
