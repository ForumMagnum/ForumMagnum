// Used by jest, ignored by esbuild
module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-env',
    '@babel/preset-typescript',
  ],
  plugins: [
    "@babel/plugin-transform-react-jsx",
    "@babel/plugin-proposal-class-properties"
  ]
};

