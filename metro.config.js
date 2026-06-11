const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;

let config = getDefaultConfig(projectRoot);
config.resolver.sourceExts.push('mjs');
delete config.watcher?.unstable_workerThreads;

config = withNativeWind(config, { input: './global.css' });

const navigationEventsNavigationShim = path.resolve(
  projectRoot,
  'scripts/shims/expo-router-navigation-events-navigation.js',
);

const expoRouterNavigationEventsNavigation = path.resolve(
  projectRoot,
  'node_modules/expo-router/build/navigationEvents/navigation.js',
);

const nativeWindResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath ?? '';

  if (
    moduleName === './navigationEvents/navigation' &&
    origin.endsWith('expo-router/build/ExpoRoot.js')
  ) {
    return { filePath: navigationEventsNavigationShim, type: 'sourceFile' };
  }

  const result = nativeWindResolveRequest(context, moduleName, platform);

  if (
    result?.type === 'sourceFile' &&
    result.filePath === expoRouterNavigationEventsNavigation
  ) {
    return { filePath: navigationEventsNavigationShim, type: 'sourceFile' };
  }

  return result;
};

module.exports = config;
