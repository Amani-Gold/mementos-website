<?php
/**
 * The Arabic edition.
 *
 * Arabic is a page of its own, put together with the `[mementos_studio_ar]`
 * shortcode. The English homepage is left exactly as it is: it carries no
 * switch, loads no extra stylesheet, and renders through the same code path it
 * always did. Which language a request is in follows from which shortcode the
 * page uses, so the two are separate addresses and a page cache can hold both.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The language this request renders in: 'en' (default) or 'ar'.
 *
 * Resolved once, from the post being viewed, so that everything which runs
 * before the shortcode does — the <head> meta, the stylesheet enqueue — agrees
 * with what the template will output. The shortcodes also set it explicitly,
 * which covers a page that was assembled some other way.
 *
 * @param string|null $set pass 'ar' or 'en' to fix the language for this request
 * @return string
 */
function mementos_lang( $set = null ) {
	static $lang = null;

	if ( null !== $set ) {
		$lang = 'ar' === $set ? 'ar' : 'en';
		return $lang;
	}
	if ( null !== $lang ) {
		return $lang;
	}

	$lang = 'en';
	if ( function_exists( 'is_singular' ) && is_singular() ) {
		$post = get_post();
		if ( $post && ( has_shortcode( (string) $post->post_content, 'mementos_studio_ar' ) || has_block( 'mementos/studio-ar', $post ) ) ) {
			$lang = 'ar';
		}
	}
	return $lang;
}

/** True when this request renders right-to-left. */
function mementos_is_rtl() {
	return 'ar' === mementos_lang();
}

/**
 * Translate one of the template's own interface strings.
 *
 * These are the few labels written into the template rather than stored as
 * content — the footer's column headings, the loading caption, the live-preview
 * readout — so the site owner never has to retype them. Everything a visitor
 * reads as *copy* comes from the content settings, where it is editable in both
 * languages.
 *
 * On the English page this returns its argument untouched, so the English
 * output is byte for byte what it was before.
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
		'Skip to content'      => 'تخطَّ إلى المحتوى',
		'Collections'          => 'المجموعات',
		'Studio'               => 'الاستوديو',
		'Craft'                => 'الحرفة',
		'Process'              => 'مراحل العمل',
		'For Photographers'    => 'للمصورين',
		'Contact'              => 'تواصل معنا',
		'WhatsApp'             => 'واتساب',
		'Email'                => 'البريد الإلكتروني',
		'Instagram'            => 'إنستغرام',
		'Explore'              => 'اكتشف',
		'The Story'            => 'القصة',
		// configurator
		'Live Preview'         => 'معاينة مباشرة',
		'Loading album…'       => 'جارٍ تحميل الألبوم…',
		'Material'             => 'الخامة',
		'Foil'                 => 'التذهيب',
		'Chamois'              => 'شامواه',
		'Gold foil'            => 'تذهيب ذهبي',
		// labels read by screen readers
		'home'                 => 'الصفحة الرئيسية',
		'Primary'              => 'القائمة الرئيسية',
		'Mobile'               => 'قائمة الجوال',
		'Open menu'            => 'افتح القائمة',
		'The album'            => 'الألبوم',
		'Why Mementos'         => 'لماذا مِمنتوز',
		'Collections in 3D'    => 'المجموعات ثلاثية الأبعاد',
		'Follow us'            => 'تابعنا',
		'Album cover preview'  => 'معاينة غلاف الألبوم',
		'Previous testimonial' => 'الرأي السابق',
		'Next testimonial'     => 'الرأي التالي',
		'Chat on WhatsApp'     => 'تحدّث عبر واتساب',
		'Instagram post'       => 'منشور إنستغرام',
		'Craft detail'         => 'تفصيل من الحرفة',
		'A handcrafted Mementos Studio wedding album, open to a printed spread'
			=> 'ألبوم زفاف من مِمنتوز ستوديو مصنوع يدويًا، مفتوح على صفحتين مطبوعتين',
		// the way back
		'English'              => 'English',
	);
}

/**
 * A link back to the English homepage, printed on the Arabic page only.
 *
 * The English page gets nothing at all — no switch, no markup, no stylesheet —
 * so it stays exactly as it was.
 */
function mementos_lang_switch() {
	if ( 'ar' !== mementos_lang() ) {
		return;
	}
	$c    = mementos_get_content( 'en' );
	$home = trim( (string) ( isset( $c['general']['en_url'] ) ? $c['general']['en_url'] : '' ) );
	if ( '' === $home ) {
		$home = home_url( '/' );
	}
	printf(
		'<a class="mm-lang" href="%s" hreflang="en" lang="en" title="%s"><span>EN</span></a>',
		esc_url( $home ),
		esc_attr__( 'View this page in English', 'mementos-studio' )
	);
}

/**
 * The strings the built app writes into the page after it loads, so the Arabic
 * companion script can keep them in Arabic too.
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
	);
}
