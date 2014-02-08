var imgcss = {
  visibility : "hidden",
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

var annotation = {
  x : 0,
  y : 0,
  w : 0,
  h : 0
};

var list = '';

// Canvas re-draw op
var repaint = function(g, $img) {
  var w = $img.width();
  var h = $img.height();

  g.drawImage($img[0], -w/2, -h/2);
};

// Transform info
var curScale = 1;
var xOffs = 0;
var yOffs = 0;

// General transform op
var doTransform = function(g, $img) {
  var w = $img.width();
  var h = $img.height();

  // Reset xform & clear
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0, 0, w, h);

  // To draw in position with scaling,
  // move to position (translate), then
  // scale before drawing at (0, 0)
  g.translate(w/2 + xOffs, h/2 + yOffs);
  g.scale(curScale, curScale);

  repaint(g, $img);
};

// Zoom op
var zoom = function(g, $img, scale) {
  // New scaling level
  curScale *= scale;
  doTransform(g, $img);
};

// Pan op
var pan = function(g, $img, x, y) {
  // New offset
  xOffs += x;
  yOffs += y;
  doTransform(g, $img);
};

(function( $ ) {
  // The annotator function - appplicable to any jQuery object collection
  $.fn.annotator = function(src, width, height) {
    return this.each(function() {
      $parent = $(this);
      
      // Controls
  	  var $zoomin = $('<button>Zoom In</button>').appendTo($parent);
      var $zoomout = $('<button>Zoom Out</button>').appendTo($parent);
      var $moveit = $('<button>Move it!</button>').appendTo($parent);

      // Canvas container
      var $container = $('<div></div>')
                        .css(containercss)
                        .width(width)
                        .height(width).appendTo($parent);

      // Load the image - don't need to put it in the page!
      var $img = $('<img src="'+src+'"></img>')
                        .width(width)
                        .height(height);

      // The drawing canvas
      var $canvas = $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo($container);

      var originalHeight = $img.height();

      if (typeof G_vmlCanvasManager != 'undefined') {
        console.log("badamdisssss");
        canvas = G_vmlCanvasManager.initElement(canvas);
      }

      // Scale the canvas to the original image
      $canvas[0].width = width;
      $canvas[0].height = height;

      // 'g' is the graphics context for rendering
      var g = $canvas[0].getContext("2d");

      // Control functionality
      $zoomin.click(  function(){zoom(g, $img, 1.25 );});
      $zoomout.click( function(){zoom(g, $img, 0.8  );});
      $moveit.click(  function(){pan(g, $img, 10, 20);});

      // We have to wait for the image to load before we can use it!
      $img.ready(function(){
        g.drawImage($img[0], 0, 0);

        g.strokeStyle="red";

        var x0;
        var y0;
        var op = "none";

        // Mouse down - start drawing or panning
        $canvas.mousedown(function(e){
          var offset = $canvas.offset();
          x0 = e.pageX - offset.left;
          y0 = e.pageY - offset.top;
          op = "pan";

          //console.log(startX+" "+startY);
          //console.log(e.pageX+" "+e.pageY);
          // g.strokeStyle = "red";
          // g.strokeRect(x,y,10,10);
          // g.stroke();
        });

        // Movement continues draw/pan as long as the mouse button is held
        $canvas.mousemove(function(e){
          if(op == "pan"){
            var offset = $canvas.offset();
            var x1 = e.pageX - offset.left;
            var y1 = e.pageY - offset.top;

            pan(g, $img, x1 - x0, y1 - y0);
            x0 = x1;
            y0 = y1;

            //var w = Math.abs(startX - x);
            //var h = Math.abs(startY - y);
            //g.strokeRect(Math.min(x,startX), Math.min(y,startY), w, h);
          }
        });

        $canvas.mouseup(function(){
          op = "none";
        });
      });
    });
  };
}(jQuery));
