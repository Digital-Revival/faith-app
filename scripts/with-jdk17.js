#!/usr/bin/env node
/**
 * Runs a command with JAVA_HOME set to JDK 17.
 * React Native Android native builds fail on JDK 24+ (restricted System::load).
 */
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
  const candidates = [
    process.env.JAVA_HOME,
    ...JDK17_CANDIDATES,
  ].filter(Boolean);

  try {
    candidates.unshift(execSync('/usr/libexec/java_home -v 17', { encoding: 'utf8' }).trim());
  } catch {
    // no JVM registered with java_home
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

  console.error(
    'JDK 17 is required for Android builds. Install it with: brew install openjdk@17',
  );
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error('Usage: node scripts/with-jdk17.js <command> [args...]');
  process.exit(1);
}

const javaHome = resolveJdk17Home();
const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: { ...process.env, JAVA_HOME: javaHome },
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
