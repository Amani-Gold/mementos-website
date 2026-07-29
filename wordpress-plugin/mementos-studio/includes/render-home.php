<?php
/**
 * Front-end homepage template. Receives $content (resolved).
 *
 * @package Mementos_Studio
 * @var array $content
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$c = $content;

/** Split a multiline value into <br>-joined escaped HTML. */
$lines = function ( $txt ) {
	$parts = preg_split( '/\r\n|\r|\n/', (string) $txt );
	return implode( '<br />', array_map( 'esc_html', $parts ) );
};

$wa   = 'https://wa.me/' . preg_replace( '/\D+/', '', (string) $c['general']['whatsapp'] );
$mail = 'mailto:' . sanitize_email( $c['general']['email'] );
$ig   = esc_url( $c['general']['instagram_url'] );

/* Instagram: live feed, else fallback images. */
$ig_items = Mementos_Studio_Instagram::get_media( $c['general']['ig_token'], (int) $c['general']['ig_limit'] );
if ( empty( $ig_items ) && ! empty( $c['instagram']['fallback'] ) ) {
	foreach ( $c['instagram']['fallback'] as $f ) {
		if ( ! empty( $f['image'] ) ) {
			$ig_items[] = array( 'url' => $f['image'], 'permalink' => $ig, 'caption' => '' );
		}
	}
}
?>
<div class="mementos-root">

	<div id="loader" class="loader" aria-hidden="true">
		<div class="loader__mark">
			<span class="loader__ms"><?php echo esc_html( mb_substr( $c['general']['brand_word'], 0, 1 ) ); ?>S</span>
			<span class="loader__name"><?php echo esc_html( $c['general']['brand_word'] . ' ' . $c['general']['brand_sub'] ); ?></span>
		</div>
		<div class="loader__bar"><i></i></div>
	</div>

	<a class="skip-link" href="#collections">Skip to content</a>

	<header class="nav" id="nav">
		<a class="nav__brand" href="#top" aria-label="<?php echo esc_attr( $c['general']['brand_word'] ); ?> home">
			<span class="nav__word"><?php echo esc_html( $c['general']['brand_word'] ); ?></span><span class="nav__sub"><?php echo esc_html( $c['general']['brand_sub'] ); ?></span>
		</a>
		<nav class="nav__links" aria-label="Primary">
			<?php foreach ( (array) $c['nav']['links'] as $lnk ) : ?>
				<a href="<?php echo esc_attr( $lnk['target'] ); ?>"><?php echo esc_html( $lnk['label'] ); ?></a>
			<?php endforeach; ?>
			<a class="nav__cta" href="<?php echo esc_url( $mail ); ?>"><?php echo esc_html( $c['nav']['cta_label'] ); ?></a>
		</nav>
		<button class="burger" id="burger" aria-label="Open menu" aria-controls="drawer" aria-expanded="false">
			<span></span><span></span><span></span>
		</button>
	</header>

	<div class="drawer" id="drawer">
		<nav class="drawer__inner" aria-label="Mobile">
			<?php foreach ( (array) $c['nav']['links'] as $lnk ) : ?>
				<a href="<?php echo esc_attr( $lnk['target'] ); ?>"><?php echo esc_html( $lnk['label'] ); ?></a>
			<?php endforeach; ?>
			<a class="drawer__cta" href="<?php echo esc_url( $wa ); ?>"><?php echo esc_html( $c['cta']['wa_label'] ); ?></a>
		</nav>
	</div>

	<main id="top">
		<!-- HERO -->
		<section class="hero album-scroll" id="albumScroll" aria-label="The album">
			<div class="pin hero__pin">
				<div class="hero__word" aria-hidden="true"><?php echo esc_html( $c['hero']['bg_word'] ); ?></div>
				<div class="stage-fit">
					<div class="stage" id="flipStage">
						<div class="ground"></div>
						<div class="album">
							<div class="spread">
								<div class="thickness" id="flipThickness"></div>
								<div class="page left" id="flipBaseLeft"></div>
								<div class="page right" id="flipBaseRight"></div>
								<div class="chrome">
									<div class="gutter"></div>
									<div class="sweep"><i id="flipSweep"></i></div>
									<div class="frame"></div>
									<div class="vignette"></div>
								</div>
								<div class="block-edge"></div>
								<div class="leaf" id="flipLeaf" style="display: none">
									<div class="face front" id="flipLeafFront"><div class="shade" id="flipLeafFrontShade"></div></div>
									<div class="face back" id="flipLeafBack"><div class="shade" id="flipLeafBackShade"></div></div>
								</div>
							</div>
							<div class="spine" aria-hidden="true"></div>
							<div class="cover" id="flipCover">
								<div class="face front">
									<div class="names"><?php echo esc_html( $c['hero']['cover_line1'] ); ?><span class="amp"><?php echo esc_html( $c['hero']['cover_amp'] ); ?></span><?php echo esc_html( $c['hero']['cover_line2'] ); ?></div>
									<div class="rule"></div>
									<div class="date"><?php echo esc_html( $c['hero']['cover_date'] ); ?></div>
								</div>
								<div class="face back"></div>
							</div>
						</div>
					</div>
				</div>

				<div class="hero__overlay">
					<div class="hero__copy">
						<p class="eyebrow"><?php echo esc_html( $c['hero']['eyebrow'] ); ?></p>
						<h1 class="hero__title"><?php echo $lines( $c['hero']['title'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></h1>
						<p class="hero__lede"><?php echo esc_html( $c['hero']['lede'] ); ?></p>
						<div class="hero__cta">
							<a class="btn btn--solid" href="<?php echo esc_attr( $c['hero']['cta1_target'] ); ?>"><?php echo esc_html( $c['hero']['cta1_label'] ); ?></a>
							<a class="btn btn--ghost" href="<?php echo esc_attr( $c['hero']['cta2_target'] ); ?>"><?php echo esc_html( $c['hero']['cta2_label'] ); ?></a>
						</div>
					</div>
					<aside class="story-rail" aria-hidden="true">
						<p class="story-rail__label">The Story</p>
						<ol>
							<?php foreach ( (array) $c['hero']['story'] as $st ) : ?>
								<li class="story-step"><span class="n"><?php echo esc_html( $st['num'] ); ?></span><span class="t"><?php echo esc_html( $st['title'] ); ?></span></li>
							<?php endforeach; ?>
						</ol>
					</aside>
				</div>

				<div class="caption"><span class="rule"></span><span class="txt" id="flipCapTxt"></span><span class="rule"></span></div>
				<div class="ticks" id="flipTicks" aria-hidden="true"></div>
				<a class="scroll-cue" href="#collections"><span><?php echo esc_html( $c['hero']['scroll_label'] ); ?></span><span class="line"></span></a>
			</div>
		</section>

		<!-- TRUST -->
		<section class="trust" aria-label="Why Mementos">
			<?php foreach ( (array) $c['trust']['items'] as $it ) : ?>
				<div class="trust__item">
					<?php if ( ! empty( $it['big'] ) ) : ?><span class="trust__k"><?php echo esc_html( $it['big'] ); ?></span><?php endif; ?>
					<span class="trust__v"><?php echo esc_html( $it['label'] ); ?></span>
				</div>
			<?php endforeach; ?>
		</section>

		<!-- COLLECTIONS -->
		<section class="collections" id="collections">
			<div class="sec-head">
				<div>
					<p class="eyebrow"><?php echo esc_html( $c['collections']['eyebrow'] ); ?></p>
					<h2 class="sec-title"><?php echo esc_html( $c['collections']['title'] ); ?></h2>
				</div>
				<a class="sec-link" href="#collections3d"><?php echo esc_html( $c['collections']['link_label'] ); ?> <span>&rarr;</span></a>
			</div>
			<div class="collections__grid">
				<?php foreach ( (array) $c['collections']['cards'] as $card ) : ?>
					<article class="col-card">
						<div class="col-card__img">
							<img loading="lazy" decoding="async" src="<?php echo esc_url( $card['image'] ); ?>" alt="<?php echo esc_attr( $card['name'] ); ?> album" />
						</div>
						<div class="col-card__body">
							<h3><?php echo esc_html( $card['name'] ); ?></h3>
							<p><?php echo esc_html( $card['desc'] ); ?></p>
							<a class="explore" href="#collections3d">Explore <span>&rarr;</span></a>
						</div>
					</article>
				<?php endforeach; ?>
			</div>
		</section>

		<!-- COLLECTIONS IN 3D -->
		<section id="collections3d" class="story3d" aria-label="Collections in 3D">
			<canvas id="stage" class="stage3d"></canvas>
			<?php foreach ( (array) $c['collections3d']['panels'] as $i => $panel ) : ?>
				<?php $align = ( 0 === $i % 3 ) ? 'center' : ( 1 === $i % 3 ? 'right' : 'left' ); ?>
				<div class="panel" data-panel="<?php echo esc_attr( $i ); ?>">
					<div class="copy copy--<?php echo esc_attr( $align ); ?>">
						<p class="eyebrow"><?php echo esc_html( $panel['eyebrow'] ); ?></p>
						<h2 class="headline"><?php echo esc_html( $panel['headline'] ); ?></h2>
						<p class="body"><?php echo esc_html( $panel['body'] ); ?></p>
					</div>
				</div>
			<?php endforeach; ?>
		</section>

		<!-- MATERIALS -->
		<section class="finish" id="materials">
			<div class="finish-copy">
				<p class="eyebrow"><?php echo esc_html( $c['materials']['eyebrow'] ); ?></p>
				<h2 class="sec-title"><?php echo $lines( $c['materials']['title'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></h2>
				<p class="finish-lede"><?php echo esc_html( $c['materials']['lede'] ); ?></p>
				<div class="swatch-group">
					<p class="swatch-group-label"><?php echo esc_html( $c['materials']['chamois_label'] ); ?> <span><?php echo esc_html( $c['materials']['chamois_sub'] ); ?></span></p>
					<div class="swatches" id="swChamois"></div>
				</div>
				<div class="swatch-group">
					<p class="swatch-group-label"><?php echo esc_html( $c['materials']['linen_label'] ); ?> <span><?php echo esc_html( $c['materials']['linen_sub'] ); ?></span></p>
					<div class="swatches" id="swLinen"></div>
				</div>
				<div class="swatch-group swatch-group--foil">
					<p class="swatch-group-label"><?php echo esc_html( $c['materials']['foil_label'] ); ?> <span><?php echo esc_html( $c['materials']['foil_sub'] ); ?></span></p>
					<div class="swatches swatches--foil" id="swFoil"></div>
				</div>
			</div>
			<div class="finish-stage">
				<span class="live-chip"><i></i> Live Preview</span>
				<div class="album-canvas-wrap">
					<div class="stage-spot" aria-hidden="true"></div>
					<canvas id="albumCanvas" width="1254" height="1254" aria-label="Album cover preview"></canvas>
					<div class="stage-floor" aria-hidden="true"></div>
					<div class="canvas-loading" id="canvasLoading">Loading album…</div>
				</div>
				<div class="finish-readout">
					<div class="ro"><span class="ro-k">Material</span><span class="ro-v" id="matLabel">Chamois · MS01</span></div>
					<div class="ro"><span class="ro-k">Foil</span><span class="ro-v" id="foilLabel">Gold foil</span></div>
				</div>
			</div>
		</section>

		<!-- CRAFT -->
		<section class="craft" id="craft">
			<div class="craft__media">
				<img loading="lazy" decoding="async" src="<?php echo esc_url( $c['craft']['media'] ); ?>" alt="<?php echo esc_attr( $c['craft']['title'] ); ?>" />
				<span class="craft__play" aria-hidden="true">▶</span>
				<span class="craft__watch"><?php echo esc_html( $c['craft']['watch_label'] ); ?></span>
			</div>
			<div class="craft__copy">
				<p class="eyebrow"><?php echo esc_html( $c['craft']['eyebrow'] ); ?></p>
				<h2 class="sec-title"><?php echo esc_html( $c['craft']['title'] ); ?></h2>
				<p class="body"><?php echo esc_html( $c['craft']['body'] ); ?></p>
				<ul class="checks">
					<?php foreach ( (array) $c['craft']['checks'] as $ck ) : ?>
						<li><?php echo esc_html( $ck['text'] ); ?></li>
					<?php endforeach; ?>
				</ul>
				<div class="craft__thumbs">
					<?php foreach ( (array) $c['craft']['thumbs'] as $th ) : ?>
						<img loading="lazy" decoding="async" src="<?php echo esc_url( $th['image'] ); ?>" alt="Craft detail" />
					<?php endforeach; ?>
				</div>
			</div>
		</section>

		<!-- FOR PHOTOGRAPHERS -->
		<section class="photographers" id="photographers">
			<div class="photographers__inner">
				<p class="eyebrow"><?php echo esc_html( $c['photographers']['eyebrow'] ); ?></p>
				<h2 class="sec-title"><?php echo esc_html( $c['photographers']['title'] ); ?></h2>
				<p class="body"><?php echo esc_html( $c['photographers']['body'] ); ?></p>
				<a class="btn btn--solid" href="<?php echo esc_url( $mail ); ?>"><?php echo esc_html( $c['photographers']['cta_label'] ); ?></a>
			</div>
		</section>

		<!-- PROCESS -->
		<section class="process" id="process">
			<div class="sec-head sec-head--center">
				<div>
					<p class="eyebrow"><?php echo esc_html( $c['process']['eyebrow'] ); ?></p>
					<h2 class="sec-title"><?php echo esc_html( $c['process']['title'] ); ?></h2>
				</div>
			</div>
			<ol class="process__grid">
				<?php foreach ( (array) $c['process']['steps'] as $step ) : ?>
					<li><span class="process__n"><?php echo esc_html( $step['num'] ); ?></span><h3><?php echo esc_html( $step['title'] ); ?></h3><p><?php echo esc_html( $step['body'] ); ?></p></li>
				<?php endforeach; ?>
			</ol>
		</section>

		<!-- PROOF -->
		<section class="proof" id="proof">
			<div class="stats">
				<?php foreach ( (array) $c['proof']['stats'] as $s ) : ?>
					<div class="stat"><span class="stat__k"><?php echo esc_html( $s['k'] ); ?></span><span class="stat__v"><?php echo esc_html( $s['v'] ); ?></span></div>
				<?php endforeach; ?>
			</div>
			<div class="tstm-wrap">
				<span class="tstm-quote" aria-hidden="true">&ldquo;</span>
				<?php foreach ( (array) $c['proof']['testimonials'] as $i => $t ) : ?>
					<blockquote class="tstm<?php echo 0 === $i ? ' is-active' : ''; ?>">
						<p><?php echo esc_html( $t['quote'] ); ?></p>
						<footer><strong><?php echo esc_html( $t['name'] ); ?></strong><span><?php echo esc_html( $t['role'] ); ?></span></footer>
					</blockquote>
				<?php endforeach; ?>
				<div class="tstm-nav">
					<button class="tstm-prev" aria-label="Previous testimonial">&larr;</button>
					<button class="tstm-next" aria-label="Next testimonial">&rarr;</button>
				</div>
			</div>
		</section>

		<!-- INSTAGRAM -->
		<section class="insta" aria-label="Follow us">
			<p class="eyebrow insta__label"><?php echo esc_html( $c['instagram']['label'] ); ?></p>
			<div class="insta__row">
				<?php foreach ( $ig_items as $item ) : ?>
					<a href="<?php echo esc_url( $item['permalink'] ? $item['permalink'] : $ig ); ?>" class="insta__cell" target="_blank" rel="noopener">
						<img loading="lazy" decoding="async" src="<?php echo esc_url( $item['url'] ); ?>" alt="<?php echo esc_attr( $item['caption'] ? $item['caption'] : 'Instagram post' ); ?>" />
					</a>
				<?php endforeach; ?>
			</div>
		</section>

		<!-- FINAL CTA -->
		<section class="cta-final" id="contact">
			<div class="cta-mark"><span class="loader__ms"><?php echo esc_html( mb_substr( $c['general']['brand_word'], 0, 1 ) ); ?>S</span><span><?php echo esc_html( $c['general']['brand_word'] . ' ' . $c['general']['brand_sub'] ); ?></span></div>
			<h2 class="cta-title"><?php echo $lines( $c['cta']['title'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></h2>
			<p class="cta-lede"><?php echo esc_html( $c['cta']['lede'] ); ?></p>
			<div class="cta-row">
				<a class="btn btn--solid" href="<?php echo esc_url( $wa ); ?>"><?php echo esc_html( $c['cta']['wa_label'] ); ?></a>
				<a class="btn btn--ghost" href="<?php echo esc_url( $mail ); ?>"><?php echo esc_html( $c['cta']['email_label'] ); ?></a>
			</div>
			<p class="cta-foot"><?php echo esc_html( $c['cta']['foot'] ); ?></p>
		</section>
	</main>

	<footer class="footer">
		<div class="footer__brand">
			<span class="nav__word"><?php echo esc_html( $c['general']['brand_word'] ); ?></span><span class="nav__sub"><?php echo esc_html( $c['general']['brand_sub'] ); ?></span>
			<p><?php echo esc_html( $c['footer']['tagline'] ); ?></p>
		</div>
		<nav class="footer__col" aria-label="Collections">
			<h4>Collections</h4>
			<?php foreach ( (array) $c['collections']['cards'] as $card ) : ?>
				<a href="#collections"><?php echo esc_html( $card['name'] ); ?></a>
			<?php endforeach; ?>
		</nav>
		<nav class="footer__col" aria-label="Studio">
			<h4>Studio</h4>
			<a href="#craft">Craft</a>
			<a href="#process">Process</a>
			<a href="#photographers">For Photographers</a>
		</nav>
		<div class="footer__col">
			<h4>Contact</h4>
			<a href="<?php echo esc_url( $wa ); ?>">WhatsApp</a>
			<a href="<?php echo esc_url( $mail ); ?>">Email</a>
			<a href="<?php echo $ig; // phpcs:ignore ?>" target="_blank" rel="noopener">Instagram</a>
			<span class="footer__made"><?php echo esc_html( $c['footer']['made'] ); ?></span>
		</div>
		<p class="footer__copy"><?php echo esc_html( $c['footer']['copyright'] ); ?></p>
	</footer>

	<a class="wa-float" href="<?php echo esc_url( $wa ); ?>" aria-label="Chat on WhatsApp" target="_blank" rel="noopener">
		<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
			<path fill="currentColor" d="M16 3C9.4 3 4 8.4 4 15c0 2.3.7 4.5 1.9 6.4L4 29l7.8-2c1.8 1 3.9 1.5 6 1.5 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4 1 1-3.9-.2-.4c-1-1.6-1.6-3.5-1.6-5.4 0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10.4-9.5 10.4zm5.5-7.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2s-.8 1-.9 1.1c-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.7.8.6-.1 1.8-.7 2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4z" />
		</svg>
	</a>

	<div class="lightbox" id="lightbox" aria-hidden="true"><img alt="" /></div>
	<div class="grain" aria-hidden="true"></div>
</div>
