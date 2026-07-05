/* global jQuery, wp */
jQuery(function ($) {
  var uid = Date.now();

  // Tabs
  $('.mm-tabs .nav-tab').on('click', function (e) {
    e.preventDefault();
    var id = $(this).attr('href');
    $('.mm-tabs .nav-tab').removeClass('nav-tab-active');
    $(this).addClass('nav-tab-active');
    $('.mm-panel').hide();
    $(id).show();
  });

  // Media picker
  $(document).on('click', '.mm-media-btn', function (e) {
    e.preventDefault();
    var $wrap = $(this).closest('.mm-media');
    var frame = wp.media({ title: 'Select image', button: { text: 'Use image' }, multiple: false });
    frame.on('select', function () {
      var a = frame.state().get('selection').first().toJSON();
      var url = a.sizes && a.sizes.large ? a.sizes.large.url : a.url;
      $wrap.find('.mm-media-input').val(url);
      $wrap.find('.mm-thumb').html('<img src="' + url + '" alt="" />');
    });
    frame.open();
  });

  $(document).on('click', '.mm-media-clear', function (e) {
    e.preventDefault();
    var $wrap = $(this).closest('.mm-media');
    $wrap.find('.mm-media-input').val('');
    $wrap.find('.mm-thumb').empty();
  });

  // Repeater add / remove
  $(document).on('click', '.mm-add', function (e) {
    e.preventDefault();
    var $rep = $(this).closest('.mm-repeater');
    var html = $rep.children('.mm-tpl').html().replace(/__i__/g, 'n' + uid++);
    $rep.children('.mm-rows').append(html);
  });

  $(document).on('click', '.mm-row-remove', function (e) {
    e.preventDefault();
    $(this).closest('.mm-row').remove();
  });
});
