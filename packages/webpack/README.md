# webpack:webpack by <a href="https://thereactivestack.com">The Reactive Stack</a>
Seamlessly integrate Webpack to improve Meteor build system<br />
**Compatible with Meteor 1.2 and 1.3**

## Why should you use Webpack?
- No configuration required, you only need to add packages
- Instant feedback when you change your files (not even a page refresh!)
- Organize your assets with the code they belong
- Faster page loading by splitting your code in multiple chunks

## How can I get started?
You can learn how to use Webpack with Meteor by [getting the free course on The Reactive Stack](https://thereactivestack.com).

Many [kickstart projects are also available](https://github.com/thereactivestack/kickstart) so you can clone one that fits your needs.

Or you can start from scratch like this (this is a React / SASS example)

### Start from scratch
```sh
meteor create test-project
cd test-project
npm init # Don't forget to set the entry files in package.json (see below)
meteor remove ecmascript
meteor add webpack:webpack
meteor add webpack:react
meteor add webpack:less
meteor add react-meteor-data
meteor
npm install
meteor
```

## Entry files
Your entry files are defined within your package.json. The main is your server entry and the browser is your client entry.

```json
{
  "name": "test-project",
  "private": true,
  "main": "server/entry.js",
  "browser": "client/entry.js"
}
```

*Note: Make sure your entry point is NOT within an import folder or it would not work properly.*

## webpack.json
You can tweak your Webpack settings by using a webpack.json file in the root of your project.

- `css.modules` (bool): Use local CSS by default (default to `false`)
- `hotMiddleware.reload` (bool): Reload the page if hot reload doesn't work? (default to `false`)
- `devServer.host`: The hostname the Webpack dev server will be using
- `disableDedupePlugin` (bool): Disable the DedupePlugin (default to `false`)
- `disableOccurenceOrderPlugin` (bool): Disable the OccurenceOrderPlugin (default to `false`)
- `postcss`: Array of plugins to use
- `externals` (object): Map external modules to a global variable
- `noParse` (array of string): List the files you want Webpack to not parse (like huge libraries already built)
- ...

See your package readme for more infos on the settings available.

## .babelrc
Your .babelrc config will be automatically added to the configuration. You can add any presets, plugins or any babel config.

## Webpack packages
You can visit the package documentation for more details on the settings you can use.

### Core
- `webpack:webpack`: You need this package to use Webpack with Meteor
- [`webpack:assets`](https://atmospherejs.com/webpack/assets) (automatically added): Bundle your file and image assets by importing them (.png, .jpg, .jpeg, .svg, .ttf, .woff, .woff2, .eot)

### Framework
- [`webpack:react`](https://atmospherejs.com/webpack/react): Use React and JSX with Webpack (.js and .jsx)
- [`webpack:angular`](https://atmospherejs.com/webpack/angular): Use Angular with Webpack (.js and .import.html)
- [`webpack:vue`](https://atmospherejs.com/webpack/vue): Use Vue.js with Webpack (.js and .vue)
- `webpack:blaze` *(coming soon)*: Use Blaze with Webpack (.js and .html)

### Stylesheets
- [`webpack:css`](https://atmospherejs.com/webpack/css) (automatically added): Bundle your CSS by importing it (.import.css or .css)
- [`webpack:postcss`](https://atmospherejs.com/webpack/postcss): Support for PostCSS (.import.css or .css)
- [`webpack:sass`](https://atmospherejs.com/webpack/sass): Support for SASS (.scss and .sass)
- [`webpack:less`](https://atmospherejs.com/webpack/less): Support for LESS (.less)
- [`webpack:stylus`](https://atmospherejs.com/webpack/stylus): Support for Stylus (.styl)

### Assets
- [`webpack:json`](https://atmospherejs.com/webpack/json) (automatically added): Import a JSON files
- [`webpack:html`](https://atmospherejs.com/webpack/html): Import HTML files into a string
- [`webpack:markdown`](https://atmospherejs.com/webpack/markdown): Import Markdown files into an HTML string
- [`webpack:jade`](https://atmospherejs.com/webpack/jade): Import Jade files (.jade) into a string

### Languages
- [`webpack:typescript`](https://atmospherejs.com/webpack/typescript): Support for typescript (.ts and .tsx)
- [`webpack:coffeescript`](https://atmospherejs.com/webpack/coffeescript): Support for coffeescript (.coffee)
- [`webpack:livescript`](https://atmospherejs.com/webpack/livescript): Support for livescript (.ls)

**If you feel a package is missing and could be beneficial to the community, feel free to open an issue about it!**

## NPM packages
You can use any NPM package by using the package.json file.

To add a new dependency, run at your project root: `npm install --save module-name`.

## Production
The production mode will be automatically detected and will optimize the bundle. The production is is activated when:

- You run `meteor --production`
- You bundle your project
- You deploy with `mup deploy` or any other tool

## Startup
If you need to run code in Meteor before the startup, you can do that if you name your file `meteor.startup.js`.

Calling `FlowRouter.wait()` is a great example of things you might want to do.
