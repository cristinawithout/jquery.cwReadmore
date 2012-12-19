/******************************************
 * cwReadMore jQuery Plugin
 * Allows for automatically creating a "read more" link by specifying the number
 * of lines of text that should be shown.
 *
 * @author          cristinawithout
 * @copyright       Copyright (c) 2012 cristinawithout
 * @license         This cristinawithout readmore jQuery plug-in is dual
 *                  licensed under the MIT and GPL licenses.
 * @link            http://www.cristinawithout.com
 * @docs            http://www.cristinawithout.com/plugins/readmore
 * @version         Version 1.0
 *
 ******************************************/

(function($){
  $.fn.cwReadMore = function(options) {
    var selector = this.selector;

    // defaults
    var defaults = {
      more_text               : 'Read More',
      less_text               : 'Read Less',
      number_lines            : 5,
      height                  : 60, // in pixels. applies if above is null
      duration                : 500,
      easing                  : 'linear',
      complete                : function($parent) {},
      nocutoff_elems          : 'img',
      nocutoff_elems_duration : 200,
      nocutoff_elems_easing   : 'linear',
      nocutoff_elems_complete : function($hidden_element, $parent) {},
      child_selector          : '',
      remove_first_margin_padding : true,
      allow_less_than_default : false,
      inpreview_nocutoff_show : true,
      inpreview_nocutoff_noshow_collapse : true, // applies if above is false
      inpreview_nocutoff_only_show : 'cutoff',
      debug : false
    };

    /*
     * OPTIONS
     *
     * more_text : Text to use as the "read more" link.
     *
     * less_text : Text to use as the "read less" link.
     *
     * number_lines : Integer for the number of lines of text to show.
     *   Set to null and set height to use a fixed height instead
     *
     * height : Integer for the height of the preview when number_lines
     *   is null. In pixels.
     *
     * duration : Integer in milliseconds for how long the transition from
     *   "read more" to "read less" takes. See jQuery.animate() docs.
     *
     * easing : String indicating the easing function to use.
     *   See jQuery.animate() docs.
     *
     * complete : Function called when "read more" to "read less" and vice
     *   versa is complete
     *   params :
     *      $link_elem : The "read more" / "read less" link
     *      $parent : The element on which the plugin was called
     *
     * nocutoff_elems : Comma seperated list of selectors that indicate which
     *   elements should be displayed in full or hidden if they're unable
     *   to be fully displayed within the default height
     *
     * nocutoff_elems_duration : Integer in milliseconds for how long the
     *   transition between hiding/showing the "nocutoff_elems" takes. See
     *   jQuery.animate() docs.
     *
     * nocutoff_elems_easing : String indicating the function to use to
     *   show/hide the "nocutoff_elems" elements. See jQuery.animate() docs.
     *
     * nocutoff_elems_complete : Function called when show/hide of
     *   "nocutoff_elems" elements is complete. See jQuery.animate() docs.
     *   params :
     *     $hidden_element : The element was was shown/hidden
     *     $parent : The element on which the plugin was called
     *
     * child_selector : String selector for the child elements whose height
     *   should be tested in the preview. Default is all children. Selector will
     *   only apply to immediate children. See jQuery.children() docs. Any
     *   immediate children not matching this selector will be hidden from
     *   preview.
     *
     * remove_first_margin_padding :
     *   true: Remove margin and padding at the top of the first element.
     *   false: Leave margin and padding at the top of the first element (may
     *     cause cutoff of text)
     *
     * allow_less_than_default :
     *   If the visible element height(s) are less than the default
     *     true : Use the visible element height for the preview.
     *     false : Add padding to the "read more" link so the preview occupies
     *       the same space as the default height.
     *
     *
     * inpreview_nocutoff_show :
     *   true : allow the "no cut off" elements to show in the preview if
     *     they fully fit into the default allowed height
     *   false : never show "no cut off" elements in the preview
     *
     * inpreview_nocutoff_noshow_collapse :
     *   Applicable only if inpreview_notcutoff_show is set to false
     *   true : Collapse the height of the nocutoff element so remaining move up
     *   false : Do no collpase the height of the nocutoff element. Remaining
     *     elements will stay in the same position. (This could cause the
     *     preview to appear as an empty div.)
     *
     * inpreview_nocutoff_only_show :
     *   How to handle a nocutoff element if it's the only thing that would be
     *   visible in the preview.
     *   'full' : Show the full element. (Will increase the preview height.)
     *   'cutoff' : Show the element partially, cut off at the default height.
     *   'hide' : Hide the nocutoff element and push the other child elements up
     *    to fill in the preview. (Previews could be empty if no other children)
     *
     */

    // extend defaults
    var options = $.extend(defaults, options);

    return this.each(function() {
      var $elem = $(this);
      $elem.data('cw-readmore-options', options);
      $elem.data('cw-reamore-selector', selector);

      var height_default = 0;
      if(options.number_lines != null) {
        //use number of lines
        var line_height = parseInt($elem.css('line-height'), 10);
        if(!line_height || isNaN(line_height)) {
          return;
        }

        height_default = line_height * options.number_lines;
      }
      else {
        //use a fixed height
        height_default = options.height;
      }
      debug(options.debug, 'height_default: ' + height_default);
      $elem.data('cw-readmore-height-default', height_default);

      var $children_all = $elem.children();
      if($children_all.length <= 0) {
        debug(options.debug, 'no children found. exiting.');
        return;
      }

      if(options.child_selector != '' && options.child_selector != '*') {
        $children = $elem.children(options.child_selector);
        if($children.length <= 0) {
          debug(options.debug, 'no children with selector "' + options.child_selector + '" found. exiting.');
          return;
        }
      }
      else {
        $children = $children_all;
      }

      var height_original = $elem.height();
      debug(options.debug, 'height_original: ' + height_original);

      /*
       * Due to collapsing margins, the true container height is not always
       * obtained, causing cutoffs at the bottom during full view.
       * Using the children's outerHeight to compensate
       */
      var height_total = 0;
      $children_all.each(function() {
        height_total += $(this).outerHeight(true);
      });
      debug(options.debug, 'height_total: ' + height_total);
      if(height_total > height_original) {
        height_original = height_total;
      }
      $elem.data('cw-readmore-height-original', height_original);

      if(height_original <= height_default) {
        debug(options.debug, 'height is below default. exiting.');
        return;
      }

      $elem.css({
        overflow : 'hidden'
      });

      var $nocutoff_elems = {};
      if(options.nocutoff_elems) {
        $nocutoff_elems = $elem.find(options.nocutoff_elems);
      }

      /*
       * If inpreview_nocutoff_show is false
       * nocutoff elements are not allowed to be shown in preview at all
       * Hide them and remove their height (if collapsed) before calculating
       */
      if($nocutoff_elems.length > 0 && !options.inpreview_nocutoff_show) {
        $nocutoff_elems.addClass('cw-readmore-do-hide');
        handle_hide_nocutoff($elem);
        nocutoff_hide_parents_if_only_child($elem);
      }

      if(options.remove_first_margin_padding) {
        var $child_first = $children_all.filter(':visible').first();
        $child_first.css({
          'margin-top' : '0',
          'padding-top' : '0'
        });

        $child_first.find("*:visible:first-child").css({
          'margin-top' : '0',
          'padding-top' : '0'
        });
      }


      var height_preview = determine_height_preview();
      debug(options.debug, 'height_preview: ' + height_preview);
      $elem.data('cw-readmore-height-preview', height_preview);


      //$nocutoff_elems.filter(':not(.cw-readmore-no-hide)').addClass('cw-readmore-do-hide');

      var $read_more = $('<a href="#">' + options.more_text + '</a>').click(function(e) {
        e.preventDefault();
        var $self = $(this);

        if($self.hasClass('cw-readmore-more-link')) {
          show_full($elem);
        }
        else {
          show_preview($elem);

        }

        $self.toggleClass('cw-readmore-more-link cw-readmore-less-link');
        $elem.toggleClass('cw-readmore-is-more cw-readmore-is-less');
      });

      $read_more.addClass('cw-readmore-more-link');
      $read_more.css({
        display : 'block'
      });

      var padding = $read_more.css('padding-top');
      if(!padding) {
        padding = 0;
      }
      padding = parseInt(padding, 10);
      $elem.data('cw-readmore-padding-original', padding);
      if(!options.allow_less_than_default && height_preview < height_default) {
        padding = padding + height_default - height_preview;
        debug(options.debug, 'preview padding: ' + padding);
      }
      $elem.data('cw-readmore-padding-new', padding);

      $elem.data('cw-readmore-link', $read_more);
      $elem.addClass('cw-readmore-is-less');
      $elem.after($read_more);
      $elem.css({
        height : height_preview
      });
      $elem.addClass('cw-readmore-processed');

      show_preview($elem);

      height_default = height_total = null;
      $children = $children_all = null;


      function determine_height_preview() {
        /*
         * To find visible preview height, determine child tag heights
         * so elements/text are not partially cut off
         */
        var height_preview = 0;
        var current_child_index = 0;
        $children.filter(':visible:not(:empty)').each(function(index) {
          debug(options.debug, 'child ' + index + ' height: ' + $(this).height());
          debug(options.debug, 'child ' + index + ' outerHeight: ' + $(this).outerHeight(true))
          var child_height = $(this).outerHeight(true);
          if(height_preview + child_height <= height_default) {
            height_preview += child_height;
          }
          else {
            current_child_index = index;
            return false; //stop adding when default reached
          }
        });

        debug(options.debug, 'current_child_index: ' + current_child_index);
        debug(options.debug, height_preview);

        /*
         * Children's heights don't exactly match the default height. Use the
         * last child checked before exceeding the default height to determine
         * what to use as the preview
         */
        if(height_preview < height_default) {
          var $current_child = $children.filter(':visible:nth-child(' + (current_child_index + 1) + ')');
          var $current_child_nocutoff = $current_child.find(options.nocutoff_elems);
          if($current_child_nocutoff.length <= 0 && current_child_index == 0) {
            //0 nocutoff elements AND first child
            debug(options.debug, 'current child has 0 nocutoff elemnts and first child');
            height_preview = height_default;
          }
          else if($current_child_nocutoff.length <= 0) {
            //0 nocutoff elements
            debug(options.debug, 'current child has 0 nocutoff elemnts');
            var current_padding = parseInt($current_child.css('padding-top'), 10);
            var current_line_height = parseInt($current_child.css('line-height'), 10);
            if(current_line_height && !isNaN(current_line_height)) {

              if(isNaN(current_padding)) {
                current_padding = 0;
              }
              var current_margin = parseInt($current_child.css('margin-top'), 10);
              if(isNaN(current_margin)) {
                current_margin = 0;
              }

              var new_height = current_line_height + current_padding + current_margin + height_preview;
              while(new_height < height_default) {
                height_preview = new_height;
                new_height = current_line_height  + height_preview;
              }
            }
          }
          else if(current_child_index == 0 && $current_child_nocutoff.length > 0 && $.trim($current_child.text()) == '') {
            //first child has nocutoff element and no text elements
            debug(options.debug, 'current is first child, has cutoff element, no text');
            var $first_nocutoff = $current_child_nocutoff.first();
            switch(options.inpreview_nocutoff_only_show) {
              case 'full':
                $first_nocutoff.addClass('cw-readmore-no-hide');
                height_preview = $first_nocutoff.outerHeight(true);
                break;
              case 'cutoff':
                $first_nocutoff.addClass('cw-readmore-no-hide');
                height_preview = height_default;
                break;
              case 'hide':
                $first_nocutoff.addClass('cw-readmore-do-hide');
                handle_hide_nocutoff($elem);
                nocutoff_hide_parents_if_only_child($elem);
                handle_display_none_hide($elem);
                return determine_height_preview();
                break;
            }
          }
          else {
            debug(options.debug, 'default current child handling');
          //@TODO: Implement additional variations
          }
        }

        return height_preview;
      }

    });


  }


  function nocutoff_hide_parents_if_only_child($elem) {
    var selector = $elem.data('cw-readmore-selector');
    var $hide = $elem.find('.cw-readmore-hide-parents:not(.cw-readmore-hide-parents-processed)');
    $hide.parentsUntil(selector).each(function() {
      if($(this).children().length == 1) {
        $(this).addClass('cw-readmore-display-none');
      }
    });
    $hide.addClass('cw-readmore-hide-parents-processed');
  }

  function handle_hide_nocutoff($elem) {
    var options = $elem.data('cw-readmore-options');
    var selector = $elem.data('cw-readmore-selector');
    var collapse = options.inpreview_nocutoff_noshow_collapse;

    var $hide = $elem.find('.cw-readmore-do-hide:not(.cw-readmore-do-hide-processed)');
    if(!$elem.hasClass('cw-readmore-processed')) {
      $hide.css({
        opacity : '0',
        height : collapse ? '0' : 'auto'
      });
      if(collapse) {
        $hide.addClass('cw-readmore-hide-parents');
      }
    }
    else {
      $hide.animate(
      {
        opacity: '0'
      },
      options.nocutoff_elems_duration,
      options.nocutoff_elems_easing,
      function() {
        var $nocutoff_elem = $(this);
        if(collapse) {
          $nocutoff_elem.css({
            height : '0'
          });
        }
        options.nocutoff_elems_complete($nocutoff_elem, $elem);
      }
      );

    }




    $hide.addClass('cw-readmore-do-hide-processed');
  }

  function handle_show_nocutoff($elem) {
    var options = $elem.data('cw-readmore-options');
    var $hide = $elem.find('.cw-readmore-do-hide');
    $hide.css({
      height : 'auto'
    });
    $hide.animate(
    {
      opacity : '1'
    },
    options.nocutoff_elems_duration,
    options.nocutoff_elems_easing,
    function() {
      options.nocutoff_elems_complete($(this), $elem);
    }
    );

    $hide.removeClass('cw-readmore-do-hide-processed');
  }

  function handle_display_none_hide($elem) {
    var $hide = $elem.find('.cw-readmore-display-none:not(.cw-readmore-display-none-processed)');
    $hide.hide();
    $hide.addClass('cw-readmore-display-none-processed');
  }

  function handle_display_none_show($elem) {
    var $hide = $elem.find('.cw-readmore-display-none');
    $hide.removeClass('cw-readmore-display-none-processed');
    $hide.show();
  }


  function show_preview($elem) {
    handle_hide_nocutoff($elem);
    handle_display_none_hide($elem);

    var options = $elem.data('cw-readmore-options');
    var height_preview = $elem.data('cw-readmore-height-preview');
    $elem.animate(
    {
      height : height_preview
    },
    options.duration,
    options.easing,
    function() {
      options.complete($elem)
    }
    );

    var $read_more = $elem.data('cw-readmore-link');
    var padding = $elem.data('cw-readmore-padding-new');
    $read_more.css({
      'padding-top' : padding
    });

    $read_more.text(options.more_text);
  }

  function show_full($elem) {
    var $read_more = $elem.data('cw-readmore-link');
    var padding = $elem.data('cw-readmore-padding-original');
    $read_more.css({
      'padding-top' : padding
    });

    var height_original = $elem.data('cw-readmore-height-original');
    var options = $elem.data('cw-readmore-options');

    handle_show_nocutoff($elem);
    handle_display_none_show($elem);
    $elem.animate(
    {
      height : height_original
    },
    options.duration,
    options.easing,
    function() {
      options.complete($elem)
    }
    );

    $read_more.text(options.less_text);
  }

  function debug(debug, msg) {
    if(debug && window.console) {
      console.log(msg);
    }
    else if(debug) {
      alert(msg);
    }
  }

})(jQuery);
