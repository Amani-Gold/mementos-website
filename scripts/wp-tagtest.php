<?php
/**
 * Reproduces WP_Scripts::do_item()'s tag assembly (WordPress 6.3+ / 6.7) and
 * runs the old and the new module_tag() over it.
 */

function esc_url( $u ) { return str_replace( '&', '&#038;', $u ); }

$src   = 'https://mementos-studio.com/wp-content/plugins/mementos-studio/assets/app/assets/mementos-app.js?ver=1.6.0';
$cfg   = '{"assetBase":"https://mementos-studio.com/wp-content/plugins/mementos-studio/assets/app/","spreads":[{"img":"a.webp"}]}';

// exactly how core builds it: before_script . wp_get_script_tag(...)
$before = "<script id='mementos-app-js-before'>\nwindow.MEMENTOS=window.MEMENTOS||$cfg;\n</script>\n";
$tag    = $before . "<script src='" . esc_url( $src ) . "' id='mementos-app-js'></script>\n";

// also test the html5-theme variant, which adds type="text/javascript"
$tag_typed = $before . '<script type="text/javascript" src="' . esc_url( $src ) . '" id="mementos-app-js"></script>' . "\n";

function old_module_tag( $tag, $handle, $src ) {
	if ( 'mementos-app' === $handle ) {
		$tag = '<script type="module" src="' . esc_url( $src ) . '" id="mementos-app-js"></script>' . "\n";
	}
	return $tag;
}

function new_module_tag( $tag, $handle, $src ) {
	if ( 'mementos-app' !== $handle ) {
		return $tag;
	}
	$quoted    = preg_quote( esc_url( $src ), '#' );
	$to_module = static function ( $matches ) {
		$el = preg_replace( '#\stype=([\'"])[^\'"]*\1#i', '', $matches[0] );
		return preg_replace( '#^<script#i', '<script type="module"', $el, 1 );
	};
	$out = preg_replace_callback( '#<script[^>]*\ssrc=([\'"])' . $quoted . '\1[^>]*>#i', $to_module, $tag, 1 );
	if ( null === $out || false === strpos( $out, 'type="module"' ) ) {
		$out = preg_replace_callback( '#<script[^>]*\ssrc=[^>]*>#i', $to_module, $tag, 1 );
	}
	return ( null === $out || '' === $out ) ? $tag : $out;
}

$cases = array(
	'single-quoted src (default)' => $tag,
	'type="text/javascript"'      => $tag_typed,
	'src rewritten by a CDN'      => $before . "<script src='https://cdn.example.com/x/mementos-app.js' id='mementos-app-js'></script>\n",
);

foreach ( array( 'old_module_tag', 'new_module_tag' ) as $fn ) {
	echo "=== $fn ===\n";
	foreach ( $cases as $name => $input ) {
		$out    = $fn( $input, 'mementos-app', $src );
		$keeps  = ( false !== strpos( $out, 'window.MEMENTOS' ) ) ? 'CONFIG KEPT' : 'CONFIG LOST';
		$module = ( false !== strpos( $out, 'type="module"' ) ) ? 'module ok ' : 'NOT MODULE';
		$dupes  = substr_count( $out, '<script' );
		printf( "  %-28s %s | %s | %d script tag(s)\n", $name, $keeps, $module, $dupes );
	}
}

echo "\n--- new_module_tag output (default case) ---\n";
echo new_module_tag( $tag, 'mementos-app', $src ), "\n";
echo "--- other handles untouched: ",
	( new_module_tag( '<script src="x.js"></script>', 'jquery', 'x.js' ) === '<script src="x.js"></script>' ? 'yes' : 'NO' ), " ---\n";
