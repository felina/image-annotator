
(function( $ ) {
  $.fn.annotator = function(src, width, height) {
    return this.each(function() {
      $parent = $(this);
      var $zoomin = $('<button>Zoom In</button>');
      var $zoomout = $('<button>Zoom Out</button>');
      var $img = $('<img src="'+src+'"></img>');
      var $container = $('<div></div>');
      $parent.append($zoomin);
      $parent.append('<br></br>');
      $parent.append($zoomout);
      $parent.append($container);
      $container.css({
        "width" : width+"px",
        "height" : height+"px",
        "position" : "relative",
        "margin" : "20px 0 0 0",
        "background" : "gray",
        "overflow" : "hidden"
      });
      $container.append($img);
      $img.draggable();
      $img.css({
        "position" : "absolute",
        "left" : "0",
        "top" : "0",
        "z-index" : "1",
        "height" : "100%",
        "width" : "100%"
      });
      var originalHeight = $img.height();
      $zoomin.on("click", function (){
        zoom($img, $parent, originalHeight, 1.25);
      });
      $zoomout.on("click", function(){
        zoom($img, $parent, originalHeight, 0.8);
      });
    });
  };
}( jQuery ));

var zoom = function($img, $parent, originalHeight, scale){
  var offset = $img.offset();
  var width = $img.width();
  var height = $img.height();
  
  if(scale < 1 && originalHeight >= height)
      return;

  var diffWidth = (width * scale) - width;
  var diffHeight = (height * scale) - height;

  var leftPercent = (($parent.width() / 2) - offset.left) / width;
  var topPercent = (($parent.height() / 2) - offset.top) / height;

  $img.offset({top: offset.top - (diffHeight * topPercent), left: offset.left - (diffWidth * leftPercent)});

  $img.width(width * scale).height(height * scale);
};