# 1.0.0

## Migration from 0.4 to 1.0
Your project will be automatically migrated to 1.0 the first time you run your project. This should help you set your new package.json file.

## Automatically generate your Webpack config

The biggest roadblock for beginners to use Webpack has always been the complicated webpack.config.js file that you need to setup. While this is giving you a perfect flexibility, it is way too complex for newcomers and also 99% of the projects.

Now, instead of writing that complex file, all you need is to add the appropriate package to support your technology. You are using React? Add the `webpack:react` package to your project. You want to use SASS? Add the `webpack:sass` package. And so on.

All of those packages also come with the ability to configure them with a webpack.json file in the root directory of your project. You want to use local CSS by default? Set `css.module` to `true`. See the documentation of your package to learn more about the settings you can use.

## Using a regular package.json

In the previous versions, you had to download your NPM packages by using a special file (`webpack.packages.json`). Now, you can download them through a regular package.json file and run `npm install` yourself.

## Entry files
Your entry file for your server and client is within your package.json file. The server is the main file and the client is the browser file. Here is an example:

```json
{
  "name": "kickstart-simple",
  "private": true,
  "main": "server/entry.js",
  "browser": "client/entry.js",
  "dependencies": {
    "react": "~0.14.1",
    "react-mixin": "^3.0.3"
  },
  "devDependencies": {
    "webpack": "^1.12.9",
    "webpack-hot-middleware": "^2.4.1",
    "babel-loader": "^6.2.0",
    "babel-preset-react": "^6.3.13",
    "babel-preset-es2015": "^6.3.13",
    "babel-preset-stage-0": "^6.3.13",
    "babel-plugin-transform-decorators-legacy": "^1.3.2",
    "babel-plugin-react-transform": "2.0.0-beta1",
    "react-transform-hmr": "^1.0.1",
    "react-transform-catch-errors": "^1.0.0",
    "redbox-react": "^1.2.0",
    "style-loader": "^0.13.0",
    "css-loader": "^0.23.0",
    "extract-text-webpack-plugin": "^0.9.1",
    "url-loader": "^0.5.7",
    "file-loader": "^0.8.5"
  }
}
```

# 0.4.0

## Externals generated from Meteor package

You don't need to write the externals for your Meteor package. They are now generated.

When you are adding a package like `react-router`, you had to make sure `import ReactRouter from 'react-router';` was going to use the same version as your Meteor packages. To do that, you had to tell him for the package `react-router`, use the global variable ReactRouter. This is also true for React and a lot of other libraries. This makes sure it doesn't get loaded twice. Now, this is done for you!
