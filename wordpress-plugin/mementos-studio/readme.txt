=== Mementos Studio ===
Contributors: mementosstudio
Tags: album, portfolio, photography, landing page, instagram
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.8.0
License: GPLv2 or later

The Mementos Studio luxury homepage: a scroll-driven 3D flipping-album hero, a
live material and foil configurator, the collections in 3D, branded packaging
and a live Instagram feed — with every photo and text editable from the
WordPress admin.

== Installation ==

1. In WP Admin go to Plugins → Add New → Upload Plugin, choose
   `mementos-studio.zip`, install and activate.
2. Create a new Page (e.g. "Home"). Use a **Blank / Full-width** page template
   from your theme so the theme header/footer and content width don't interfere.
3. Add the shortcode `[mementos_studio]` to the page (or insert the
   "Mementos Studio" block), and publish.
4. Edit content under **Settings → Mementos Studio** — every section, photo and
   text is editable, plus contact details.

== Set as homepage ==

At the top of Settings → Mementos Studio there is a **"Use this as my
homepage"** tick box. Tick it and save to make WordPress show this page first,
without visiting Settings → Reading yourself:

* If a page with the `[mementos_studio]` shortcode already exists, that page
  is used.
* If none exists yet, a published page titled "Home" is created for you with
  the shortcode already in it.

Untick and save to hand the front page back to whatever it was set to before
you ticked the box.

== Your logo ==

Under Settings → Mementos Studio → General & Contact there is a **Logo mark**
field. Upload your logo (square, transparent SVG or PNG) and it is used
verbatim in three places at once:

* the site header,
* the loading screen and the closing call-to-action,
* and printed onto the 3D shipping mailer in the "Packed with care" section.

SVG is recommended — it stays sharp at every size, including where it is
printed onto the 3D packaging. A transparent PNG of 1024x1024 or larger also
works. The plugin ships with a stand-in mark; replacing it here swaps it
everywhere, with no code changes.

== The hero album ==

The hero is a real 3D album rendered with WebGL: a rigid cover with true board
thickness, a visible page block, a spine that is the hinge, and pages that turn
one at a time as you scroll. Under Settings → Mementos Studio → Hero you can
set the cover names and swap the **spread photos** — these are loaded as
textures, so your own photographs appear on the turning pages.

If a visitor's browser has no WebGL, or they have "reduce motion" enabled, a
still image of the first spread is shown instead and the page stays usable.

== The Arabic page ==

Arabic is a page of its own, so your English homepage is not altered in any
way — it carries no language switch and loads nothing extra.

1. Create a new page (call it "العربية", or anything you like).
2. Put the shortcode `[mementos_studio_ar]` on it and publish.
3. Add that page to your menu.

It renders the same homepage right-to-left, set in Amiri and IBM Plex Sans
Arabic, with a small **EN** link back to your English homepage. (Point that
link somewhere else with the "English homepage URL" field under General &
Contact.)

Under Settings → Mementos Studio every text field has an **Arabic** box
beneath it, and the plugin ships with a starter translation of the whole page.
Read it through and make it your own. A box left empty shows the English on
the Arabic page instead, so it is never half-blank while you work through it.

Photographs, links, the WhatsApp number and the names foiled onto the sample
album cover are shared by both pages — the foil is set in a script face that
has no Arabic letters, so those names stay as they are. The 3D album, boxes
and globe are not mirrored either: they read the same in both languages, and
flipping the canvas would flip the foil lettering with it.

== Instagram (live feed) ==

Under Settings → Mementos Studio → General & Contact, paste an Instagram Basic
Display **long-lived access token**:

1. Create an app at https://developers.facebook.com/ and add the
   "Instagram Basic Display" product.
2. Add your Instagram account as a tester and generate a long-lived token.
3. Paste the token into the plugin. The feed is cached for one hour and the
   token is auto-refreshed daily.

If no token is set (or the API fails), the "Fallback images" you set under the
Instagram tab are shown instead.

== Notes ==

* The "Collections in 3D" boxes and the shipping mailer are built procedurally
  with WebGL (Three.js), so their construction is defined in code rather than
  swapped as photos. The collection *cards* above them are normal, editable
  photos, and the mailer's printed wording is editable.
* Best viewed on a page with no competing theme chrome (blank/full-width).

== Changelog ==

= 1.8.0 =
* Built on 1.6.0/1.6.1 — deliberately without the scroll-pinning changes from
  1.6.2 to 1.7.1, which did not suit this site's theme.
* An Arabic edition on its own page, via the `[mementos_studio_ar]` shortcode:
  right-to-left layout, Arabic typefaces, an EN link back, and an Arabic box
  beside every text field in the settings, with a full starter translation.
  Empty Arabic fields fall back to the English. The English homepage is
  untouched: no switch, no extra stylesheet, and the same markup as before.
* The closing call to action's first button is now **Order from Shop** and
  goes to the shop; both the label and the link are editable under Final CTA.
  The mobile menu's button still opens WhatsApp.
* **Become a Partner** now opens the photographer registration page; the link
  is editable under For Photographers.

= 1.6.1 =
* Fix the homepage behaving differently inside WordPress than in the
  standalone site: blank album pages, the album not flipping or sitting in the
  wrong place, the world/globe scene missing, and "album image not found" in
  the material and foil live preview.

  All of it had one cause. The filter that turned our app script into an ES
  module rebuilt the whole `<script>` block from scratch, and since WordPress
  6.3 that block also contains the `window.MEMENTOS = {…}` configuration added
  with wp_add_inline_script(). The configuration was therefore deleted before
  it ever reached the browser, and with no asset base URL the app looked for
  every spread, texture, swatch, mockup and the world map next to the page's
  own address, where nothing exists. The filter now only adds type="module" to
  the loader element and leaves the rest of the block untouched, and the
  configuration is also printed alongside the markup as a second, independent
  copy so an optimisation or caching plugin cannot strip it.
* The stylesheet is enqueued during wp_enqueue_scripts when the page uses the
  shortcode or block, so it lands in <head> instead of after the markup — the
  sections are no longer laid out and measured for scroll pinning while still
  unstyled.
* Sites that saved their content under an earlier release keep that saved copy
  for ever, so a 3D scroll panel added later never appeared — the "Delivered
  anywhere" world panel among them. Missing panels are now appended from the
  defaults; wording you have edited is left exactly as it is.

  No feature, layout, wording or asset was changed.

= 1.4.0 =
* Roll the front end back to the 1.2.0 build. The 1.3.0 rework of the asset
  loading stopped the hero album appearing at all on some hosts and pushed the
  material/foil preview into its simplified drawn mode; this release restores
  the 1.2.0 behaviour exactly. The version number is raised (rather than
  reissued as 1.2.0) so browser and CDN caches fetch the restored files.

= 1.2.0 =
* Harden the hero/collections canvases against theme CSS that overrides
  `position`, `inset`, or `z-index` (not just transformed ancestors) — they
  now re-assert their required styles with `!important`, verified against a
  simulated theme that resets `position: static !important` on everything
  and one that targets the canvas directly with competing `!important` rules.

= 1.1.0 =
* Escape theme wrappers that trapped the hero/collections canvases or
  squeezed the layout to a boxed width on themes without a blank template.
* If a spread photo or the cover fabric fails to load (wrong path, or a host
  serving media from a different, CORS-blocked origin), the affected page or
  cover now shows a plain warm-paper colour instead of rendering solid black.
* "Use this as my homepage" tick option under Settings → Mementos Studio.
* Real foil artwork, corrected page-flip orientation, branded packaging, and
  an editable "Logo mark" field — see the full notes above.

= 1.0.0 =
* Initial release.
