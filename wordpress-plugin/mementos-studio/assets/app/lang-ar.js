/*
 * Arabic companion for the built app.
 *
 * Everything a visitor reads is rendered by PHP in the chosen language, with
 * one exception: the material/foil readout under the live preview is written
 * by the app itself when a swatch is picked. Rather than fork the app for one
 * language, this watches those two nodes and re-states what they say in
 * Arabic as they change.
 *
 * Loaded only on the Arabic page. Translations come from PHP (window.MEMENTOS
 * .i18n), so they stay in one place.
 */
(function () {
	'use strict';

	var CFG = window.MEMENTOS || {};
	var T = CFG.i18n || {};
	if (!T.materials && !T.foils) return;

	var mat = document.getElementById('matLabel');
	var foil = document.getElementById('foilLabel');
	if (!mat && !foil) return;

	/**
	 * "Chamois · MS01" -> "شامواه · MS01".
	 *
	 * The code after the separator is a product reference, not language, so it
	 * is carried across untouched — and wrapped so a right-to-left line does
	 * not reorder its characters.
	 */
	function material(text) {
		var parts = String(text).split('·');
		var name = parts[0].trim();
		var code = parts.length > 1 ? parts.slice(1).join('·').trim() : '';
		var translated = (T.materials && T.materials[name]) || name;
		if (!code) return translated;
		return translated + ' · ⁦' + code + '⁩';
	}

	function foilText(text) {
		var key = String(text).trim();
		return (T.foils && T.foils[key]) || key;
	}

	/**
	 * Re-state one node, remembering what it said in English.
	 *
	 * The guard matters: writing to the node triggers the observer again, so
	 * without it each update would loop translating its own output.
	 */
	function watch(node, translate) {
		if (!node) return;
		var last = null;
		var apply = function () {
			var now = node.textContent;
			if (now === last) return;
			var out = translate(now);
			last = out;
			if (out !== now) node.textContent = out;
		};
		apply();
		new MutationObserver(apply).observe(node, { childList: true, characterData: true, subtree: true });
	}

	watch(mat, material);
	watch(foil, foilText);
})();
