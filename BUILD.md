# Build Guide

How to create and submit builds for Faith Generation.

## Prerequisites

- [EAS CLI](https://docs.expo.dev/build/setup/) installed: `npm install -g eas-cli`
- Expo account (paid plan for EAS Build)
- Apple Developer account (for iOS)
- Project linked to EAS: `eas init` (if not already done)

## Version management

The app version lives in **app.json** (`expo.version`). It is synced to `package.json` and `VERSION.md`.

### Version scripts

| Script | What it does |
|--------|--------------|
| `npm run version:sync` | Sync app.json → package.json, VERSION.md |
| `npm run version:sync-to-app` | Sync package.json → app.json, VERSION.md |
| `npm run version:bump:patch` | Bump patch (2.0.0 → 2.0.1) |
| `npm run version:bump:minor` | Bump minor (2.0.0 → 2.1.0) |
| `npm run version:bump:major` | Bump major (2.0.0 → 3.0.0) |

Before each EAS build, `version:sync` runs automatically via `eas-build-pre-install`.

### Build numbers

Build numbers (iOS `CFBundleVersion`, Android `versionCode`) are managed **remotely on EAS** (`appVersionSource: remote` in eas.json). They are **not** in `app.json` — EAS auto-increments on each production/testflight build without changing your repo.

**iOS** — sync remote counter with App Store Connect (once after switching to remote):

```bash
npm run version:set:ios
# or: eas build:version:sync -p ios -e testflight
```

**Android** — seed remote counter to match Google Play (required after Expo account / project migration):

EAS keeps a separate remote counter per project. If Play Store already has `versionCode` 31 but EAS shows `4 → 5`, you must set it manually:

```bash
npm run version:set:android
```

When prompted for **versionCode**, enter the **last value already published in Play Console** (e.g. `31`).  
The **next** production build will auto-increment to `32` and use that in the AAB.

> Do not enter the *next* number — `autoIncrement` adds 1 at build time.

Only commit when you bump the **app version** (`expo.version`, e.g. 2.0.1 → 2.0.2). Never commit after a build just for build numbers.

## Creating a TestFlight build

### 1. Bump the version (if releasing)

```bash
npm run version:bump:patch
```

Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes.

### 2. Run the build

```bash
npm run build:ios
```

This will:

1. Run `version:sync` (ensures app.json, package.json, VERSION.md match)
2. Build the iOS app on EAS
3. Submit to TestFlight when the build finishes

### 3. Wait for processing

- Build typically takes 10–20 minutes
- After upload, TestFlight processing can take another 5–15 minutes
- Internal testers can install once processing is done

## Build scripts

| Script | Description |
|--------|-------------|
| `npm run build:ios` | iOS TestFlight build + auto-submit |
| `npm run build:testflight` | Same as build:ios |
| `npm run build:android` | Android preview build (internal APK) |
| `npm run build:preview` | iOS + Android preview builds |

## EAS configuration

- **eas.json** – Build and submit profiles
- **testflight** profile – Extends production, submits to TestFlight only (not App Store)
- **production** profile – For when you release to the App Store

## Environment variables for builds

EAS builds need Supabase (and optionally other) env vars. Add them as EAS secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
eas secret:create --name EXPO_PUBLIC_STORYBLOK_ACCESS_TOKEN --value "your-token"
eas secret:create --name EXPO_PUBLIC_VIMEO_ACCESS_TOKEN --value "your-token"
```

List existing secrets:

```bash
eas secret:list
```

## Credentials

First-time setup or if credentials expire:

```bash
eas credentials --platform ios
```

Choose the `testflight` profile and let EAS manage credentials, or use your own.

## Troubleshooting

- **Bundle identifier mismatch** – Ensure `app.json` has `ios.bundleIdentifier: "com.tt.faithGeneration"` (must match App Store Connect)
- **Android versionCode too low (4→5 while Play has 31)** – Remote counter is from an old Expo project. Run `npm run version:set:android`, enter `31` (last published). Next build uses `32`.
- **Build number already used** – Run `npm run version:set:android` or `npm run version:set:ios` to realign the remote counter with the store.
- **Invalid provisioning profile** – Run `eas credentials --platform ios` and regenerate
