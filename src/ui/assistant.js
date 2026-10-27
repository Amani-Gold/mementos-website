/**
 * Mementos AI ordering assistant on the homepage.
 *
 * The assistant lives in the WooCommerce site (plugin "Mementos AI
 * Assistant"), which owns the catalogue, prices, cart and checkout. This page
 * only loads its widget: it asks the shop for the widget configuration, then
 * adds the plugin's own script and stylesheet. Served from the same domain as
 * the shop (mementos-studio.com), so the shop's cart cookies apply.
 *
 * Elements with [data-mai-open] open the chat once it is loaded; until then
 * (local dev, shop unreachable, assistant switched off) they keep their normal
 * link — the WhatsApp fallback set by [data-wa].
 */

const SHOP = (import.meta.env && import.meta.env.VITE_SHOP_ORIGIN) || '';

export function initAssistant() {
  if (window.MementosAssistantConfig || document.querySelector('script[data-mai-loader]')) return;

  fetch(`${SHOP}/wp-json/mementos-ai/v1/widget-config`, { credentials: 'include' })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data || !data.live || !data.config) return;

      window.MementosAssistantConfig = data.config;

      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = data.style;
      document.head.appendChild(style);

      const script = document.createElement('script');
      script.src = data.script;
      script.defer = true;
      script.dataset.maiLoader = '';
      document.body.appendChild(script);

      document.documentElement.classList.add('has-assistant');
    })
    .catch(() => {
      // No shop here (e.g. local dev): buttons keep their WhatsApp links.
    });
}
