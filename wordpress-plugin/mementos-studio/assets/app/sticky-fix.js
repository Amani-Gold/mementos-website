/*
 * Keep the hero pinned on themes that break `position: sticky`.
 *
 * The album holds still while it is read because its wrapper is sticky. But
 * sticky is relative to the nearest scrolling ancestor, and an element with
 * `overflow-x: hidden` — which a great many WordPress themes put on a page
 * wrapper (or on <html>) to stop sideways scrolling — becomes exactly that:
 * the other axis computes to `auto`, the wrapper turns into a scroll
 * container, and everything sticky inside it sticks to a box that never
 * scrolls. The album then simply travels up the page with everything else,
 * still flipping as it goes.
 *
 * Two remedies, in order:
 *
 *   1. `overflow: clip` clips exactly as `hidden` does but does NOT create a
 *      scroll container, so converting the offending ancestors keeps the
 *      theme's intent and gives sticky its viewport back. Done per axis, and
 *      never against a genuinely scrollable <html>/<body>, so the page itself
 *      can always still scroll.
 *
 *   2. If anything still clips afterwards — an older browser with no `clip`,
 *      or a rule of the theme's we cannot outrank — the wrapper is pinned
 *      from JavaScript instead: fixed while the hero is on screen, absolute
 *      at either end. That covers what sticky cannot, and the two failure
 *      modes do not overlap: a transformed ancestor breaks `fixed` but leaves
 *      sticky working, and a scrolling ancestor does the reverse.
 *
 * Runs before the app module (a classic script, so it executes first) and
 * re-checks on resize, because a theme's overflow rules are often responsive.
 */
(function () {
	'use strict';

	var section = document.getElementById('albumScroll');
	if (!section) return;
	var pin = section.querySelector('.pin');
	if (!pin) return;

	var supportsClip = !!(window.CSS && CSS.supports && CSS.supports('overflow', 'clip'));
	var jsPinned = false;

	/** Every ancestor between the hero and the document that clips or scrolls. */
	function clippers() {
		var list = [];
		for (var n = section.parentElement; n; n = n.parentElement) {
			var cs = getComputedStyle(n);
			if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
				list.push({ el: n, x: cs.overflowX, y: cs.overflowY });
			}
			if (n === document.documentElement) break;
		}
		return list;
	}

	function repair() {
		clippers().forEach(function (row) {
			var isRoot = row.el === document.documentElement || row.el === document.body;
			['x', 'y'].forEach(function (axis) {
				var value = axis === 'x' ? row.x : row.y;
				if ('visible' === value || 'clip' === value) return;
				// `auto`/`scroll` on the page itself is real scrolling — never
				// take that away, or the site stops scrolling altogether.
				if (isRoot && 'hidden' !== value) return;
				row.el.style.setProperty('overflow-' + axis, supportsClip ? 'clip' : 'visible', 'important');
			});
		});
	}

	/** Anything left that still traps sticky? */
	function stillTrapped() {
		if ('sticky' !== getComputedStyle(pin).position) return true;
		return clippers().some(function (row) {
			return ( 'visible' !== row.x && 'clip' !== row.x ) || ( 'visible' !== row.y && 'clip' !== row.y );
		});
	}

	/* ------------------------------------------------------- the fallback */

	var mode = '';
	function place() {
		var r = section.getBoundingClientRect();
		var vh = window.innerHeight;
		var next = r.top > 0 ? 'before' : ( r.bottom < vh ? 'after' : 'during' );
		if (next === mode) return;
		mode = next;

		var set = function (prop, value) { pin.style.setProperty(prop, value, 'important'); };
		if ('during' === next) {
			set('position', 'fixed');
			set('top', '0');
			set('left', Math.round(r.left) + 'px');
			set('width', Math.round(r.width) + 'px');
		} else {
			set('position', 'absolute');
			set('left', '0');
			set('width', '100%');
			set('top', 'before' === next ? '0' : Math.round(section.offsetHeight - vh) + 'px');
		}
	}

	function startJsPin() {
		if (jsPinned) return;
		jsPinned = true;
		// eslint-disable-next-line no-console
		console.info('[Mementos] this theme traps position: sticky — pinning the hero from JavaScript instead.');
		mode = '';
		place();
		addEventListener('scroll', place, { passive: true });
		addEventListener('resize', function () { mode = ''; place(); });
	}

	function check() {
		repair();
		if (stillTrapped()) startJsPin();
	}

	check();
	addEventListener('resize', function () { if (!jsPinned) check(); });
	// A theme that styles late (a lazy stylesheet, a page builder) can clip
	// after we have looked, so take one more look when everything has loaded.
	addEventListener('load', function () { if (!jsPinned) check(); });
})();
