# Mementos Studio — Cinematic 3D Scroll Site

A light-mode, scroll-driven product film for **Mementos Studio**, a handcrafted
linen photo-album & print studio. The album is a real-time 3D object that opens,
flips through pages, and lays flat as you scroll — built with **Three.js** (PBR
materials, soft studio lighting, metallic foil) and **GSAP ScrollTrigger**.

## Status

**Milestone 1 (complete):** the continuous core — Hero → Cover opening →
Flexible page-flipping → Print close-up → Layflat panorama.

Planned next:
- Milestone 2: Closing · Chamois · Linen · Foiling (gold/silver/black)
- Milestone 3: Box collections · Album→box · Gift packaging · Mailer · World map · CTA

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
npm run preview  # preview the build
```

## Structure

```
src/
  main.js               app bootstrap + master scroll timeline
  scene/Stage.js        renderer, camera, studio environment & lighting
  objects/Album.js      procedural square album: cover, page block, flip leaves
  materials/textures.js procedural linen, metallic foil, page edges, spreads
  scroll/journey.js     maps scroll progress -> camera framing + album state
  styles.css            light-mode luxury UI
scripts/shoot.mjs       headless-Chromium screenshot harness for QA
```

## Art direction

Warm white / ivory / sand / champagne, deep-brown text, minimal gold accents.
Elegant serif headlines (Cormorant Garamond) over clean sans body (Inter).
Materials and proportions are matched to the Mementos Studio reference renders;
the references inform the 3D, they are never shown as flat images.
