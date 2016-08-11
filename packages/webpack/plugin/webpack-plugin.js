Plugin.registerCompiler({
  extensions: [
    'import.css', // Ignore CSS files that are going to be bundled with components
    'import.html', // So that you can import html files and still use static-html / blaze packages
    'js', 'jsx', 'ts', 'tsx', 'coffee', 'ls', 'vue' // watch JavaScript, CoffeeScript, LiveScript and TypeScript files
  ],
  filenames: [
    'webpack.json',
    'webpack.conf.js',
    'webpack.config.js',
    'webpack.packages.json'
  ]
}, () => new WebpackCompiler());
