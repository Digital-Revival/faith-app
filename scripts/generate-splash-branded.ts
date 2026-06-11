import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BRANDED_LOGO_HEIGHT,
  BRANDED_LOGO_WIDTH,
  BRANDED_SLOGAN_FONT_SIZE,
  BRANDED_SLOGAN_LETTER_SPACING,
  BRANDED_SLOGAN_LINE_HEIGHT,
  BRANDED_BOTTOM_SPACER_BELOW_SPINNER,
  BRANDED_SPLASH_REFERENCE_HEIGHT_PTS,
  BRANDED_SPLASH_REFERENCE_WIDTH_PTS,
  BRANDED_SPLASH_NATIVE_EXPORT_SCALE,
  BRANDED_SPINNER_SIZE,
  STATIC_SPLASH_BOTTOM_PADDING_PTS,
  brandedSplashBottomBlockHeightPts,
} from '../constants/brandedSplashLayout';
import {
  DOTTED_RING_DOT_SIZE,
  getDottedRingDotCentersInLocalSpace,
} from '../constants/dottedRing';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const require = createRequire(import.meta.url);

interface SplashAssets {
  logoBase64: string;
  fontBase64: string;
  sloganLines: [string, string, string];
}

function loadSplashAssets(): SplashAssets {
  const locales = JSON.parse(
    readFileSync(join(root, 'i18n/locales/en.json'), 'utf8'),
  ) as {
    splash: { sloganLine1: string; sloganLine2: string; sloganLine3: string };
  };
  const logoBuf = readFileSync(join(root, 'assets/images/logo_full.png'));
  const fontPath = require.resolve(
    '@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf',
  );
  const fontBuf = readFileSync(fontPath);
  return {
    logoBase64: logoBuf.toString('base64'),
    fontBase64: fontBuf.toString('base64'),
    sloganLines: [
      locales.splash.sloganLine1,
      locales.splash.sloganLine2,
      locales.splash.sloganLine3,
    ],
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(assets: SplashAssets): string {
  const scale = BRANDED_SPLASH_NATIVE_EXPORT_SCALE;
  const W = BRANDED_SPLASH_REFERENCE_WIDTH_PTS * scale;
  const H = BRANDED_SPLASH_REFERENCE_HEIGHT_PTS * scale;
  const paddingBottom = STATIC_SPLASH_BOTTOM_PADDING_PTS * scale;
  const innerH = H - paddingBottom;
  const bottomBlockH = brandedSplashBottomBlockHeightPts() * scale;
  const centerBlockH = innerH - bottomBlockH;
  const logoW = BRANDED_LOGO_WIDTH * scale;
  const logoH = BRANDED_LOGO_HEIGHT * scale;
  const logoX = (W - logoW) / 2;
  const logoY = (centerBlockH - logoH) / 2;

  const spinnerSize = BRANDED_SPINNER_SIZE * scale;
  const spinnerX = (W - spinnerSize) / 2;
  const spinnerY = centerBlockH;
  const gapBelowSpinner = BRANDED_BOTTOM_SPACER_BELOW_SPINNER * scale;

  const dotCenters = getDottedRingDotCentersInLocalSpace(scale);
  const dotRadius = (DOTTED_RING_DOT_SIZE * scale) / 2;
  const dotsSvg = dotCenters
    .map(
      ({ cx, cy, opacity }) =>
        `<circle cx="${(spinnerX + cx).toFixed(2)}" cy="${(spinnerY + cy).toFixed(2)}" r="${dotRadius}" fill="#FFFFFF" fill-opacity="${opacity}"/>`,
    )
    .join('\n');

  const lineHeight = BRANDED_SLOGAN_LINE_HEIGHT * scale;
  const fontSize = BRANDED_SLOGAN_FONT_SIZE * scale;
  const letterSpacing = BRANDED_SLOGAN_LETTER_SPACING * scale;
  const sloganBlockTop = spinnerY + spinnerSize + gapBelowSpinner;
  const sloganX = W / 2;
  const firstLineCenterY = sloganBlockTop + lineHeight / 2;

  const sloganTextsXml = assets.sloganLines
    .map(
      (line, i) => `  <text
    x="${sloganX}"
    y="${firstLineCenterY + lineHeight * i}"
    text-anchor="middle"
    dominant-baseline="middle"
    fill="#FFFFFF"
    font-family="Poppins, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    letter-spacing="${letterSpacing}"
  >${escapeXml(line)}</text>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style type="text/css"><![CDATA[
      @font-face {
        font-family: 'Poppins';
        src: url('data:font/ttf;base64,${assets.fontBase64}') format('truetype');
        font-weight: 700;
        font-style: normal;
      }
    ]]></style>
  </defs>
  <rect width="100%" height="100%" fill="#000000"/>
  <image href="data:image/png;base64,${assets.logoBase64}" x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>
  ${dotsSvg}
${sloganTextsXml}
</svg>`;
}

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    console.error(
      'sharp is required for generate:splash. Install locally: npm install -D sharp',
    );
    process.exit(1);
  }
}

async function renderPng(svg: string, outPath: string): Promise<void> {
  const sharp = await loadSharp();
  await sharp(Buffer.from(svg))
    .flatten({ background: '#000000' })
    .png()
    .toFile(outPath);
}

async function main(): Promise<void> {
  const assets = loadSplashAssets();
  const svg = buildSvg(assets);
  const outPath = join(root, 'assets/images/splash_branded.png');
  await renderPng(svg, outPath);
  console.log('Wrote', outPath);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
