<?php
/**
 * Language handling for the Arabic / English toggle.
 *
 * The language is chosen by the `lang` query argument alone — never a cookie
 * or a session. A cookie would make the same URL return different HTML to
 * different people, which any page cache in front of WordPress would then
 * serve to the wrong visitor; `?lang=ar` is a distinct URL, so caches,
 * bookmarks and shared links all behave.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Languages this plugin renders, in toggle order. */
function mementos_languages() {
	return array(
		'en' => array( 'label' => 'EN', 'name' => 'English', 'dir' => 'ltr' ),
		'ar' => array( 'label' => 'AR', 'name' => 'العربية', 'dir' => 'rtl' ),
	);
}

/** The language for this request: 'en' (default) or 'ar'. */
function mementos_lang() {
	static $lang = null;
	if ( null !== $lang ) {
		return $lang;
	}
	$req  = isset( $_GET['lang'] ) ? strtolower( sanitize_key( wp_unslash( $_GET['lang'] ) ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$lang = array_key_exists( $req, mementos_languages() ) ? $req : 'en';
	return $lang;
}

/** True when the current request renders right-to-left. */
function mementos_is_rtl() {
	return 'rtl' === mementos_languages()[ mementos_lang() ]['dir'];
}

/**
 * The current URL with `lang` set to $lang.
 *
 * Built from the request URI so the toggle keeps whatever else is in the
 * address (a preview id, a UTM tag), and so it works on any permalink shape.
 */
function mementos_lang_url( $lang, $absolute = false ) {
	$uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/';
	$url = 'en' === $lang ? remove_query_arg( 'lang', $uri ) : add_query_arg( 'lang', $lang, $uri );

	if ( $absolute ) {
		// REQUEST_URI already carries any subdirectory WordPress is installed
		// in, so only the scheme and host are taken from home_url().
		$home   = wp_parse_url( home_url() );
		$scheme = isset( $home['scheme'] ) ? $home['scheme'] : ( is_ssl() ? 'https' : 'http' );
		$host   = isset( $home['host'] ) ? $home['host'] : '';
		$port   = isset( $home['port'] ) ? ':' . $home['port'] : '';
		if ( '' !== $host ) {
			$url = $scheme . '://' . $host . $port . $url;
		}
	}
	return $url;
}

/**
 * Print the AR / EN switch.
 *
 * Plain links, not a script: each language is a real URL, so the switch works
 * before the page has finished loading, can be opened in a new tab, shared,
 * bookmarked and crawled. `hreflang` tells search engines the two addresses
 * are the same page in two languages.
 */
function mementos_lang_switch() {
	$current = mementos_lang();
	echo '<div class="mm-lang" role="group" aria-label="Language">';
	foreach ( mementos_languages() as $code => $meta ) {
		$is = $code === $current;
		printf(
			'<a href="%s" hreflang="%s" lang="%s" aria-current="%s" title="%s"><span>%s</span></a>',
			esc_url( mementos_lang_url( $code ) ),
			esc_attr( $code ),
			esc_attr( $code ),
			$is ? 'true' : 'false',
			esc_attr( $meta['name'] ),
			esc_html( $meta['label'] )
		);
	}
	echo '</div>';
}

/**
 * Translate one of the plugin's own interface strings.
 *
 * These are the few labels that live in the template rather than in the
 * editable content — menu headings in the footer, the loading caption, the
 * live-preview readout — so the site owner never has to retype them. Anything
 * a visitor reads as *copy* comes from the content settings instead, where it
 * is editable in both languages.
 *
 * @param string $text the English string, used as its own key
 * @return string
 */
function mm_t( $text ) {
	if ( 'ar' !== mementos_lang() ) {
		return $text;
	}
	$d = mementos_ui_strings_ar();
	return isset( $d[ $text ] ) ? $d[ $text ] : $text;
}

/** Arabic for the template's own interface strings. */
function mementos_ui_strings_ar() {
	return array(
		// structure / navigation
		'Skip to content'        => 'تخطَّ إلى المحتوى',
		'Collections'            => 'المجموعات',
		'Studio'                 => 'الاستوديو',
		'Craft'                  => 'الحرفة',
		'Process'                => 'مراحل العمل',
		'For Photographers'      => 'للمصورين',
		'Contact'                => 'تواصل معنا',
		'WhatsApp'               => 'واتساب',
		'Email'                  => 'البريد الإلكتروني',
		'Instagram'              => 'إنستغرام',
		'Explore'                => 'اكتشف',
		'The Story'              => 'القصة',
		// configurator
		'Live Preview'           => 'معاينة مباشرة',
		'Loading album…'         => 'جارٍ تحميل الألبوم…',
		'Material'               => 'الخامة',
		'Foil'                   => 'التذهيب',
		'Chamois'                => 'شامواه',
		'Linen'                  => 'كتان',
		'Gold foil'              => 'تذهيب ذهبي',
		'Silver foil'            => 'تذهيب فضي',
		'Black foil'             => 'تذهيب أسود',
		// labels read by screen readers
		'home'                   => 'الصفحة الرئيسية',
		'Primary'                => 'القائمة الرئيسية',
		'Mobile'                 => 'قائمة الجوال',
		'Open menu'              => 'افتح القائمة',
		'The album'              => 'الألبوم',
		'Why Mementos'           => 'لماذا مِمنتوز',
		'Collections in 3D'      => 'المجموعات ثلاثية الأبعاد',
		'Follow us'              => 'تابعنا',
		'Album cover preview'    => 'معاينة غلاف الألبوم',
		'Previous testimonial'   => 'الرأي السابق',
		'Next testimonial'       => 'الرأي التالي',
		'Chat on WhatsApp'       => 'تحدّث عبر واتساب',
		'Instagram post'         => 'منشور إنستغرام',
		'Craft detail'           => 'تفصيل من الحرفة',
		'A handcrafted Mementos Studio wedding album, open to a printed spread'
			=> 'ألبوم زفاف من مِمنتوز ستوديو مصنوع يدويًا، مفتوح على صفحتين مطبوعتين',
	);
}

/**
 * The strings the built app writes into the page after it loads, so the
 * Arabic companion script can keep them in Arabic too.
 *
 * Keyed exactly as the app produces them; the material row is a pattern
 * because the code (MS01, LN03…) is a product reference and stays as it is.
 */
function mementos_js_strings_ar() {
	return array(
		'materials' => array(
			'Chamois' => 'شامواه',
			'Linen'   => 'كتان',
		),
		'foils'     => array(
			'Gold foil'   => 'تذهيب ذهبي',
			'Silver foil' => 'تذهيب فضي',
			'Black foil'  => 'تذهيب أسود',
		),
		'misc'      => array(
			'Album image not found' => 'تعذّر تحميل صورة الألبوم',
		),
	);
}
