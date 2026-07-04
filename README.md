# Mementos Studio — album experience

A self-contained, premium light-mode web experience for the Mementos Studio wedding
album, built to embed into the existing WordPress site.

## The deliverable

**[`album-experience.html`](album-experience.html)** — one dependency-free page with:

1. **Layflat page-flip** — a scroll-driven 3D album that opens its cover and turns its
   spreads as you scroll (pure CSS 3D + a sticky pin; no GSAP/Three.js). Adapted from the
   reference brand-film sample's proven flip logic.
2. **Finish picker ("Choose your cover material")** — a professionally-matted, floating
   album cutout that recolours live per swatch. Tapping any **Chamois** (`MS01–MS20`) or
   **Linen** (`LN01–LN06`) material retints the whole cover fabric — top, spine and every
   edge — with a luminance-preserving hue swap that keeps the weave, shadows and edge
   softness; the white page block stays natural and the gold **"Aysha & Alfonse"** foil
   stays gold on top.

See **[`ALBUM_README.md`](ALBUM_README.md)** for implementation detail, how to swap in a
different album/cutout, and embedding notes.

## Assets

| Folder | Contents |
|--------|----------|
| `Spreads/` | Full 2:1 open-book spreads used by the flip |
| `Chamois/`, `Linen/` | Real material swatch photos (recolour targets) |
| `Collections/` | Product / packaging mockups |
| `mockups/` | `album-mockup-transparent.png` — the finish-picker cutout base |
| `deliverables/` | AI handoff package (transparent cutout, zone masks, JSON) |
| `assets/` | `pinyon-script.ttf` — vendored foil script font |

## Preview / verify locally

Serve the repo root over HTTP and open `album-experience.html` (it references assets by
relative path), e.g.:

```bash
python3 -m http.server 8000    # then visit http://localhost:8000/album-experience.html
```

## Embedding in WordPress

Host the file and its assets, then embed via an `<iframe>`, or paste the markup + inline
`<style>`/`<script>` into a **Custom HTML** block. Fonts load from Google Fonts with the
Pinyon Script foil font also vendored locally as a fallback.
