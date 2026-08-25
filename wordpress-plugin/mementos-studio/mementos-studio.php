<?php
/**
 * Plugin Name:       Mementos Studio
 * Plugin URI:        https://mementos-studio.com/
 * Description:        The Mementos Studio luxury homepage — 3D flipping album hero, material and foil configurator, the collections in 3D, branded packaging and a live Instagram feed. Add the [mementos_studio] shortcode (or block) to a full-width page. All text, photos, your logo and contact details are editable under Settings → Mementos Studio.
 * Version:           1.4.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Mementos Studio
 * License:           GPL-2.0-or-later
 * Text Domain:       mementos-studio
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MEMENTOS_VER', '1.4.0' );
define( 'MEMENTOS_FILE', __FILE__ );
define( 'MEMENTOS_DIR', plugin_dir_path( __FILE__ ) );
define( 'MEMENTOS_URL', plugin_dir_url( __FILE__ ) );
define( 'MEMENTOS_ASSETS', MEMENTOS_URL . 'assets/app/' );

require_once MEMENTOS_DIR . 'includes/content-schema.php';
require_once MEMENTOS_DIR . 'includes/class-mementos-instagram.php';
require_once MEMENTOS_DIR . 'includes/class-mementos.php';
require_once MEMENTOS_DIR . 'includes/class-mementos-admin.php';

/**
 * Resolve the {ASSET} token in a stored value to the bundled media URL.
 *
 * @param string $val Stored value.
 * @return string
 */
function mementos_resolve( $val ) {
	if ( is_string( $val ) && 0 === strpos( $val, '{ASSET}' ) ) {
		return MEMENTOS_ASSETS . substr( $val, strlen( '{ASSET}' ) );
	}
	return $val;
}

/**
 * Template helper: fetch a content value (already resolved for images).
 *
 * @param array  $c       Content array.
 * @param string $section Section id.
 * @param string $key     Field key.
 * @param string $default Fallback.
 * @return mixed
 */
function mm( $c, $section, $key, $default = '' ) {
	$v = isset( $c[ $section ][ $key ] ) ? $c[ $section ][ $key ] : $default;
	return $v;
}

// Boot.
Mementos_Studio::instance();
new Mementos_Studio_Admin();

/**
 * Activation: flush nothing heavy, just seed the option so the admin shows
 * defaults on first load.
 */
register_activation_hook( __FILE__, function () {
	if ( false === get_option( 'mementos_content', false ) ) {
		add_option( 'mementos_content', array() );
	}
} );

/**
 * Print the brand mark.
 *
 * Uses the logo uploaded under Settings → Mementos Studio → General when one
 * is set, so the studio's own artwork is used verbatim. Falls back to the
 * bundled monogram only if the field has been cleared.
 */
function mementos_brand_mark( $c ) {
	$src = isset( $c['general']['logo'] ) ? trim( (string) $c['general']['logo'] ) : '';
	if ( '' === $src ) {
		return;
	}
	printf(
		'<img class="brand-mark" src="%s" alt="" aria-hidden="true" />',
		esc_url( mementos_resolve( $src ) )
	);
}
