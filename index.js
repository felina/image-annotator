var imgcss = {
  position : "absolute",
  left : 0,
  top : 0,
  "z-index" : 1,
};

var containercss = {
  position : "relative",
  // "margin" : "20px 0 0 0",
  // "background" : "gray",
  overflow : "hidden"
};

var canvascss = {
  position : "absolute",
  left : 0,
  top : 0,
  "z-index" : 100,
};

var list = '';

(function( $ ) {
  $.fn.annotator = function(src, width, height) {
    return this.each(function() {
      $parent = $(this);
      
      var $zoomin = $('<button>Zoom In</button>').appendTo($parent);

      var $zoomout = $('<button>Zoom Out</button>').appendTo($parent);

      var $container = $('<div></div>')
                        .css(containercss)
                        .width(width)
                        .height(width).appendTo($parent);

      var $img = $('<img src="'+src+'"></img>')
                    .draggable()
                    .css(imgcss)
                    .width(width)
                    .height(height)
                    .appendTo($container);

      var $canvas = $('<canvas></canvas>')
                      .css(canvascss)
                      .appendTo($container);

      var originalHeight = $img.height();

      if(typeof G_vmlCanvasManager != 'undefined') {
        console.log("badamdisssss");
  canvas = G_vmlCanvasManager.initElement(canvas);
}

      $zoomin.on("click", function (){ zoom($img, $container, originalHeight, 1.25); });
      $zoomout.on("click", function(){ zoom($img, $container, originalHeight, 0.8); });
      var context = $canvas[0].getContext("2d");
      $canvas[0].width = width;
      $canvas[0].height = height;
      //$img[0].width = width;
      //$img[0].height = height;
      context.strokeStyle="red";

      var startX;
      var startY;
      var paint;
      $canvas.mousedown(function(e){
        var offset = $canvas.offset();
        context.clearRect(0,0,width, height);
        startX = e.pageX - offset.left;
        startY = e.pageY - offset.top;
        paint = true;
        console.log(startX+" "+startY);
        console.log(e.pageX+" "+e.pageY);
        // context.strokeStyle = "red";
        // context.strokeRect(x,y,10,10);
        // context.stroke();
      });

      $canvas.mousemove(function(e){
        if(paint === true){
          context.clearRect(0,0,width, height);
          var offset = $canvas.offset();
          x = e.pageX - offset.left;
          y = e.pageY - offset.top;
          var w = Math.abs(startX - x);
          var h = Math.abs(startY - y);
          context.strokeRect(Math.min(x,startX), Math.min(y,startY), w, h);
        }
      });

      $canvas.mouseup(function(){
        paint = false;
      });


    });
  };
}(jQuery));


var zoom = function($img, $parent, originalHeight, scale) {
  var offset = $img.offset();
  var width = $img.width();
  var height = $img.height();
  
  if(scale < 1 && originalHeight >= height)
      return;

  var diffWidth = (width * scale) - width;
  var diffHeight = (height * scale) - height;

  var leftPercent = (($parent.width() / 2) - offset.left) / width;
  var topPercent = (($parent.height() / 2) - offset.top) / height;

  // $img.offset({top: offset.top - (diffHeight * topPercent), left: offset.left - (diffWidth * leftPercent)});
  $img.offset({top: offset.top-20, left: offset.left - 20});

  $img.width(width * scale).height(height * scale);
};