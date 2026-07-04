import { CHAMOIS, LINEN, FOILS } from '../data/swatches.js';

/*
 * Builds the interactive swatch rows for the Chamois, Linen and Foiling
 * sections. Pressing a chip recolours / re-foils the 3D album cover live.
 */
function buildRow(container, items, { type, onPick, render }) {
  if (!container) return;
  container.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'swatches__row';
  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.type = 'button';
    btn.style.background = item.chip || item.hex;
    btn.setAttribute('aria-label', `${type} ${item.label || item.code}`);
    btn.dataset.code = item.code;
    btn.addEventListener('click', () => {
      row.querySelectorAll('.swatch').forEach((s) => s.classList.remove('is-on'));
      btn.classList.add('is-on');
      onPick(item);
    });
    if (i === 0) btn.classList.add('is-on');
    row.appendChild(btn);
  });
  container.appendChild(row);
  const cap = document.createElement('p');
  cap.className = 'swatches__cap';
  cap.textContent = render ? render(items[0]) : items[0].code;
  container.appendChild(cap);
  return { row, cap };
}

export function initSwatches(album) {
  const chamois = buildRow(document.getElementById('sw-chamois'), CHAMOIS, {
    type: 'Chamois',
    render: (it) => `Chamois · ${it.code}`,
    onPick: (it) => {
      album.setCover({ weave: 'chamois', hex: it.hex });
      chamois.cap.textContent = `Chamois · ${it.code}`;
    },
  });
  const linen = buildRow(document.getElementById('sw-linen'), LINEN, {
    type: 'Linen',
    render: (it) => `Linen · ${it.code}`,
    onPick: (it) => {
      album.setCover({ weave: 'linen', hex: it.hex });
      linen.cap.textContent = `Linen · ${it.code}`;
    },
  });
  const foil = buildRow(document.getElementById('sw-foil'), FOILS, {
    type: 'Foil',
    render: (it) => `${it.label} foil`,
    onPick: (it) => {
      album.setCover({ foil: it.code });
      foil.cap.textContent = `${it.label} foil`;
    },
  });
}
