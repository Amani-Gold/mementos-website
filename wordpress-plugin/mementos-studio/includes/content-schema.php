<?php
/**
 * Content schema for Mementos Studio.
 *
 * A single source of truth that drives BOTH the admin settings UI and the
 * front-end template. Every editable string and image on the page is a field
 * here. Image defaults use the "{ASSET}" token, which is resolved to the
 * plugin's bundled media URL at render time (see Mementos_Studio::asset()).
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Return the full content schema: sections -> fields.
 *
 * Field types: text, textarea, url, image, select, repeater.
 * Repeater fields carry their own `fields` (sub-fields) + `item_label`.
 *
 * @return array
 */
function mementos_schema() {
	return array(

		/* ---------------- General / contact / Instagram API ---------------- */
		array(
			'id'     => 'general',
			'label'  => 'General & Contact',
			'fields' => array(
				array( 'key' => 'brand_word', 'label' => 'Brand name', 'type' => 'text', 'default' => 'Mementos' ),
				array( 'key' => 'brand_sub', 'label' => 'Brand sub-label', 'type' => 'text', 'default' => 'Studio' ),
				array( 'key' => 'whatsapp', 'label' => 'WhatsApp number (digits only, incl. country code)', 'type' => 'text', 'default' => '97300000000' ),
				array( 'key' => 'email', 'label' => 'Contact email', 'type' => 'text', 'default' => 'hello@mementos-studio.com' ),
				array( 'key' => 'instagram_url', 'label' => 'Instagram profile URL', 'type' => 'url', 'default' => 'https://instagram.com/' ),
				array( 'key' => 'ig_token', 'label' => 'Instagram access token (long-lived)', 'type' => 'text', 'default' => '', 'help' => 'Instagram Basic Display API long-lived token. Leave empty to use the fallback images below.' ),
				array( 'key' => 'ig_limit', 'label' => 'Instagram posts to show', 'type' => 'text', 'default' => '6' ),
			),
		),

		/* ---------------- SEO ---------------- */
		array(
			'id'     => 'seo',
			'label'  => 'SEO',
			'fields' => array(
				array( 'key' => 'title', 'label' => 'Page title', 'type' => 'text', 'default' => 'Mementos Studio — Luxury Handcrafted Photo Albums, Made in Bahrain' ),
				array( 'key' => 'description', 'label' => 'Meta description', 'type' => 'textarea', 'default' => 'Mementos Studio — luxury handcrafted linen & chamois photo albums, professional printing, gold foiling and premium packaging. Timeless keepsakes, made in Bahrain.' ),
				array( 'key' => 'og_image', 'label' => 'Social share image', 'type' => 'image', 'default' => '{ASSET}details/albumcover.png' ),
			),
		),

		/* ---------------- Navigation ---------------- */
		array(
			'id'     => 'nav',
			'label'  => 'Navigation',
			'fields' => array(
				array( 'key' => 'cta_label', 'label' => 'Nav button label', 'type' => 'text', 'default' => 'Order Now' ),
				array(
					'key' => 'links', 'label' => 'Menu links', 'type' => 'repeater', 'item_label' => 'Link',
					'fields' => array(
						array( 'key' => 'label', 'label' => 'Label', 'type' => 'text' ),
						array( 'key' => 'target', 'label' => 'Target (#section or URL)', 'type' => 'text' ),
					),
					'default' => array(
						array( 'label' => 'Collections', 'target' => '#collections' ),
						array( 'label' => 'For Photographers', 'target' => '#photographers' ),
						array( 'label' => 'Craft', 'target' => '#craft' ),
						array( 'label' => 'Materials', 'target' => '#materials' ),
						array( 'label' => 'Process', 'target' => '#process' ),
						array( 'label' => 'Gallery', 'target' => '#gallery' ),
					),
				),
			),
		),

		/* ---------------- Hero ---------------- */
		array(
			'id'     => 'hero',
			'label'  => 'Hero & Album',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Your Memories' ),
				array( 'key' => 'title', 'label' => 'Headline (one line per row)', 'type' => 'textarea', 'default' => "Deserve\nMore Than\na Screen" ),
				array( 'key' => 'lede', 'label' => 'Sub-text', 'type' => 'textarea', 'default' => 'Luxury handcrafted albums, professional printing, and timeless keepsakes made in Bahrain.' ),
				array( 'key' => 'cta1_label', 'label' => 'Primary button', 'type' => 'text', 'default' => 'Explore Collections' ),
				array( 'key' => 'cta1_target', 'label' => 'Primary button target', 'type' => 'text', 'default' => '#collections' ),
				array( 'key' => 'cta2_label', 'label' => 'Secondary button', 'type' => 'text', 'default' => 'For Photographers' ),
				array( 'key' => 'cta2_target', 'label' => 'Secondary button target', 'type' => 'text', 'default' => '#photographers' ),
				array( 'key' => 'bg_word', 'label' => 'Background word', 'type' => 'text', 'default' => 'MEMORIES' ),
				array( 'key' => 'scroll_label', 'label' => 'Scroll cue', 'type' => 'text', 'default' => 'Scroll to Begin' ),
				array( 'key' => 'cover_line1', 'label' => 'Album cover — name line 1', 'type' => 'text', 'default' => 'Aysha' ),
				array( 'key' => 'cover_amp', 'label' => 'Album cover — separator', 'type' => 'text', 'default' => '&' ),
				array( 'key' => 'cover_line2', 'label' => 'Album cover — name line 2', 'type' => 'text', 'default' => 'Alfonse' ),
				array( 'key' => 'cover_date', 'label' => 'Album cover — date', 'type' => 'text', 'default' => 'Oct 4, 2024' ),
				array(
					'key' => 'story', 'label' => 'The Story rail', 'type' => 'repeater', 'item_label' => 'Step',
					'fields' => array(
						array( 'key' => 'num', 'label' => 'Number', 'type' => 'text' ),
						array( 'key' => 'title', 'label' => 'Title', 'type' => 'text' ),
					),
					'default' => array(
						array( 'num' => '01', 'title' => 'Handcrafted' ),
						array( 'num' => '02', 'title' => 'Printed with Precision' ),
						array( 'num' => '03', 'title' => 'Designed to Last Generations' ),
						array( 'num' => '04', 'title' => 'More Than An Album' ),
						array( 'num' => '05', 'title' => 'A Legacy' ),
					),
				),
				array(
					'key' => 'spreads', 'label' => 'Album spread photos (the flipping pages)', 'type' => 'repeater', 'item_label' => 'Spread',
					'help' => 'Use dark, full-bleed 2:1 wedding spreads. At least 2. First is shown as the cover is opened.',
					'fields' => array(
						array( 'key' => 'image', 'label' => 'Spread image (2:1)', 'type' => 'image' ),
						array( 'key' => 'caption', 'label' => 'Caption', 'type' => 'text' ),
					),
					'default' => array(
						array( 'image' => '{ASSET}Spreads/web/spread06.webp', 'caption' => 'Before everything began' ),
						array( 'image' => '{ASSET}Spreads/web/spread03.webp', 'caption' => 'A closer look' ),
						array( 'image' => '{ASSET}Spreads/web/spread07.webp', 'caption' => 'Every detail in its place' ),
						array( 'image' => '{ASSET}Spreads/web/spread08.webp', 'caption' => 'The two of them' ),
						array( 'image' => '{ASSET}Spreads/web/spread09.webp', 'caption' => 'And the family became one' ),
					),
				),
			),
		),

		/* ---------------- Trust strip ---------------- */
		array(
			'id'     => 'trust',
			'label'  => 'Trust strip',
			'fields' => array(
				array(
					'key' => 'items', 'label' => 'Items', 'type' => 'repeater', 'item_label' => 'Item',
					'fields' => array(
						array( 'key' => 'big', 'label' => 'Big text (optional)', 'type' => 'text' ),
						array( 'key' => 'label', 'label' => 'Label', 'type' => 'text' ),
					),
					'default' => array(
						array( 'big' => '5+', 'label' => 'Years of Excellence' ),
						array( 'big' => '', 'label' => 'Handcrafted with Care' ),
						array( 'big' => '', 'label' => 'Premium Materials' ),
						array( 'big' => '', 'label' => 'Archival Quality' ),
						array( 'big' => '', 'label' => 'Made in Bahrain' ),
					),
				),
			),
		),

		/* ---------------- Collections (photo cards) ---------------- */
		array(
			'id'     => 'collections',
			'label'  => 'Collections',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Our Signature Collections' ),
				array( 'key' => 'title', 'label' => 'Title', 'type' => 'text', 'default' => 'Crafted for Every Story' ),
				array( 'key' => 'link_label', 'label' => 'Corner link', 'type' => 'text', 'default' => 'View in 3D' ),
				array(
					'key' => 'cards', 'label' => 'Collection cards', 'type' => 'repeater', 'item_label' => 'Card',
					'fields' => array(
						array( 'key' => 'name', 'label' => 'Name', 'type' => 'text' ),
						array( 'key' => 'desc', 'label' => 'Description', 'type' => 'textarea' ),
						array( 'key' => 'image', 'label' => 'Photo', 'type' => 'image' ),
					),
					'default' => array(
						array( 'name' => 'Standard', 'desc' => 'A slim linen clamshell with a hand-foiled lid — the everyday heirloom.', 'image' => '{ASSET}Collections/Standard (1).jpeg' ),
						array( 'name' => 'Luxury', 'desc' => 'A deep hinged box with a wood plate and gold clasp — presentation as ceremony.', 'image' => '{ASSET}Collections/Luxury (1).jpeg' ),
						array( 'name' => 'Sliding', 'desc' => 'A linen slipcase with a clear acrylic window — the album slides quietly home.', 'image' => '{ASSET}Collections/Sliding (1).png' ),
						array( 'name' => 'Pocket', 'desc' => 'A framed tray with a linen border — compact, considered, gift-ready.', 'image' => '{ASSET}Collections/Pocket.png' ),
					),
				),
			),
		),

		/* ---------------- Collections in 3D ---------------- */
		array(
			'id'     => 'collections3d',
			'label'  => 'Collections in 3D',
			'fields' => array(
				array(
					'key' => 'panels', 'label' => '3D scroll panels', 'type' => 'repeater', 'item_label' => 'Panel',
					'fields' => array(
						array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text' ),
						array( 'key' => 'headline', 'label' => 'Headline', 'type' => 'text' ),
						array( 'key' => 'body', 'label' => 'Body', 'type' => 'textarea' ),
					),
					'default' => array(
						array( 'eyebrow' => 'The Collections', 'headline' => 'A box for every album.', 'body' => 'Four handcrafted presentations — Standard, Luxury, Sliding and Pocket — each lined and finished to keep your album for life.' ),
						array( 'eyebrow' => 'Sliding', 'headline' => 'It slides home.', 'body' => 'A linen slipcase made to the millimetre — the album settles in with a quiet, deliberate fit.' ),
						array( 'eyebrow' => 'Luxury', 'headline' => 'Wrapped to be given.', 'body' => 'A deep hinged box presents a dark wood plate, then lifts to reveal the album inside.' ),
						array( 'eyebrow' => 'Packaging', 'headline' => 'Packed with care.', 'body' => 'A branded protective mailer folds shut around your album, pristine on its way to you.' ),
						array( 'eyebrow' => 'Worldwide', 'headline' => 'Delivered anywhere.', 'body' => 'Handcrafted here, shipped with care across the world — wherever your memories belong.' ),
					),
				),
			),
		),

		/* ---------------- Materials / configurator ---------------- */
		array(
			'id'     => 'materials',
			'label'  => 'Materials',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Crafted with Details' ),
				array( 'key' => 'title', 'label' => 'Title (one line per row)', 'type' => 'textarea', 'default' => "Configure your\nalbum." ),
				array( 'key' => 'lede', 'label' => 'Sub-text', 'type' => 'textarea', 'default' => 'Every album is bound by hand in the material of your choosing. Choose a cover material and foil — the weave, the light and the foil update live on your album.' ),
				array( 'key' => 'chamois_label', 'label' => 'Chamois group label', 'type' => 'text', 'default' => 'Cover Material — Chamois' ),
				array( 'key' => 'chamois_sub', 'label' => 'Chamois group sub', 'type' => 'text', 'default' => 'Velvet suede' ),
				array( 'key' => 'linen_label', 'label' => 'Linen group label', 'type' => 'text', 'default' => 'Cover Material — Linen' ),
				array( 'key' => 'linen_sub', 'label' => 'Linen group sub', 'type' => 'text', 'default' => 'Natural weave' ),
				array( 'key' => 'foil_label', 'label' => 'Foil group label', 'type' => 'text', 'default' => 'Foil' ),
				array( 'key' => 'foil_sub', 'label' => 'Foil group sub', 'type' => 'text', 'default' => 'Hand-pressed' ),
			),
		),

		/* ---------------- Craftsmanship ---------------- */
		array(
			'id'     => 'craft',
			'label'  => 'Craftsmanship',
			'fields' => array(
				array( 'key' => 'media', 'label' => 'Main image', 'type' => 'image', 'default' => '{ASSET}details/albumcover.png' ),
				array( 'key' => 'watch_label', 'label' => 'Play caption', 'type' => 'text', 'default' => 'Watch the Craft' ),
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Crafted with Details' ),
				array( 'key' => 'title', 'label' => 'Title', 'type' => 'text', 'default' => 'Where Art Meets Craftsmanship' ),
				array( 'key' => 'body', 'label' => 'Body', 'type' => 'textarea', 'default' => 'Every album is a masterpiece in the making. From the finest materials to the last finishing touch, we ensure your memories are preserved with unmatched quality.' ),
				array(
					'key' => 'checks', 'label' => 'Checklist', 'type' => 'repeater', 'item_label' => 'Item',
					'fields' => array( array( 'key' => 'text', 'label' => 'Text', 'type' => 'text' ) ),
					'default' => array(
						array( 'text' => 'Premium Materials' ),
						array( 'text' => 'Handcrafted Finishing' ),
						array( 'text' => 'True-to-Life Color Accuracy' ),
						array( 'text' => 'Archival Quality Printing' ),
					),
				),
				array(
					'key' => 'thumbs', 'label' => 'Detail thumbnails', 'type' => 'repeater', 'item_label' => 'Thumb',
					'fields' => array( array( 'key' => 'image', 'label' => 'Image', 'type' => 'image' ) ),
					'default' => array(
						array( 'image' => '{ASSET}details/detail-01.jpg' ),
						array( 'image' => '{ASSET}details/detail-02.jpg' ),
						array( 'image' => '{ASSET}details/detail-03.jpg' ),
					),
				),
			),
		),

		/* ---------------- For Photographers ---------------- */
		array(
			'id'     => 'photographers',
			'label'  => 'For Photographers',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'For Photographers' ),
				array( 'key' => 'title', 'label' => 'Title', 'type' => 'text', 'default' => 'Your work, bound to last.' ),
				array( 'key' => 'body', 'label' => 'Body', 'type' => 'textarea', 'default' => 'Partner with Mementos Studio for trade pricing, white-label albums and priority craftsmanship — deliver your clients an heirloom that carries your name.' ),
				array( 'key' => 'cta_label', 'label' => 'Button', 'type' => 'text', 'default' => 'Become a Partner' ),
			),
		),

		/* ---------------- Process ---------------- */
		array(
			'id'     => 'process',
			'label'  => 'Process',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Our Process' ),
				array( 'key' => 'title', 'label' => 'Title', 'type' => 'text', 'default' => 'From moment to heirloom' ),
				array(
					'key' => 'steps', 'label' => 'Steps', 'type' => 'repeater', 'item_label' => 'Step',
					'fields' => array(
						array( 'key' => 'num', 'label' => 'Number', 'type' => 'text' ),
						array( 'key' => 'title', 'label' => 'Title', 'type' => 'text' ),
						array( 'key' => 'body', 'label' => 'Body', 'type' => 'textarea' ),
					),
					'default' => array(
						array( 'num' => '01', 'title' => 'Consult', 'body' => 'We learn your story, style and the moments that matter most.' ),
						array( 'num' => '02', 'title' => 'Design', 'body' => 'Layflat spreads are designed and refined until every page sings.' ),
						array( 'num' => '03', 'title' => 'Craft', 'body' => 'Archival prints are hand-bound in your chosen material and foil.' ),
						array( 'num' => '04', 'title' => 'Deliver', 'body' => 'Packed in its presentation box and mailer, shipped worldwide.' ),
					),
				),
			),
		),

		/* ---------------- Gallery ---------------- */
		array(
			'id'     => 'gallery',
			'label'  => 'Gallery',
			'fields' => array(
				array( 'key' => 'eyebrow', 'label' => 'Eyebrow', 'type' => 'text', 'default' => 'Gallery' ),
				array( 'key' => 'title', 'label' => 'Title', 'type' => 'text', 'default' => 'Real spreads, real stories' ),
				array(
					'key' => 'images', 'label' => 'Gallery images', 'type' => 'repeater', 'item_label' => 'Image',
					'fields' => array( array( 'key' => 'image', 'label' => 'Image', 'type' => 'image' ) ),
					'default' => array(
						array( 'image' => '{ASSET}spreads/spread-01.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-03.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-05.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-07.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-09.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-10.jpg' ),
					),
				),
			),
		),

		/* ---------------- Proof: stats + testimonials ---------------- */
		array(
			'id'     => 'proof',
			'label'  => 'Stats & Testimonials',
			'fields' => array(
				array(
					'key' => 'stats', 'label' => 'Stats', 'type' => 'repeater', 'item_label' => 'Stat',
					'fields' => array(
						array( 'key' => 'k', 'label' => 'Number', 'type' => 'text' ),
						array( 'key' => 'v', 'label' => 'Label', 'type' => 'text' ),
					),
					'default' => array(
						array( 'k' => '20K+', 'v' => 'Albums Crafted' ),
						array( 'k' => '1K+', 'v' => 'Photographers Worldwide' ),
						array( 'k' => '98%', 'v' => 'Client Satisfaction' ),
						array( 'k' => '100%', 'v' => 'Handcrafted with Love' ),
					),
				),
				array(
					'key' => 'testimonials', 'label' => 'Testimonials', 'type' => 'repeater', 'item_label' => 'Quote',
					'fields' => array(
						array( 'key' => 'quote', 'label' => 'Quote', 'type' => 'textarea' ),
						array( 'key' => 'name', 'label' => 'Name', 'type' => 'text' ),
						array( 'key' => 'role', 'label' => 'Role', 'type' => 'text' ),
					),
					'default' => array(
						array( 'quote' => 'The quality, the packaging, the attention to detail — absolutely unmatched. Our couples are in love with their albums!', 'name' => 'Ahmed Al Hashmi', 'role' => 'Wedding Photographer' ),
						array( 'quote' => 'Every spread lies perfectly flat and the foil is flawless. Mementos has become the only studio I trust with my clients\' memories.', 'name' => 'Layla Mansoor', 'role' => 'Portrait Photographer' ),
					),
				),
			),
		),

		/* ---------------- Instagram ---------------- */
		array(
			'id'     => 'instagram',
			'label'  => 'Instagram',
			'fields' => array(
				array( 'key' => 'label', 'label' => 'Strip label', 'type' => 'text', 'default' => 'Follow the craft — @mementos.studio' ),
				array(
					'key' => 'fallback', 'label' => 'Fallback images (used when no token / API fails)', 'type' => 'repeater', 'item_label' => 'Image',
					'fields' => array( array( 'key' => 'image', 'label' => 'Image', 'type' => 'image' ) ),
					'default' => array(
						array( 'image' => '{ASSET}spreads/spread-02.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-04.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-06.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-08.jpg' ),
						array( 'image' => '{ASSET}details/detail-04.jpg' ),
						array( 'image' => '{ASSET}spreads/spread-10.jpg' ),
					),
				),
			),
		),

		/* ---------------- Final CTA ---------------- */
		array(
			'id'     => 'cta',
			'label'  => 'Final CTA',
			'fields' => array(
				array( 'key' => 'title', 'label' => 'Title (one line per row)', 'type' => 'textarea', 'default' => "Your story,\nmade to keep." ),
				array( 'key' => 'lede', 'label' => 'Sub-text', 'type' => 'textarea', 'default' => 'Handcrafted linen & chamois albums, foiled by hand and delivered worldwide.' ),
				array( 'key' => 'wa_label', 'label' => 'WhatsApp button', 'type' => 'text', 'default' => 'Order on WhatsApp' ),
				array( 'key' => 'email_label', 'label' => 'Email button', 'type' => 'text', 'default' => 'Email the Studio' ),
				array( 'key' => 'foot', 'label' => 'Footnote', 'type' => 'text', 'default' => 'Where moments become timeless treasures.' ),
			),
		),

		/* ---------------- Footer ---------------- */
		array(
			'id'     => 'footer',
			'label'  => 'Footer',
			'fields' => array(
				array( 'key' => 'tagline', 'label' => 'Tagline', 'type' => 'text', 'default' => 'Luxury handcrafted albums, made in Bahrain.' ),
				array( 'key' => 'made', 'label' => 'Made-in label', 'type' => 'text', 'default' => 'Made in Bahrain' ),
				array( 'key' => 'copyright', 'label' => 'Copyright', 'type' => 'text', 'default' => '© 2026 Mementos Studio. All rights reserved.' ),
			),
		),
	);
}

/**
 * Build the default content array from the schema.
 *
 * @return array
 */
function mementos_default_content() {
	$content = array();
	foreach ( mementos_schema() as $section ) {
		$content[ $section['id'] ] = array();
		foreach ( $section['fields'] as $field ) {
			$content[ $section['id'] ][ $field['key'] ] = isset( $field['default'] ) ? $field['default'] : '';
		}
	}
	return $content;
}

/**
 * Merged saved + default content.
 *
 * @return array
 */
function mementos_get_content() {
	$saved = get_option( 'mementos_content', array() );
	if ( ! is_array( $saved ) ) {
		$saved = array();
	}
	$defaults = mementos_default_content();
	$out      = $defaults;
	foreach ( $saved as $sid => $fields ) {
		if ( ! is_array( $fields ) ) {
			continue;
		}
		foreach ( $fields as $key => $val ) {
			$out[ $sid ][ $key ] = $val;
		}
	}
	return $out;
}
