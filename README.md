# Mementos Studio — Homepage

A light / cream luxury homepage for **Mementos Studio**, a handcrafted linen &
chamois photo-album studio (Bahrain). It merges two earlier prototypes into one
production homepage:

- **Hero album flip + finish picker** — a dependency-free, scroll-pinned CSS-3D
  album that opens its cover and turns real photo spreads, plus a live `<canvas>`
  finish picker that recolours a real album cutout. Ported from branch
  `album-page-flip-animation-qrgpu8`.
- **3D collections** — the collection **box models** (Standard, Luxury, Sliding,
  Pocket), a shipping mailer and a worldwide globe, rendered with **Three.js** and
  driven by **GSAP ScrollTrigger**. From branch `mementos-studio-3d-luxury-f1ri93`.

The DOM album owns the hero; the WebGL canvas is scoped to the "Collections in 3D"
region (it fades in there and pauses otherwise), so the two experiences never
fight. The whole page degrades gracefully — copy, photos and navigation work with
no WebGL and no external fonts.

## Sections

Sticky nav + mobile drawer · Hero flip album (with "The Story" rail) · Trust strip
· Signature Collections (real photos: Standard, Luxury, Sliding, Pocket) ·
Collections in 3D · Materials & finish picker (Chamois / Linen / Foil) ·
Craftsmanship · For Photographers · Process · Gallery (lightbox) · Testimonials +
stats · Instagram strip · Final CTA · Footer · Floating WhatsApp button.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## Where to edit common things

- **Contact links** (WhatsApp number, email, Instagram): the `CONTACT` object at
  the top of `src/main.js`. All `[data-wa]`, `[data-mail]`, `[data-ig]` links are
  wired from it.
- **Collection card photos**: `index.html` (`.collections__grid`), pointing at
  `public/Collections/…` (source photos are also in `Collections/`).
- **Album flip spreads**: `SPREADS` in `src/album/flipAlbum.js` (`public/Spreads/web/*.webp`).
- **Swatch colours** (material + foil): `src/data/swatches.js`.

## Structure

```
index.html                 full homepage markup
src/
  main.js                  boot: homepage interactions + scoped WebGL region
  styles.css               light/cream design system + album chrome + all sections
  album/flipAlbum.js       CSS flip album + canvas finish/foil picker (branch 1)
  data/swatches.js         Chamois / Linen / Foil swatch colours
  scene/Stage.js           Three.js renderer, camera, studio lighting
  objects/{Album,Boxes,WorldMap}.js   procedural album, collection boxes, globe
  materials/textures.js    procedural linen, foil, page edges
  scroll/journey.js        maps scroll progress -> camera + box/mailer/globe state
public/                    served static assets (Collections, Spreads/web, mockups, spreads, details)
```

## Art direction

Warm white / cream / sand / champagne, deep-brown text, gold accents. Cormorant
Garamond display over Jost / Inter body; Pinyon Script for the foil names. Grain
overlay, soft studio light, slow luxury motion (respects `prefers-reduced-motion`).
