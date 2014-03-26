var Annotator = require('./annotator');

// The annotator function - appplicable to any jQuery object collection
module.exports.annotator = function(input) {
  var w, h;

  if (typeof input.src !== "undefined") {
    input.img = $('<img src="'+input.src+'"></img>').hide();
  }
  else if (typeof input.img === "undefined") {
    input.img = null;
  }

  if (typeof input.features === "undefined") {
    input.features = null;
  }
  else if (!input.features instanceof Array) {
    throw "Error: input.features is not a valid Array instance";
  }

  if (typeof input.width === "undefined")   {w = 640;}
  else                                      {w = input.width;}

  if (typeof input.width === "undefined")   {h = 480;}
  else                                      {h = input.height;}

  // Check for annotator class
  var $parent = $(this);
  var a;

  // Update if we're passed an existing annotator
  if ($parent.hasClass("annotator")) {
    a = $parent.data("Annotator");
    a.update(input.img, w, h);
  }
  else {
    a = new Annotator(input.img, w, h);
    a.parent = $parent;
    a.build($parent);
  }

  // Apply input
  a.featuresIn(input);
  a.annsIn(input);
  a.cssIn(input);

  a.showChange();

  return a;
};
