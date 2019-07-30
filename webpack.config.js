const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const meteorExternals = require('webpack-meteor-externals');

const clientConfig = {
  entry: './src/client.js',
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        include: /src/,
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
    './src/server.js'
  ], 
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        include: /src/,
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
    extensions: [".webpack.js", ".web.js", ".mjs", ".js", ".jsx", ".json"]
  },
  node: {
    fs: 'empty'
  },
  externals: [
    {canvas: {} },
    meteorExternals()
  ]
};

module.exports = [clientConfig, serverConfig];