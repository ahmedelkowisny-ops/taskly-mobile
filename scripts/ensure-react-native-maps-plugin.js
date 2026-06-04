const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, '..', 'node_modules', 'react-native-maps', 'app.plugin.js');

const pluginSource = `const { AndroidConfig, IOSConfig, withInfoPlist, withPlugins } = require('@expo/config-plugins');
const resolveFrom = require('resolve-from');

const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

const withDefaultLocationPermissions = (config) => {
  const isLinked =
    !config._internal?.autolinkedModules ||
    config._internal.autolinkedModules.includes('react-native-maps');

  if (
    config._internal?.projectRoot &&
    resolveFrom.silent(config._internal.projectRoot, 'react-native-maps') &&
    isLinked
  ) {
    config = withInfoPlist(config, (config) => {
      config.modResults.NSLocationWhenInUseUsageDescription =
        config.modResults.NSLocationWhenInUseUsageDescription || LOCATION_USAGE;
      return config;
    });

    return AndroidConfig.Permissions.withPermissions(config, [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ]);
  }

  return config;
};

module.exports = (config) =>
  withPlugins(config, [
    AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey,
    IOSConfig.Maps.withMaps,
    withDefaultLocationPermissions,
  ]);
`;

if (!fs.existsSync(path.dirname(pluginPath))) {
  process.exit(0);
}

const current = fs.existsSync(pluginPath) ? fs.readFileSync(pluginPath, 'utf8') : '';
if (current !== pluginSource) {
  fs.writeFileSync(pluginPath, pluginSource);
}
