// GitHub Pages serves the site from /<repo>/; the deploy workflow sets BASE_URL. Locally it stays at "/".
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.BASE_URL || '' },
});
