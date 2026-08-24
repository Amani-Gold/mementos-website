/*
 * Centralised asset map + a validating loader.
 * =========================================================================
 * Every runtime image the album work depends on is resolved here rather than
 * being hard-coded at each call site, so a path only ever has to be corrected
 * in one place, and so a missing file produces one clear diagnostic instead of
 * a silently blank surface.
 *
 * `BASE` is where the built assets live. WordPress injects it as
 * `window.MEMENTOS.assetBase` (the plugin's assets/app/ directory); the
 * standalone build falls back to Vite's base URL.
 */

const CFG = (typeof window !== 'undefined' && window.MEMENTOS) || {};
export const BASE =
  CFG.assetBase || (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';

/** Join BASE and a relative path without producing a double slash. */
const at = (p) => `${BASE}${String(p).replace(/^\/+/, '')}`;

export const ALBUM_ASSETS = {
  /** The album cutout the configurator recolours. */
  mockup: at('mockups/album-mockup-transparent.png'),
  /** Cover surfaces for the 3D hero album. */
  coverFabric: at('cover-fabric.jpg'),
  coverFoil: CFG.coverFoil || at('foil-script.png'),
  logo: CFG.logo || at('logo.svg'),
  /** Printed spreads shown on the flipping pages. */
  spreads: ['06', '03', '07', '08', '09'].map((n) => at(`Spreads/web/spread${n}.webp`)),
  /** Last-resort page artwork, so a page is never blank. */
  spreadFallback: at('Spreads/web/spread06.webp'),
  /** Material swatch thumbnails, by code (MS01…, LN01…). */
  swatch: (code) => at(`swatches/${code}.jpg`),
};

/**
 * Load an image, resolving to the element or to `null` on failure.
 *
 * Never rejects: callers are expected to degrade gracefully, and a rejected
 * promise here would just be boilerplate at every call site.
 *
 * @param {string} url
 * @param {string} label  what this image is, for the diagnostic
 * @param {boolean} cors  request CORS access (needed to use it as a WebGL
 *                        texture or to read pixels back from a canvas)
 */
export function loadImage(url, label, cors = false) {
  return new Promise((resolve) => {
    if (!url) {
      warnMissing(label, url, 'no URL configured');
      resolve(null);
      return;
    }
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      warnMissing(label, url, cors ? 'failed to load (404, or blocked by CORS)' : 'failed to load (404?)');
      resolve(null);
    };
    img.decoding = 'async';
    img.src = url;
  });
}

/**
 * Load an image for WebGL/canvas-readback use, retrying without CORS if the
 * CORS attempt fails.
 *
 * A cross-origin host that serves no `Access-Control-Allow-Origin` header will
 * reject the `crossOrigin` request outright. The retry at least lets the image
 * display where pixel access is not required, rather than losing it entirely.
 *
 * @returns {Promise<{img: HTMLImageElement|null, cors: boolean}>}
 *          `cors` reports whether the loaded image is safe for pixel access.
 */
export async function loadImageForPixels(url, label) {
  const withCors = await loadImage(url, label, true);
  if (withCors) return { img: withCors, cors: true };
  const plain = await loadImage(url, `${label} (retry without CORS)`, false);
  return { img: plain, cors: false };
}

function warnMissing(label, url, why) {
  // eslint-disable-next-line no-console
  console.error(`[Mementos] asset unavailable — ${label}: ${why}\n  ${url}`);
}

/**
 * Check every asset the page needs and report the result as a table.
 *
 * Exposed as `window.mementosCheckAssets()` so a site owner (or we) can get a
 * precise list of what is and isn't reachable from their own server, without
 * having to read a network waterfall.
 */
export async function checkAssets() {
  const targets = [
    ['Album mockup (configurator)', ALBUM_ASSETS.mockup],
    ['Cover fabric', ALBUM_ASSETS.coverFabric],
    ['Foil artwork', ALBUM_ASSETS.coverFoil],
    ['Logo', ALBUM_ASSETS.logo],
    ...(Array.isArray(CFG.spreads) && CFG.spreads.length
      ? CFG.spreads.map((s, i) => [`Spread ${i + 1} (from WordPress)`, s.img])
      : ALBUM_ASSETS.spreads.map((u, i) => [`Spread ${i + 1} (bundled)`, u])),
  ];
  const rows = await Promise.all(
    targets.map(async ([label, url]) => {
      const img = await loadImage(url, label);
      return { asset: label, ok: !!img, url };
    }),
  );
  // eslint-disable-next-line no-console
  console.table(rows);
  const bad = rows.filter((r) => !r.ok);
  // eslint-disable-next-line no-console
  console.log(
    bad.length
      ? `[Mementos] ${bad.length} of ${rows.length} assets could not be loaded (listed above).`
      : `[Mementos] all ${rows.length} assets loaded fine.`,
  );
  return rows;
}

if (typeof window !== 'undefined') window.mementosCheckAssets = checkAssets;
