/*
 * Cover colours sampled from the Mementos Studio material references
 * (Chamois MS01–MS20, Linen LN01–LN06). Hexes are a robust median of patches
 * across each cover (skipping the foil text) so the on-screen swatch matches
 * the real product colour.
 */
export const CHAMOIS = [
  { code: 'MS01', hex: '#c5bdb2' },
  { code: 'MS02', hex: '#a88569' },
  { code: 'MS03', hex: '#a59c98' },
  { code: 'MS04', hex: '#cc907e' },
  { code: 'MS05', hex: '#57727a' },
  { code: 'MS06', hex: '#b98994' },
  { code: 'MS07', hex: '#603c26' },
  { code: 'MS08', hex: '#940418' },
  { code: 'MS09', hex: '#650721' },
  { code: 'MS10', hex: '#732d36' },
  { code: 'MS11', hex: '#2f1825' },
  { code: 'MS12', hex: '#b7cfe9' },
  { code: 'MS13', hex: '#0a2639' },
  { code: 'MS14', hex: '#574d2c' },
  { code: 'MS15', hex: '#7d685e' },
  { code: 'MS16', hex: '#131313' },
  { code: 'MS17', hex: '#b28077' },
  { code: 'MS18', hex: '#394e32' },
  { code: 'MS19', hex: '#ebeaeb' },
  { code: 'MS20', hex: '#9e4330' },
];

// Linen colours matched to the real fabric swatch chart:
//   LN01 Off white · LN02 Brown · LN03 Pink · LN04 Light Green
//   LN05 Light Blue · LN06 Beige
export const LINEN = [
  { code: 'LN01', name: 'Off white',   hex: '#ccc6ba' },
  { code: 'LN02', name: 'Brown',       hex: '#a4784f' },
  { code: 'LN03', name: 'Pink',        hex: '#bf647c' },
  { code: 'LN04', name: 'Light Green', hex: '#c7cc8a' },
  { code: 'LN05', name: 'Light Blue',  hex: '#a6d0d4' },
  { code: 'LN06', name: 'Beige',       hex: '#b8aa93' },
];

export const FOILS = [
  { code: 'gold', label: 'Gold', chip: 'linear-gradient(135deg,#e7c889,#a9802f)' },
  { code: 'silver', label: 'Silver', chip: 'linear-gradient(135deg,#e8eaec,#9aa0a6)' },
  { code: 'black', label: 'Black', chip: 'linear-gradient(135deg,#4a443c,#16130f)' },
];
