const path = require('path')
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const meteorExternals = require('webpack-meteor-externals');
const nodeExternals = require('webpack-node-externals')
require('babel-polyfill')

const resolve_client = {
  'vulcan:accounts': path.resolve(__dirname,'./imports/vulcan-accounts/main_client'),
  'vulcan:admin': path.resolve(__dirname,'./imports/vulcan-admin/lib/client/main'),
  'vulcan:core': path.resolve(__dirname,'./imports/vulcan-core/lib/client/main'),
  'vulcan:debug': path.resolve(__dirname,'./imports/vulcan-debug/lib/client/main'),
  'vulcan:email': path.resolve(__dirname,'./imports/vulcan-email/lib/client'),
  'vulcan:events': path.resolve(__dirname,'./imports/vulcan-events/lib/client/main'),
  'vulcan:forms': path.resolve(__dirname,'./imports/vulcan-forms/lib/client/main'),
  'vulcan:i18n': path.resolve(__dirname,'./imports/vulcan-i18n/lib/client/main'),
  'vulcan:i18n-en-us': path.resolve(__dirname,'./imports/vulcan-i18n-en-us/lib/en_US'),
  'vulcan:lib': path.resolve(__dirname, './imports/vulcan-lib/lib/client/main'),
  'vulcan:routing': path.resolve(__dirname,'./imports/vulcan-routing/lib/modules'),
  'vulcan:ui-bootstrap': path.resolve(__dirname,'./imports/vulcan-ui-bootstrap/lib/client/main'),
  'vulcan:users': path.resolve(__dirname,'./imports/vulcan-users/lib/client/main'),
}

const resolve_server = {
  'vulcan:accounts': path.resolve(__dirname,'./imports/vulcan-accounts/main_server'),
  'vulcan:admin': path.resolve(__dirname,'./imports/vulcan-admin/lib/server/main'),
  'vulcan:core': path.resolve(__dirname,'./imports/vulcan-core/lib/server/main'),
  'vulcan:debug': path.resolve(__dirname,'./imports/vulcan-debug/lib/server/main'),
  'vulcan:email': path.resolve(__dirname,'./imports/vulcan-email/lib/server'),
  'vulcan:events': path.resolve(__dirname,'./imports/vulcan-events/lib/server/main'),
  'vulcan:forms': path.resolve(__dirname,'./imports/vulcan-forms/lib/server/main'),
  'vulcan:i18n': path.resolve(__dirname,'./imports/vulcan-i18n/lib/server/main'),
  'vulcan:i18n-en-us': path.resolve(__dirname,'./imports/vulcan-i18n-en-us/lib/en_US'),
  'vulcan:lib': path.resolve(__dirname, './imports/vulcan-lib/lib/server/main'),
  'vulcan:routing': path.resolve(__dirname,'./imports/vulcan-routing/lib/server/main'),
  'vulcan:ui-bootstrap': path.resolve(__dirname,'./imports/vulcan-ui-bootstrap/lib/server/main'),
  'vulcan:users': path.resolve(__dirname,'./imports/vulcan-users/lib/server/main'),
}

const clientConfig = {
  entry: './imports/vulcan-core/client/start.jsx',
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        include: /imports/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'], 
            plugins: ["@babel/plugin-proposal-optional-chaining", "@babel/plugin-proposal-class-properties"]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // {
      //   test: /\.mjs$/,
      //   include: /node_modules/,
      //   type: "javascript/auto",
      // }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './main.html'
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    alias: resolve_client,
    extensions: [".webpack.js", ".web.js", ".mjs", ".js", ".jsx", ".json"]
  },
  externals: [
    meteorExternals()
  ],
  node: {
    fs: 'empty'
  },
  devServer: {
    hot: true
  }
};

const serverConfig = {
  entry: [
    './imports/src/server.js'
  ], 
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        include: /imports/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'], 
            plugins: ["@babel/plugin-proposal-optional-chaining", "@babel/plugin-proposal-class-properties"]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // {
      //   test: /\.mjs$/,
      //   include: /node_modules/,
      //   type: "javascript/auto",
      // }
    ]
  },
  target: 'node',
  devServer: {
    hot: true
  },
  resolve: {
    alias: resolve_server,
    extensions: [".webpack.js", ".web.js", ".mjs", ".js", ".jsx", ".json"]
  },
  node: {
    fs: 'empty'
  },
  externals: [
    { 
      canvas: "commonjs canvas"
    },
    meteorExternals(),
    nodeExternals(), // in order to ignore all modules in node_modules folder
    {
      formidable: 'commonjs formidable',
    },
    
  ]
};

module.exports = [clientConfig, serverConfig];