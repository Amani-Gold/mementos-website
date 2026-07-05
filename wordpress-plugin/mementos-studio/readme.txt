=== Mementos Studio ===
Contributors: mementosstudio
Tags: album, portfolio, photography, landing page, instagram
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

The Mementos Studio luxury homepage: a scroll-driven 3D flipping-album hero, a
live material configurator, collections, gallery and a live Instagram feed —
with every photo and text editable from the WordPress admin.

== Installation ==

1. In WP Admin go to Plugins → Add New → Upload Plugin, choose
   `mementos-studio.zip`, install and activate.
2. Create a new Page (e.g. "Home"). Use a **Blank / Full-width** page template
   from your theme so the theme header/footer and content width don't interfere.
3. Add the shortcode `[mementos_studio]` to the page (or insert the
   "Mementos Studio" block), and publish. Optionally set it as your front page
   under Settings → Reading.
4. Edit content under **Settings → Mementos Studio** — every section, photo and
   text is editable, plus contact details.

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

* The "Collections in 3D" boxes are rendered procedurally with WebGL (Three.js),
  so their look is styled in code rather than swapped as photos. The collection
  *cards* above them are normal, editable photos.
* Best viewed on a page with no competing theme chrome (blank/full-width).

== Changelog ==

= 1.0.0 =
* Initial release.
