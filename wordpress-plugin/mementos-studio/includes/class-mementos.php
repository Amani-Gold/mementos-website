<?php
/**
 * Core: shortcode/block registration, asset enqueue, config injection.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Mementos_Studio {

	private static $instance = null;
	private $enqueued        = false;
	private $config          = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_shortcode( 'mementos_studio', array( $this, 'shortcode' ) );
		add_action( 'init', array( $this, 'register_block' ) );
		// Allow our ES module script tag to load as type="module".
		add_filter( 'script_loader_tag', array( $this, 'module_tag' ), 10, 3 );
		add_action( 'wp_head', array( $this, 'head_meta' ), 5 );
		// Enqueue as early as WordPress allows when the page is ours, so the
		// stylesheet lands in <head> instead of after the markup. Enqueuing
		// only from the shortcode (which runs mid-body) leaves the sections
		// briefly unstyled, and the scroll pinning is then set up against
		// measurements taken before the layout CSS applied.
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue' ) );
	}

	/**
	 * Render the homepage.
	 *
	 * @return string
	 */
	public function shortcode() {
		$this->enqueue();
		$content = mementos_get_content();
		// Resolve {ASSET} tokens on every stored value (recursively) for the template.
		$content = $this->resolve_deep( $content );
		ob_start();
		$this->print_config();
		include MEMENTOS_DIR . 'includes/render-home.php';
		return ob_get_clean();
	}

	/**
	 * Enqueue during wp_enqueue_scripts when this page renders our homepage.
	 */
	public function maybe_enqueue() {
		if ( ! is_singular() ) {
			return;
		}
		$post = get_post();
		if ( ! $post ) {
			return;
		}
		if ( has_shortcode( (string) $post->post_content, 'mementos_studio' ) || has_block( 'mementos/studio', $post ) ) {
			$this->enqueue();
		}
	}

	/**
	 * Print window.MEMENTOS alongside the markup.
	 *
	 * The same configuration is also attached to the script handle with
	 * wp_add_inline_script(). Printing it here as well means the app still gets
	 * its asset base URL and content if anything downstream (an optimisation,
	 * caching or security plugin filtering script tags) drops the attached
	 * copy. Whichever runs first wins; both carry identical values.
	 */
	private function print_config() {
		if ( empty( $this->config ) ) {
			return;
		}
		echo '<script id="mementos-config">window.MEMENTOS=window.MEMENTOS||'
			. wp_json_encode( $this->config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT )
			. ';</script>' . "\n";
	}

	/**
	 * Register a thin block that outputs the same shortcode (editor friendly).
	 */
	public function register_block() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}
		register_block_type(
			'mementos/studio',
			array(
				'render_callback' => array( $this, 'shortcode' ),
			)
		);
	}

	/**
	 * Recursively resolve {ASSET} tokens.
	 *
	 * @param mixed $val Value.
	 * @return mixed
	 */
	private function resolve_deep( $val ) {
		if ( is_array( $val ) ) {
			foreach ( $val as $k => $v ) {
				$val[ $k ] = $this->resolve_deep( $v );
			}
			return $val;
		}
		return mementos_resolve( $val );
	}

	/**
	 * Enqueue the built app CSS/JS, fonts, and inject window.MEMENTOS.
	 */
	public function enqueue() {
		if ( $this->enqueued ) {
			return;
		}
		$this->enqueued = true;

		$families = 'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&family=Inter:wght@300;400;500&family=Pinyon+Script';
		if ( mementos_is_rtl() ) {
			// The Latin faces above carry no Arabic glyphs, so the Arabic page
			// needs its own display and text families alongside them.
			$families .= '&family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600';
		}
		wp_enqueue_style(
			'mementos-fonts',
			'https://fonts.googleapis.com/css2?' . $families . '&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'mementos-app', MEMENTOS_ASSETS . 'assets/mementos-app.css', array(), MEMENTOS_VER );
		wp_enqueue_style( 'mementos-lang', MEMENTOS_ASSETS . 'lang.css', array( 'mementos-app' ), MEMENTOS_VER );
		wp_enqueue_script( 'mementos-app', MEMENTOS_ASSETS . 'assets/mementos-app.js', array(), MEMENTOS_VER, true );

		if ( mementos_is_rtl() ) {
			// After the app stylesheet, so the mirrored rules win on equal
			// specificity; and after the app script, so the labels it writes
			// exist before the companion starts watching them.
			wp_enqueue_style( 'mementos-rtl', MEMENTOS_ASSETS . 'rtl.css', array( 'mementos-app', 'mementos-lang' ), MEMENTOS_VER );
			wp_enqueue_script( 'mementos-lang-ar', MEMENTOS_ASSETS . 'lang-ar.js', array( 'mementos-app' ), MEMENTOS_VER, true );
		}

		$content = mementos_get_content();

		$spreads = array();
		if ( ! empty( $content['hero']['spreads'] ) && is_array( $content['hero']['spreads'] ) ) {
			foreach ( $content['hero']['spreads'] as $s ) {
				if ( empty( $s['image'] ) ) {
					continue;
				}
				$spreads[] = array(
					'img' => mementos_resolve( $s['image'] ),
					'cap' => isset( $s['caption'] ) ? $s['caption'] : '',
				);
			}
		}
		// Never leave the 3D album blank because of stale saved media URLs.
		if ( count( $spreads ) < 2 ) {
			$spreads = array(
				array( 'img' => MEMENTOS_ASSETS . 'Spreads/web/spread06.webp', 'cap' => 'Before everything began' ),
				array( 'img' => MEMENTOS_ASSETS . 'Spreads/web/spread03.webp', 'cap' => 'A closer look' ),
				array( 'img' => MEMENTOS_ASSETS . 'Spreads/web/spread07.webp', 'cap' => 'Every detail in its place' ),
				array( 'img' => MEMENTOS_ASSETS . 'Spreads/web/spread08.webp', 'cap' => 'The two of them' ),
				array( 'img' => MEMENTOS_ASSETS . 'Spreads/web/spread09.webp', 'cap' => 'And the family became one' ),
			);
		}

		// the studio's own logo, so the 3D packaging prints the real mark
		$logo = trim( (string) mm( $content, 'general', 'logo' ) );

		$cfg = array(
			'lang'       => mementos_lang(),
			'dir'        => mementos_is_rtl() ? 'rtl' : 'ltr',
			'i18n'       => mementos_is_rtl() ? mementos_js_strings_ar() : new stdClass(),
			'assetBase'  => MEMENTOS_ASSETS,
			'earthMap'   => add_query_arg( 'ver', MEMENTOS_VER, MEMENTOS_ASSETS . 'earth-map.jpg' ),
			'albumMockup'=> add_query_arg( 'ver', MEMENTOS_VER, MEMENTOS_ASSETS . 'mockups/album-mockup-transparent.png' ),
			'logo'       => '' !== $logo ? mementos_resolve( $logo ) : '',
			'contact'    => array(
				'whatsapp'  => preg_replace( '/\D+/', '', (string) mm( $content, 'general', 'whatsapp' ) ),
				'email'     => (string) mm( $content, 'general', 'email' ),
				'instagram' => (string) mm( $content, 'general', 'instagram_url' ),
			),
			'coverNames' => array(
				'line1' => (string) mm( $content, 'hero', 'cover_line1' ),
				'amp'   => (string) mm( $content, 'hero', 'cover_amp' ),
				'line2' => (string) mm( $content, 'hero', 'cover_line2' ),
				'date'  => strtoupper( (string) mm( $content, 'hero', 'cover_date' ) ),
			),
			'spreads'    => $spreads,
		);

		$this->config = $cfg;

		wp_add_inline_script(
			'mementos-app',
			'window.MEMENTOS=window.MEMENTOS||' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';',
			'before'
		);
	}

	/**
	 * Output SEO/OG meta on pages that render our homepage.
	 */
	public function head_meta() {
		if ( ! is_singular() ) {
			return;
		}
		$post = get_post();
		if ( ! $post ) {
			return;
		}
		if ( ! has_shortcode( $post->post_content, 'mementos_studio' ) && ! has_block( 'mementos/studio', $post ) ) {
			return;
		}
		$c     = mementos_get_content();
		$desc  = (string) mm( $c, 'seo', 'description' );
		$title = (string) mm( $c, 'seo', 'title' );
		$img   = mementos_resolve( (string) mm( $c, 'seo', 'og_image' ) );
		echo "\n<meta name=\"description\" content=\"" . esc_attr( $desc ) . "\" />\n";
		echo '<meta property="og:type" content="website" />' . "\n";
		echo '<meta property="og:title" content="' . esc_attr( $title ) . '" />' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $desc ) . '" />' . "\n";
		echo '<meta property="og:image" content="' . esc_url( $img ) . '" />' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image" />' . "\n";

		// Tell search engines the two language addresses are one page.
		foreach ( array_keys( mementos_languages() ) as $code ) {
			printf(
				'<link rel="alternate" hreflang="%s" href="%s" />' . "\n",
				esc_attr( $code ),
				esc_url( mementos_lang_url( $code, true ) )
			);
		}
	}

	/**
	 * Make our app script an ES module.
	 */
	public function module_tag( $tag, $handle, $src ) {
		if ( 'mementos-app' !== $handle ) {
			return $tag;
		}

		/*
		 * $tag is NOT just the <script src> element.
		 *
		 * WP_Scripts::do_item() concatenates the handle's translations and its
		 * `before`/`after` inline scripts into $tag before running this filter
		 * (wp-includes/class-wp-scripts.php: "$tag = $translations .
		 * $ie_conditional_prefix . $before_script;" then the element itself).
		 * Our `window.MEMENTOS = {…}` configuration — the asset base URL, the
		 * spreads, the cover names, the contact details — is one of those
		 * before-scripts.
		 *
		 * Rebuilding the tag from $src alone therefore threw the configuration
		 * away. With no window.MEMENTOS the app falls back to a page-relative
		 * asset base ("./"), so every spread, texture, swatch and mockup was
		 * requested from the page's own URL and 404'd: blank album pages, an
		 * untextured globe, and "image not found" in the live preview. It only
		 * showed up on a real site because the standalone build has no such
		 * filter, and inline scripts were only folded into $tag in WordPress
		 * 6.3+.
		 *
		 * So rewrite just the loader element and leave the rest of $tag alone.
		 */
		$quoted  = preg_quote( esc_url( $src ), '#' );
		$to_module = static function ( $matches ) {
			$el = preg_replace( '#\stype=([\'"])[^\'"]*\1#i', '', $matches[0] );
			return preg_replace( '#^<script#i', '<script type="module"', $el, 1 );
		};

		$out = preg_replace_callback( '#<script[^>]*\ssrc=([\'"])' . $quoted . '\1[^>]*>#i', $to_module, $tag, 1 );

		// Another plugin may have rewritten the src (a CDN or cache-busting
		// filter), in which case the exact match above finds nothing. Fall back
		// to the first <script> element in the block that has any src at all —
		// still without touching the surrounding inline scripts.
		if ( null === $out || false === strpos( $out, 'type="module"' ) ) {
			$out = preg_replace_callback( '#<script[^>]*\ssrc=[^>]*>#i', $to_module, $tag, 1 );
		}

		return ( null === $out || '' === $out ) ? $tag : $out;
	}
}
