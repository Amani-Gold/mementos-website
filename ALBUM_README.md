# Album Experience — scroll-driven layflat page-flip

`album-experience.html` is a self-contained, dependency-free page that renders the
Mementos Studio album opening + turning its layflat spreads as you scroll. It is a
rebuild of the previous broken 3D flip, based on the **stable flip logic** proven in
the reference brand-film sample.

## How it works

- **Pure-CSS pin** — a tall `.album-scroll` wrapper holds a `position: sticky` stage,
  so the album stays centred in the viewport while its scroll distance drives the
  animation. No GSAP / ScrollTrigger / Three.js required.
- **Scroll → progress** — the sticky pin's travel is normalised to `p ∈ [0,1]`,
  smoothed with a `requestAnimationFrame` lerp for buttery scrubbing.
- **3D mechanics (ported from the sample):**
  - Cover: full-width, hinged at the far-left spine (`transform-origin: 0% 50%`),
    `rotateY 0 → -168°`; leather front + endpaper back via `backface-visibility`.
  - Turning leaf: right half, hinged at the centre spine, `rotateY 0 → -180°`;
    front = current spread's right half, back = next spread's left half.
  - Half-spread rendering: each 2:1 image is shown via `background-position:left/right`.
  - Page-thickness stack, gutter shadow, gold inner frame, vignette, light sweep,
    and the sage page-block edge from the real albums.
- **Timeline:** phase 0 opens the cover; each following phase turns one page, with a
  short hold so every spread can be read. Everything scales to the number of spreads.

## Swapping in your own album

Edit the `SPREADS` array near the bottom of the file. Each entry is a **full 2:1 open
spread** (left page + right page in one image) plus its caption:

```js
var SPREADS = [
  { img: "path/to/spread-01.jpg", cap: "Before everything began" },
  ...
];
```

The cover title / date live in the `.cover .front` markup.

## Embedding in the WordPress site

- Simplest: drop the file on the server and embed with an `<iframe>`, or paste the
  `<style>` + markup + `<script>` into a **Custom HTML** block. Fonts load from Google
  Fonts; the rest is inline.
- Images: the committed spreads are the full-res originals (~2 MB each). For production,
  export web-optimised versions (≈1600–1800px wide WebP/JPEG) and point `BASE`/`SPREADS`
  at them, and add `<link rel="preload">` for the first spread.

## Finish picker (Chamois / Linen)

The "Choose your cover material" section recolours a **professionally-matted album
cutout** live per swatch. The cutout + editable-zone masks were delivered as an AI
handoff package (see `deliverables/album-mockup-ai-handoff.json`):

- **Base:** `mockups/album-mockup-transparent.png` — a clean, anti-aliased transparent
  cutout (1254×1254). It **floats natively** from its own alpha; the page does no
  in-browser background removal.
- **Recolour zones:** the three delivered masks — `deliverables/mask-front-cover.png`,
  `mask-spine.png`, `mask-back-lower-cover-edge.png` — are unioned into a zone map. A
  pixel recolours only if it's opaque album **and** inside a zone (so the top cover,
  spine and lower cover edge all change together; deepest seams `luma < 0.40` are kept).
- **Tint:** a **luminance-preserving hue swap** — each zone pixel keeps its brightness
  (weave, shadow gradient, edge softness) and only its hue/saturation becomes the swatch's
  sampled average colour, re-centred on the swatch lightness.
- **Foil:** the delivered cover is blank, so "Aysha & Alfonse / Oct 4, 2024" is drawn
  onto the canvas **on top of** the recoloured cover (so it always stays gold), mapped
  into the front-cover plane (`FA/FB/FD` corners) in **Pinyon Script** (vendored at
  `assets/pinyon-script.ttf`, also linked via Google Fonts).
- Swatches are the real material photos (`Chamois/MS01–MS20`, `Linen/LN01–LN06`);
  their average colour is sampled at load and used as the recolour target.

To use a different cutout, replace `mockups/album-mockup-transparent.png` and update the
zone masks + the `FA/FB/FD` foil-plane corners (from the handoff JSON's zone polygons).

## Accessibility / fallback

If JavaScript is unavailable the album renders flat (first spread visible under the
cover). `prefers-reduced-motion` disables the scroll cue animation; the flip itself is
scroll-position driven, so it never auto-plays.
