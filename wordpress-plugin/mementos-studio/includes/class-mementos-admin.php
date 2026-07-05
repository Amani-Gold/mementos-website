<?php
/**
 * Admin settings UI — generated from the content schema.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Mementos_Studio_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_post_mementos_save', array( $this, 'save' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
	}

	public function menu() {
		add_options_page(
			'Mementos Studio',
			'Mementos Studio',
			'manage_options',
			'mementos-studio',
			array( $this, 'render_page' )
		);
	}

	public function assets( $hook ) {
		if ( 'settings_page_mementos-studio' !== $hook ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_style( 'mementos-admin', MEMENTOS_URL . 'admin/admin.css', array(), MEMENTOS_VER );
		wp_enqueue_script( 'mementos-admin', MEMENTOS_URL . 'admin/admin.js', array( 'jquery' ), MEMENTOS_VER, true );
	}

	/* ------------------------------------------------------------------ save */

	public function save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Not allowed' );
		}
		check_admin_referer( 'mementos_save' );

		$in    = isset( $_POST['content'] ) && is_array( $_POST['content'] ) ? wp_unslash( $_POST['content'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$clean = array();

		foreach ( mementos_schema() as $section ) {
			$sid           = $section['id'];
			$clean[ $sid ] = array();
			foreach ( $section['fields'] as $field ) {
				$key                  = $field['key'];
				$raw                  = isset( $in[ $sid ][ $key ] ) ? $in[ $sid ][ $key ] : ( 'repeater' === $field['type'] ? array() : '' );
				$clean[ $sid ][ $key ] = $this->sanitize_field( $field, $raw );
			}
		}

		update_option( 'mementos_content', $clean );
		// Reset Instagram cache so a new token/limit takes effect immediately.
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_mementos_ig_%' OR option_name LIKE '_transient_timeout_mementos_ig_%'" ); // phpcs:ignore

		wp_safe_redirect( admin_url( 'options-general.php?page=mementos-studio&updated=1' ) );
		exit;
	}

	private function sanitize_field( $field, $raw ) {
		switch ( $field['type'] ) {
			case 'textarea':
				return sanitize_textarea_field( (string) $raw );
			case 'url':
			case 'image':
				return $this->sanitize_urlish( (string) $raw );
			case 'repeater':
				$rows = array();
				if ( is_array( $raw ) ) {
					foreach ( $raw as $row ) {
						if ( ! is_array( $row ) ) {
							continue;
						}
						$clean_row = array();
						$non_empty = false;
						foreach ( $field['fields'] as $sub ) {
							$val                          = isset( $row[ $sub['key'] ] ) ? $row[ $sub['key'] ] : '';
							$clean_row[ $sub['key'] ]     = $this->sanitize_field( $sub, $val );
							if ( '' !== trim( (string) $clean_row[ $sub['key'] ] ) ) {
								$non_empty = true;
							}
						}
						if ( $non_empty ) {
							$rows[] = $clean_row;
						}
					}
				}
				return array_values( $rows );
			default:
				return sanitize_text_field( (string) $raw );
		}
	}

	/** Keep {ASSET} tokens intact, otherwise treat as a URL. */
	private function sanitize_urlish( $val ) {
		if ( 0 === strpos( $val, '{ASSET}' ) ) {
			return $val;
		}
		return esc_url_raw( $val );
	}

	/* ---------------------------------------------------------------- render */

	public function render_page() {
		$content = mementos_get_content();
		$schema  = mementos_schema();
		?>
		<div class="wrap mementos-admin">
			<h1>Mementos Studio</h1>
			<?php if ( isset( $_GET['updated'] ) ) : // phpcs:ignore ?>
				<div class="notice notice-success is-dismissible"><p>Saved.</p></div>
			<?php endif; ?>

			<p class="mm-intro">
				Add the <code>[mementos_studio]</code> shortcode (or the <em>Mementos Studio</em> block) to a
				<strong>full-width / blank</strong> page. Edit every photo and text below.
			</p>

			<h2 class="nav-tab-wrapper mm-tabs">
				<?php foreach ( $schema as $i => $section ) : ?>
					<a href="#mm-<?php echo esc_attr( $section['id'] ); ?>" class="nav-tab <?php echo 0 === $i ? 'nav-tab-active' : ''; ?>"><?php echo esc_html( $section['label'] ); ?></a>
				<?php endforeach; ?>
			</h2>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="mementos_save" />
				<?php wp_nonce_field( 'mementos_save' ); ?>

				<?php foreach ( $schema as $i => $section ) : ?>
					<div class="mm-panel" id="mm-<?php echo esc_attr( $section['id'] ); ?>" style="<?php echo 0 === $i ? '' : 'display:none'; ?>">
						<table class="form-table"><tbody>
							<?php
							foreach ( $section['fields'] as $field ) {
								$val = isset( $content[ $section['id'] ][ $field['key'] ] ) ? $content[ $section['id'] ][ $field['key'] ] : '';
								$this->render_field_row( $section['id'], $field, $val );
							}
							?>
						</tbody></table>
					</div>
				<?php endforeach; ?>

				<?php submit_button( 'Save changes' ); ?>
			</form>
		</div>
		<?php
	}

	private function render_field_row( $sid, $field, $val ) {
		$name = "content[{$sid}][{$field['key']}]";
		echo '<tr><th scope="row"><label>' . esc_html( $field['label'] ) . '</label>';
		if ( ! empty( $field['help'] ) ) {
			echo '<p class="description">' . esc_html( $field['help'] ) . '</p>';
		}
		echo '</th><td>';

		if ( 'repeater' === $field['type'] ) {
			$this->render_repeater( $name, $field, is_array( $val ) ? $val : array() );
		} else {
			$this->render_input( $name, $field, $val );
		}
		echo '</td></tr>';
	}

	private function render_input( $name, $field, $val ) {
		switch ( $field['type'] ) {
			case 'textarea':
				printf( '<textarea class="large-text" rows="3" name="%s">%s</textarea>', esc_attr( $name ), esc_textarea( $val ) );
				break;
			case 'image':
				$display = mementos_resolve( $val );
				echo '<div class="mm-media">';
				printf( '<div class="mm-thumb">%s</div>', $display ? '<img src="' . esc_url( $display ) . '" alt="" />' : '' );
				printf( '<input type="text" class="regular-text mm-media-input" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $display ) );
				echo '<button type="button" class="button mm-media-btn">Select image</button> ';
				echo '<button type="button" class="button mm-media-clear">Remove</button>';
				echo '</div>';
				break;
			case 'url':
				printf( '<input type="url" class="regular-text" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $val ) );
				break;
			default:
				printf( '<input type="text" class="regular-text" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $val ) );
		}
	}

	private function render_repeater( $name, $field, $rows ) {
		echo '<div class="mm-repeater" data-name="' . esc_attr( $name ) . '">';
		echo '<div class="mm-rows">';
		$idx = 0;
		foreach ( $rows as $row ) {
			$this->render_repeater_row( $name, $field, $row, $idx );
			$idx++;
		}
		echo '</div>';
		// Template row (index placeholder __i__).
		echo '<script type="text/template" class="mm-tpl">';
		$this->render_repeater_row( $name, $field, array(), '__i__' );
		echo '</script>';
		echo '<button type="button" class="button button-secondary mm-add">+ Add ' . esc_html( isset( $field['item_label'] ) ? $field['item_label'] : 'item' ) . '</button>';
		echo '</div>';
	}

	private function render_repeater_row( $name, $field, $row, $idx ) {
		echo '<div class="mm-row">';
		echo '<button type="button" class="mm-row-remove" aria-label="Remove">&times;</button>';
		foreach ( $field['fields'] as $sub ) {
			$sub_name = "{$name}[{$idx}][{$sub['key']}]";
			$sub_val  = isset( $row[ $sub['key'] ] ) ? $row[ $sub['key'] ] : '';
			echo '<div class="mm-subfield"><label>' . esc_html( $sub['label'] ) . '</label>';
			$this->render_input( $sub_name, $sub, $sub_val );
			echo '</div>';
		}
		echo '</div>';
	}
}
