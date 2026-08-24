/**
 * Escape a fixed-position canvas from anything that would trap it: a
 * theme/page-builder ancestor with a CSS transform/filter/perspective
 * (which changes what `position: fixed` is fixed *to*), or a CSS
 * specificity fight where a theme rule strips or overrides `position`,
 * `inset`, or `z-index`.
 *
 * Moves the element to be a direct child of <body> — sidestepping any
 * transformed ancestor regardless of the host theme — and re-asserts the
 * handful of structural properties it needs as `!important` inline styles,
 * which beat any external rule short of another `!important` declaration on
 * <body> itself (vanishingly rare in practice).
 *
 * Deliberately leaves opacity/visibility untouched: the fade in/out is still
 * driven by the `.is-visible` class toggle in styles.css, so that keeps
 * working exactly as before.
 *
 * @param {HTMLElement} el      the canvas to pin
 * @param {number} zIndex       must match the element's stylesheet z-index
 */
export function pinToViewport(el, zIndex) {
  if (el.parentElement !== document.body) document.body.appendChild(el);
  const set = (prop, val) => el.style.setProperty(prop, val, 'important');
  set('position', 'fixed');
  set('top', '0');
  set('left', '0');
  set('right', '0');
  set('bottom', '0');
  set('width', '100vw');
  set('height', '100svh');
  set('margin', '0');
  set('z-index', String(zIndex));
  set('pointer-events', 'none');
}
