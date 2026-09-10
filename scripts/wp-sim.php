<?php
/**
 * Render the plugin's homepage markup outside WordPress, with just enough of
 * the WP API stubbed, so the built app can be exercised in a browser against
 * plugin-style (subdirectory) asset URLs.
 */

define( 'ABSPATH', __DIR__ );

$PLUGIN_URL = '/wp-content/plugins/mementos-studio/';

function plugin_dir_path( $f ) { return dirname( $f ) . '/'; }
function plugin_dir_url( $f )  { global $PLUGIN_URL; return $PLUGIN_URL; }
function esc_html( $s )  { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_attr( $s )  { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_url( $s )   { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_url_raw( $s ) { return $s; }
function esc_attr_e( $s, $d = '' ) { echo esc_attr( $s ); }
function esc_html_e( $s, $d = '' ) { echo esc_html( $s ); }
function __( $s, $d = '' ) { return $s; }
function _e( $s, $d = '' ) { echo $s; }
function get_option( $k, $d = false ) { return $d; }
function update_option( $k, $v ) { return true; }
function add_action( ...$a ) {}
function add_filter( ...$a ) {}
function add_shortcode( ...$a ) {}
function register_block_type( ...$a ) {}
function is_singular( ...$a ) { return true; }
function get_post( ...$a ) { return null; }
function has_shortcode( ...$a ) { return true; }
function has_block( ...$a ) { return false; }
function wp_json_encode( $d, $o = 0, $depth = 512 ) { return json_encode( $d, $o, $depth ); }
function add_query_arg( $k, $v, $url ) { return $url . ( strpos( $url, '?' ) === false ? '?' : '&' ) . $k . '=' . rawurlencode( $v ); }
function wp_enqueue_style( ...$a ) { $GLOBALS['STYLES'][] = $a; }
function wp_enqueue_script( ...$a ) { $GLOBALS['SCRIPTS'][] = $a; }
function wp_add_inline_script( $h, $code, $pos = 'after' ) { $GLOBALS['INLINE'][] = array( $h, $code, $pos ); }
function wp_kses_post( $s ) { return $s; }
function wp_get_attachment_url( $id ) { return ''; }
function get_media( ...$a ) { return ''; }
function antispambot( $s ) { return $s; }
function trailingslashit( $s ) { return rtrim( $s, '/' ) . '/'; }
function apply_filters( $t, $v, ...$r ) { return $v; }
function do_shortcode( $s ) { return $s; }
function home_url( $p = '' ) { return 'https://example.test' . $p; }
function wp_upload_dir() { return array( 'baseurl' => '/wp-content/uploads' ); }
function sanitize_email( $s ) { return $s; }
function wp_kses( $s, $a = array() ) { return $s; }
function nl2br_safe( $s ) { return $s; }
function get_bloginfo( $k = '' ) { return 'Mementos Studio'; }
function wp_parse_args( $a, $d = array() ) { return array_merge( (array) $d, (array) $a ); }
function absint( $v ) { return abs( (int) $v ); }
function wp_rand( $a = 0, $b = 0 ) { return $a; }
function wp_generate_uuid4() { return 'x'; }
function wp_get_environment_type() { return 'production'; }
function register_deactivation_hook( ...$a ) {}
function register_activation_hook( ...$a ) {}
function wp_next_scheduled( ...$a ) { return false; }
function wp_schedule_event( ...$a ) {}
function wp_clear_scheduled_hook( ...$a ) {}
function get_transient( ...$a ) { return false; }
function set_transient( ...$a ) { return true; }
function delete_transient( ...$a ) { return true; }
function is_admin() { return false; }
function wp_remote_get( ...$a ) { return new WP_Error(); }
function is_wp_error( $t ) { return $t instanceof WP_Error; }
class WP_Error {}
function load_plugin_textdomain( ...$a ) {}
function plugin_basename( $f ) { return basename( dirname( $f ) ) . '/' . basename( $f ); }
function register_setting( ...$a ) {}
function add_options_page( ...$a ) {}
function current_user_can( ...$a ) { return false; }
function sanitize_text_field( $s ) { return $s; }
function wp_unslash( $s ) { return $s; }

$GLOBALS['STYLES'] = $GLOBALS['SCRIPTS'] = $GLOBALS['INLINE'] = array();

require __DIR__ . '/' . ( getenv('MPLUG') ?: 'fixed' ) . '/mementos-studio.php';

$app  = Mementos_Studio::instance();
$body = $app->shortcode();

// Assemble the page the way WordPress would: styles in <head>, the module
// script in the footer with its inline `before` script attached, run through
// the real module_tag filter.
$head = '';
foreach ( $GLOBALS['STYLES'] as $s ) {
	if ( 0 !== strpos( $s[1], 'http' ) || false !== strpos( $s[1], 'mementos-app' ) ) {
		$head .= '<link rel="stylesheet" href="' . esc_url( $s[1] ) . '?ver=' . $s[3] . '" />' . "\n";
	}
}

$foot = '';
foreach ( $GLOBALS['SCRIPTS'] as $s ) {
	$src  = $s[1] . '?ver=' . $s[3];
	$befo = '';
	foreach ( $GLOBALS['INLINE'] as $i ) {
		if ( $i[0] === $s[0] && 'before' === $i[2] ) {
			$befo .= "<script id='{$s[0]}-js-before'>\n" . $i[1] . "\n</script>\n";
		}
	}
	$tag   = $befo . "<script src='" . esc_url( $src ) . "' id='{$s[0]}-js'></script>\n";
	$foot .= $app->module_tag( $tag, $s[0], $src );
}

echo "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\" />"
	. "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />"
	. "<title>WP simulation</title>\n$head</head><body class=\"wordpress theme\">\n"
	. "<div class=\"theme-wrapper\"><main class=\"site-content\">\n$body\n</main></div>\n$foot</body></html>\n";
