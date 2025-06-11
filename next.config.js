module.exports = {
  experimental: {
    forceSwcTransforms: true,
  },
  webpack: function (config, options) {
    config.experiments = { asyncWebAssembly: true, layers: true };
    config.module.rules.push({
      test: /\.html$/,
      use: 'html-loader'
    });
    return config;
  },
}