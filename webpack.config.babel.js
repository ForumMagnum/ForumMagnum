import path from 'path'
import nodeExternals from 'webpack-node-externals'
import { ESBuildPlugin } from 'esbuild-loader'
import SpeedMeasurePlugin from "speed-measure-webpack-plugin"

const smp = new SpeedMeasurePlugin();


const config = smp.wrap({
  entry: './newSrc/client.js',

  output: {
    path: path.join(__dirname, 'newSrc', 'static', 'client', 'js'),
    filename: 'bundle.js'
  },

  resolve: {
    extensions: ['.mjs', '.tsx', '.ts', '.js', '.jsx']
  },

  module: {
    rules: [
      {
        test: /\.mjs/,
        loader: 'esbuild-loader',
        options: {
          target: 'chrome80'
        },
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          // disable type checker - we will use it in fork plugin
          loader: 'tsx',
          target: 'chrome80'
        }
      },
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'esbuild-loader',
        options: {
          target: 'chrome80'
        },
      }
    ]
  },
  plugins: [new ESBuildPlugin()]
})

const serverConfig = smp.wrap({
  entry: './newSrc/server.js',
  output: {
    path: path.join(__dirname, 'newSrc', 'static', 'server', 'js'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.mjs', '.tsx', '.ts', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.mjs/,
        loader: 'esbuild-loader',
        options: {
          target: 'chrome80'
        },
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          // disable type checker - we will use it in fork plugin
          loader: 'tsx',
          target: 'chrome80'
        }
      },
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'esbuild-loader',
        options: {
          target: 'chrome80'
        },
      }
    ]
  },
  target: "node",
  externals: [nodeExternals()],
  plugins: [new ESBuildPlugin()]
})

export default [config, serverConfig]
