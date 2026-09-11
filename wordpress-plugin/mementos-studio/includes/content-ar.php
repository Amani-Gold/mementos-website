<?php
/**
 * Arabic starter copy.
 *
 * Same shape as the English defaults in content-schema.php, for the fields
 * that are actually words. Anything that is not language — photographs, links,
 * the WhatsApp number, product codes, the names foiled onto the sample cover —
 * is deliberately absent and stays shared between the two languages.
 *
 * This is a starting draft, not a final translation: every string here is
 * editable under Settings → Mementos Studio, where each text field carries an
 * Arabic box beside the English one. A field left empty there falls back to
 * the English, so the Arabic page is never blank.
 *
 * @package Mementos_Studio
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function mementos_default_content_ar() {
	return array(
		'seo'            => array(
			'title'       => 'مِمنتوز ستوديو — ألبومات صور فاخرة تُصنع يدويًا في البحرين',
			'description' => 'مِمنتوز ستوديو — ألبومات صور فاخرة من الكتان والشامواه تُصنع يدويًا، مع طباعة احترافية وتذهيب باليد وتغليف فاخر. ذكريات تدوم، صُنعت في البحرين.',
		),
		'nav'            => array(
			'cta_label' => 'اطلب الآن',
			'links'     => array(
				array( 'label' => 'المجموعات' ),
				array( 'label' => 'للمصورين' ),
				array( 'label' => 'الحرفة' ),
				array( 'label' => 'الخامات' ),
				array( 'label' => 'مراحل العمل' ),
			),
		),
		'hero'           => array(
			'eyebrow'      => 'ذكرياتك',
			'title'        => "تستحقّ\nأكثر من\nشاشة",
			'lede'         => 'ألبومات فاخرة تُصنع يدويًا، وطباعة احترافية، وذكريات تبقى — من البحرين.',
			'cta1_label'   => 'تصفّح المجموعات',
			'cta2_label'   => 'للمصورين',
			'bg_word'      => 'ذكريات',
			'scroll_label' => 'مرّر للبدء',
			'story'        => array(
				array( 'title' => 'صناعة يدوية' ),
				array( 'title' => 'طباعة بدقّة' ),
				array( 'title' => 'مصمّم ليبقى لأجيال' ),
				array( 'title' => 'أكثر من ألبوم' ),
				array( 'title' => 'إرث' ),
			),
			'spreads'      => array(
				array( 'caption' => 'قبل أن يبدأ كل شيء' ),
				array( 'caption' => 'نظرة أقرب' ),
				array( 'caption' => 'كل تفصيلة في مكانها' ),
				array( 'caption' => 'هما معًا' ),
				array( 'caption' => 'وصارت العائلة واحدة' ),
			),
		),
		'trust'          => array(
			'items' => array(
				array( 'label' => 'سنوات من التميّز' ),
				array( 'label' => 'صناعة يدوية بعناية' ),
				array( 'label' => 'خامات فاخرة' ),
				array( 'label' => 'جودة أرشيفية' ),
				array( 'label' => 'صُنع في البحرين' ),
			),
		),
		'collections'    => array(
			'eyebrow'    => 'مجموعاتنا المميّزة',
			'title'      => 'لكل قصة ألبومها',
			'link_label' => 'شاهدها ثلاثية الأبعاد',
			'cards'      => array(
				array(
					'name' => 'ستاندرد',
					'desc' => 'علبة صدفية أنيقة من الكتان بغطاء مذهّب يدويًا — إرث يرافق يومك.',
				),
				array(
					'name' => 'لاكشري',
					'desc' => 'علبة عميقة بمفصّلات، بلوح خشبي ومشبك ذهبي — تقديم يليق بالمناسبة.',
				),
				array(
					'name' => 'سلايدنغ',
					'desc' => 'غلاف منزلق من الكتان بنافذة أكريليك شفافة — ينزلق الألبوم إلى مكانه بهدوء.',
				),
				array(
					'name' => 'بوكِت',
					'desc' => 'صينية مؤطَّرة بحافة من الكتان — صغيرة، مدروسة، جاهزة للإهداء.',
				),
			),
		),
		'collections3d'  => array(
			'panels' => array(
				array(
					'eyebrow'  => 'المجموعات',
					'headline' => 'علبة لكل ألبوم.',
					'body'     => 'أربع طرق تقديم تُصنع يدويًا — ستاندرد، لاكشري، سلايدنغ وبوكِت — كلٌّ منها مبطَّن ومُتقَن ليحفظ ألبومك مدى العمر.',
				),
				array(
					'eyebrow'  => 'سلايدنغ',
					'headline' => 'ينزلق إلى مكانه.',
					'body'     => 'غلاف من الكتان مصنوع بدقّة الميليمتر — يستقرّ الألبوم فيه بانسياب هادئ ومدروس.',
				),
				array(
					'eyebrow'  => 'لاكشري',
					'headline' => 'مُغلَّف ليُهدى.',
					'body'     => 'علبة عميقة بمفصّلات تكشف لوحًا من الخشب الداكن، ثم تُرفع ليظهر الألبوم في الداخل.',
				),
				array(
					'eyebrow'  => 'التغليف',
					'headline' => 'مُعبَّأ بعناية.',
					'body'     => 'ظرف شحن يحمل هويّتنا يُطبَق حول ألبومك ليصلك سليمًا تمامًا.',
				),
				array(
					'eyebrow'  => 'حول العالم',
					'headline' => 'نوصله أينما كنت.',
					'body'     => 'يُصنع هنا ويُشحن بعناية إلى مختلف أنحاء العالم — إلى حيث تنتمي ذكرياتك.',
				),
			),
		),
		'materials'      => array(
			'eyebrow'       => 'عناية في التفاصيل',
			'title'         => "صمّم\nألبومك.",
			'lede'          => 'كل ألبوم يُجلَّد يدويًا بالخامة التي تختارها. اختر خامة الغلاف والتذهيب — ويتغيّر النسيج والضوء والتذهيب مباشرة على ألبومك.',
			'chamois_label' => 'خامة الغلاف — شامواه',
			'chamois_sub'   => 'مخمل ناعم',
			'linen_label'   => 'خامة الغلاف — كتان',
			'linen_sub'     => 'نسيج طبيعي',
			'foil_label'    => 'التذهيب',
			'foil_sub'      => 'بالضغط اليدوي',
		),
		'craft'          => array(
			'watch_label' => 'شاهد الحرفة',
			'eyebrow'     => 'عناية في التفاصيل',
			'title'       => 'حيث يلتقي الفنّ بالحرفة',
			'body'        => 'كل ألبوم تحفة قيد الصنع. من أجود الخامات إلى آخر لمسة، نحرص على حفظ ذكرياتك بجودة لا تُضاهى.',
			'checks'      => array(
				array( 'text' => 'خامات فاخرة' ),
				array( 'text' => 'تشطيب يدوي' ),
				array( 'text' => 'دقّة ألوان مطابقة للواقع' ),
				array( 'text' => 'طباعة بجودة أرشيفية' ),
			),
		),
		'photographers'  => array(
			'eyebrow'   => 'للمصورين',
			'title'     => 'أعمالك، مُجلَّدة لتبقى.',
			'body'      => 'كن شريكًا لمِمنتوز ستوديو: أسعار خاصة للمحترفين، وألبومات تحمل اسمك، وأولوية في التنفيذ — وسلّم عملاءك إرثًا يحمل توقيعك.',
			'cta_label' => 'كن شريكًا',
		),
		'process'        => array(
			'eyebrow' => 'مراحل العمل',
			'title'   => 'من اللحظة إلى الإرث',
			'steps'   => array(
				array( 'title' => 'استشارة', 'body' => 'نستمع إلى قصتك وأسلوبك واللحظات الأهمّ لديك.' ),
				array( 'title' => 'تصميم', 'body' => 'تُصمَّم الصفحات المسطّحة وتُنقَّح حتى تكتمل كل صفحة.' ),
				array( 'title' => 'تنفيذ', 'body' => 'تُجلَّد المطبوعات الأرشيفية يدويًا بالخامة والتذهيب اللذين اخترتهما.' ),
				array( 'title' => 'تسليم', 'body' => 'يُعبَّأ في علبته وظرف الشحن، ويُشحن إلى أي مكان في العالم.' ),
			),
		),
		'proof'          => array(
			'stats'        => array(
				array( 'v' => 'ألبوم أُنجز' ),
				array( 'v' => 'مصوّر حول العالم' ),
				array( 'v' => 'رضا العملاء' ),
				array( 'v' => 'صناعة يدوية بمحبّة' ),
			),
			'testimonials' => array(
				array(
					'quote' => 'الجودة والتغليف والاهتمام بالتفاصيل — لا مثيل لها. عملاؤنا يعشقون ألبوماتهم!',
					'name'  => 'أحمد الهاشمي',
					'role'  => 'مصوّر أعراس',
				),
				array(
					'quote' => 'كل صفحة تنبسط تمامًا، والتذهيب بلا عيب. صار مِمنتوز الاستوديو الوحيد الذي أأتمنه على ذكريات عملائي.',
					'name'  => 'ليلى منصور',
					'role'  => 'مصوّرة بورتريه',
				),
			),
		),
		'instagram'      => array(
			// U+200E (left-to-right mark) before the handle, so the @ stays with the
			// Latin name instead of drifting to the far side of the Arabic line
			'label' => "تابع الحرفة — \u{200E}@mementos.studio",
		),
		'cta'            => array(
			'title'       => "قصتك،\nمصنوعة لتبقى.",
			'lede'        => 'ألبومات من الكتان والشامواه تُصنع يدويًا، تُذهَّب باليد وتُشحن إلى العالم.',
			'shop_label'  => 'اطلب من المتجر',
			'wa_label'    => 'اطلب عبر واتساب',
			'email_label' => 'راسل الاستوديو',
			'foot'        => 'حيث تتحوّل اللحظات إلى كنوز خالدة.',
		),
		'footer'         => array(
			'tagline'   => 'ألبومات فاخرة تُصنع يدويًا في البحرين.',
			'made'      => 'صُنع في البحرين',
			'copyright' => '© 2026 مِمنتوز ستوديو. جميع الحقوق محفوظة.',
		),
	);
}
