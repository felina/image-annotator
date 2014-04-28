var api = require('./api');

/**
 * Registers the annotator API function to jQuery objects. Called immediately on load of the script.
 * @param  {JQuery} $
 * @method Initializer
 */
(function($) {
  $.fn.annotator = api.annotator;
}(jQuery));