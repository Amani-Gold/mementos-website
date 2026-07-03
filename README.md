# Mementos Studio — Cinematic 3D Scroll Site

A light-mode, scroll-driven product film for **Mementos Studio**, a handcrafted
linen photo-album & print studio. The album is a real-time 3D object that opens,
flips through pages, and lays flat as you scroll — built with **Three.js** (PBR
materials, soft studio lighting, metallic foil) and **GSAP ScrollTrigger**.

## Status — complete (15 sections)

The full cinematic scroll is in place:

1. Hero — closed linen album, gold-foil names
2. Opening — cover lifts about the spine
3. Page-flipping — flexible draping layflat pages, real spreads
4. Print close-up
5. Layflat panorama
6. Closing — finished-album beauty
7. Chamois — interactive swatches (MS01–MS20)
8. Linen — interactive swatches (LN01–LN06)
9. Foiling — gold / silver / black
10. Collections — Standard, Luxury, Sliding, Pocket
11. Slide-in — acrylic sheet slides to reveal the album
12. Packaging — Luxury wood plate opens to the album
13. Mailer — branded shipping box folds shut
14. Worldwide — textured Earth with gold shipping arcs
15. CTA — the finished album returns

Material colours are sampled from the Mementos Studio references; boxes are
built to the real collection constructions.

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
