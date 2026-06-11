const { withGradleProperties } = require('@expo/config-plugins');

const JDK17_PATHS = [
  '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
  '/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
];

/**
 * Pins Gradle to JDK 17 when a local install is found.
 * JDK 24+ breaks React Native native CMake configuration on Android.
 */
function withJdk17Gradle(config) {
  return withGradleProperties(config, (config) => {
    const fs = require('fs');
    const existing = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.java.home',
    );

    if (existing) {
      return config;
    }

    const javaHome = JDK17_PATHS.find((candidate) =>
      fs.existsSync(`${candidate}/bin/java`),
    );

    if (javaHome) {
      config.modResults.push({
        type: 'property',
        key: 'org.gradle.java.home',
        value: javaHome,
      });
    }

    return config;
  });
}

module.exports = withJdk17Gradle;
