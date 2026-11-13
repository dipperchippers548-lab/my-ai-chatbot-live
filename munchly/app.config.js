// Extends app.json. Preview builds (EXPO_PUBLIC_PREVIEW_MODE=1) export the web app as one static
// page with no server and no lazily loaded screens, so it can be shared as a single link.
// Regular builds keep the /api/analyze server route.
module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_PREVIEW_MODE !== '1') return config;
  return {
    ...config,
    web: { ...config.web, output: 'single' },
    plugins: config.plugins.map((p) => (p === 'expo-router' ? ['expo-router', { asyncRoutes: false }] : p)),
  };
};
