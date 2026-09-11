/**
 * Pin a canvas inside its own section, and keep it there.
 *
 * Two jobs at once:
 *
 * 1. Containment. A canvas fixed to the *viewport* stays under the reader for
 *    the whole page: it slides down past the end of its own section and paints
 *    over whatever comes next. Anchoring each canvas to its section instead
 *    means it holds still while that section is on screen and is left behind
 *    at its end, which is what the scroll choreography was always meant to do.
 *
 *      - `absolute` for a canvas inside an already-sticky `.pin` wrapper: the
 *        wrapper does the pinning and clips it (`overflow: hidden`).
 *      - `sticky` for a canvas that is itself the first child of a tall
 *        section, with a negative bottom margin so it takes up no layout space
 *        and the panels after it scroll over the top.
 *
 *    Neither is affected by the transformed-ancestor problem that breaks
 *    `position: fixed` under some themes and page builders — an absolute or
 *    sticky box is positioned against its own ancestor chain either way — so
 *    the element can stay where the markup puts it rather than being moved to
 *    <body>.
 *
 * 2. Winning the specificity fight. A theme rule that strips or overrides
 *    `position`, `display`, `inset` or `z-index` would break the pin, so the
 *    structural properties are re-asserted as `!important` inline styles,
 *    which beat any external rule.
 *
 * `display: block` matters: a <canvas> is inline by default, so in flow it
 * sits on a line box and the baseline leading adds a stray gap (~19px) above
 * the section's content. Blockifying it keeps the layout identical to the old
 * fixed-position behaviour.
 *
 * Deliberately leaves opacity/visibility untouched: the fade in/out is still
 * driven by the `.is-visible` class toggle in styles.css.
 *
 * @param {HTMLElement} el      the canvas to pin
 * @param {number} zIndex       must match the element's stylesheet z-index
 * @param {'absolute'|'sticky'} mode  how it is anchored to its section
 */
export function pinToViewport(el, zIndex, mode = 'absolute') {
  const set = (prop, val) => el.style.setProperty(prop, val, 'important');
  set('display', 'block');
  set('width', '100%');
  set('z-index', String(zIndex));
  set('pointer-events', 'none');

  if (mode === 'sticky') {
    set('position', 'sticky');
    set('top', '0');
    set('left', '0');
    set('height', '100svh');
    // zero net height, so the panels below keep their original offsets
    set('margin', '0 0 -100svh 0');
    return;
  }

  set('position', 'absolute');
  set('inset', '0');
  set('height', '100%');
  set('margin', '0');
}
