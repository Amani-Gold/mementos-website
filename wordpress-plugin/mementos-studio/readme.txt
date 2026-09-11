=== Mementos Studio ===
Contributors: mementosstudio
Tags: album, portfolio, photography, landing page, instagram
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.7.1
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

The hero holds still while the album is being read: the section is as tall as
the number of page turns requires, so each turn gets the same amount of
scrolling however many spreads you add, and the page only moves on once the
last page has settled. Adding spreads therefore makes the hero longer rather
than making the flipping faster.

If a visitor's browser has no WebGL, or they have "reduce motion" enabled, a
still image of the first spread is shown instead and the page stays usable.

== Arabic / English ==

The header carries an **AR / EN** switch (it is in the mobile menu too). Each
language is its own address — `?lang=ar` for Arabic, the plain page for
English — so a link to either can be shared, bookmarked and found by search
engines, and a page cache can hold both without ever serving the wrong one.

Under Settings → Mementos Studio, every text field has an **Arabic box**
beneath it. The plugin ships with a starter translation of the whole page:
read it through and make it your own. A box left empty simply shows the
English on the Arabic page, so it is never blank while you work through it.

Photographs, links, the WhatsApp number and the names foiled onto the sample
album cover are shared by both languages — the foil is set in a script face
that has no Arabic letters, so those names stay as they are.

In Arabic the page is laid out right-to-left and set in Amiri and IBM Plex
Sans Arabic. The 3D album, boxes and globe are not mirrored: they read the
same either way, and flipping the canvas would flip the foil lettering too.

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

= 1.7.1 =
* Keep the hero pinned until the album has finished turning its pages. Three
  things were letting go early:
  - The section's length was a fixed 380vh however many spreads were set, so
    each page turn got whatever scrolling was left over. It is now measured
    from the number of turns, so every turn always gets the same run.
  - The album's timeline now ends at 88% of the section, and the last stretch
    is a hold with the album finished and still pinned.
  - The renderer eased towards the scroll position by a fixed fraction each
    frame, which is really a fraction per frame *rate*: on a slower device it
    fell further and further behind and was still turning pages after the
    page had moved on. It now eases against elapsed time, so it keeps the
    same unhurried feel at 60fps and catches up when frames are scarce.

  Verified by scrolling the hero with real wheel events at three speeds on
  desktop and two on a phone-sized viewport, in both languages: at the moment
  the pin releases, every page turn has completed.

= 1.7.0 =
* Arabic. An AR / EN switch in the header and the mobile menu, a full
  right-to-left layout, Arabic typefaces, and an Arabic box beside every text
  field in the settings — with a complete starter translation included. Empty
  Arabic fields fall back to the English, so the page is never half-blank.
  Each language is a real URL (`?lang=ar`), so links, bookmarks, caches and
  search engines all behave, and the two are declared to each other with
  hreflang.
* Fix the mobile menu button being unresponsive: the loading screen kept
  catching taps after it had faded out.

= 1.6.2 =
* The hero album no longer travels down the page with you. It was pinned to
  the viewport (and moved out to the end of the document to escape theme CSS),
  so it stayed under the reader after the hero had ended and painted over the
  collections. Each canvas is now anchored to its own section instead — the
  hero album is absolute inside the sticky hero, which also clips it, and the
  3D collections canvas is sticky within its own region with no net layout
  height — so each one holds still in its own space and is left behind at the
  end of its section. Page geometry is unchanged: section offsets, panel
  positions and total document height measure identically to before.

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
