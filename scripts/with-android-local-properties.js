const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const LOCAL_PROPERTIES_CONTENT = 'sdk.dir=C:\\\\Users\\\\ahmed\\\\AppData\\\\Local\\\\Android\\\\Sdk\n';

function writeAndroidLocalProperties(projectRoot) {
  const androidDir = path.join(projectRoot, 'android');
  fs.mkdirSync(androidDir, { recursive: true });
  fs.writeFileSync(path.join(androidDir, 'local.properties'), LOCAL_PROPERTIES_CONTENT);
}

module.exports = function withAndroidLocalProperties(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      writeAndroidLocalProperties(config.modRequest.projectRoot);
      return config;
    },
  ]);
};

module.exports.writeAndroidLocalProperties = writeAndroidLocalProperties;
