import appConfig from '../app.json';

/** Single source of truth — matches app.json / package.json version. */
export const APP_VERSION = appConfig.expo.version;
