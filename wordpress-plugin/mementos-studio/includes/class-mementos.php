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
		include MEMENTOS_DIR . 'includes/render-home.php';
		return ob_get_clean();
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

		wp_enqueue_style(
			'mementos-fonts',
			'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&family=Inter:wght@300;400;500&family=Pinyon+Script&display=swap',
			array(),
			null
		);
		wp_enqueue_style( 'mementos-app', MEMENTOS_ASSETS . 'assets/mementos-app.css', array(), MEMENTOS_VER );
		wp_enqueue_script( 'mementos-app', MEMENTOS_ASSETS . 'assets/mementos-app.js', array(), MEMENTOS_VER, true );

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

		$cfg = array(
			'assetBase'  => MEMENTOS_ASSETS,
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

		wp_add_inline_script( 'mementos-app', 'window.MEMENTOS=' . wp_json_encode( $cfg ) . ';', 'before' );
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
	}

	/**
	 * Make our app script an ES module.
	 */
	public function module_tag( $tag, $handle, $src ) {
		if ( 'mementos-app' === $handle ) {
			$tag = '<script type="module" src="' . esc_url( $src ) . '" id="mementos-app-js"></script>' . "\n";
		}
		return $tag;
	}
}
