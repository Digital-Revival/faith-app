const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const JDK17_CANDIDATES = [
  process.env.JDK17_HOME,
  '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
  '/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
].filter(Boolean);

function getJavaMajorVersion(javaHome) {
  const version = spawnSync(path.join(javaHome, 'bin', 'java'), ['-version'], {
    encoding: 'utf8',
  });
  const output = `${version.stderr ?? ''}${version.stdout ?? ''}`;
  const match = output.match(/version "(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function resolveJdk17Home() {
  const candidates = [process.env.JAVA_HOME, ...JDK17_CANDIDATES].filter(Boolean);

  if (process.platform === 'darwin') {
    try {
      candidates.unshift(execSync('/usr/libexec/java_home -v 17', { encoding: 'utf8' }).trim());
    } catch {
      // no JVM registered with java_home
    }
  }

  for (const candidate of [...new Set(candidates)]) {
    const javaBin = path.join(candidate, 'bin', 'java');
    if (!fs.existsSync(javaBin)) {
      continue;
    }
    if (getJavaMajorVersion(candidate) === 17) {
      return candidate;
    }
  }

  return undefined;
}

module.exports = { resolveJdk17Home, getJavaMajorVersion };
