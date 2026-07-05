<?php
/**
 * Instagram Basic Display API — live feed with caching + token refresh.
 *
 * Setup: create an app at developers.facebook.com, add the "Instagram Basic
 * Display" product, generate a long-lived access token for your account and
 * paste it under Settings → Mementos Studio → General & Contact.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Mementos_Studio_Instagram {

	const CRON_HOOK    = 'mementos_ig_refresh';
	const CACHE_PREFIX = 'mementos_ig_';

	public function __construct() {
		add_action( self::CRON_HOOK, array( __CLASS__, 'refresh_token' ) );
		add_action( 'init', array( __CLASS__, 'maybe_schedule' ) );
	}

	/**
	 * Ensure the daily refresh event exists once a token is present.
	 */
	public static function maybe_schedule() {
		$content = get_option( 'mementos_content', array() );
		$token   = isset( $content['general']['ig_token'] ) ? trim( (string) $content['general']['ig_token'] ) : '';
		if ( $token && ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + DAY_IN_SECONDS, 'daily', self::CRON_HOOK );
		}
		if ( ! $token && wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_clear_scheduled_hook( self::CRON_HOOK );
		}
	}

	/**
	 * Fetch recent media. Returns array of [ 'url', 'permalink', 'caption' ].
	 *
	 * @param string $token Long-lived access token.
	 * @param int    $limit How many items.
	 * @return array
	 */
	public static function get_media( $token, $limit = 6 ) {
		$token = trim( (string) $token );
		$limit = max( 1, min( 12, (int) $limit ) );
		if ( '' === $token ) {
			return array();
		}

		$cache_key = self::CACHE_PREFIX . md5( $token . '|' . $limit );
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$url = add_query_arg(
			array(
				'fields'       => 'id,caption,media_type,media_url,thumbnail_url,permalink',
				'limit'        => $limit,
				'access_token' => $token,
			),
			'https://graph.instagram.com/me/media'
		);

		$res = wp_remote_get( $url, array( 'timeout' => 8 ) );
		if ( is_wp_error( $res ) || 200 !== (int) wp_remote_retrieve_response_code( $res ) ) {
			// Cache the empty result briefly so a broken token doesn't hammer the API.
			set_transient( $cache_key, array(), 10 * MINUTE_IN_SECONDS );
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $res ), true );
		$out  = array();
		if ( isset( $body['data'] ) && is_array( $body['data'] ) ) {
			foreach ( $body['data'] as $item ) {
				$img = '';
				if ( isset( $item['media_type'] ) && 'VIDEO' === $item['media_type'] && ! empty( $item['thumbnail_url'] ) ) {
					$img = $item['thumbnail_url'];
				} elseif ( ! empty( $item['media_url'] ) ) {
					$img = $item['media_url'];
				}
				if ( '' === $img ) {
					continue;
				}
				$out[] = array(
					'url'       => esc_url_raw( $img ),
					'permalink' => isset( $item['permalink'] ) ? esc_url_raw( $item['permalink'] ) : '',
					'caption'   => isset( $item['caption'] ) ? wp_strip_all_tags( $item['caption'] ) : '',
				);
			}
		}

		set_transient( $cache_key, $out, HOUR_IN_SECONDS );
		return $out;
	}

	/**
	 * Daily: refresh the long-lived token (valid 60 days, refreshable after 24h).
	 */
	public static function refresh_token() {
		$content = get_option( 'mementos_content', array() );
		$token   = isset( $content['general']['ig_token'] ) ? trim( (string) $content['general']['ig_token'] ) : '';
		if ( '' === $token ) {
			return;
		}
		$url = add_query_arg(
			array(
				'grant_type'   => 'ig_refresh_token',
				'access_token' => $token,
			),
			'https://graph.instagram.com/refresh_access_token'
		);
		$res = wp_remote_get( $url, array( 'timeout' => 8 ) );
		if ( is_wp_error( $res ) || 200 !== (int) wp_remote_retrieve_response_code( $res ) ) {
			return;
		}
		$body = json_decode( wp_remote_retrieve_body( $res ), true );
		if ( ! empty( $body['access_token'] ) ) {
			$content['general']['ig_token'] = sanitize_text_field( $body['access_token'] );
			update_option( 'mementos_content', $content );
		}
	}
}

new Mementos_Studio_Instagram();

// Clean up the cron on deactivation.
register_deactivation_hook(
	MEMENTOS_FILE,
	function () {
		wp_clear_scheduled_hook( Mementos_Studio_Instagram::CRON_HOOK );
	}
);
