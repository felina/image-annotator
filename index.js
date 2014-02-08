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
  cursor : "move"
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

  // Drop shadow
  g.shadowColor = "#555";
  g.shadowBlur = 40;

  // Draw the image
  g.drawImage($img[0], -w/2, -h/2);

  // Annotation
  var x = Math.min(annotation.x, annotation.x+annotation.w);
  var y = Math.min(annotation.y, annotation.y+annotation.h);
  var dx = annotation.w;
  var dy = annotation.h;

  g.lineWidth = 2 / curScale;
  g.strokeRect(x, y, dx, dy);
};

// Transform info
var curScale = 0.9;
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

  if (curScale < 0.9) {
    curScale = 0.9;
  }

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
      var $zoomin, $zoomout, $pan, $annotate,
          $container, $img, $canvas;

      // Check for annotator class
      $parent = $(this);

      // Update if we're passed an existing annotator
      if ($parent.hasClass("annotator")) {
        // Retrieve controls
        $zoomin     = $parent.find("#zoomin");
        $zoomout    = $parent.find("#zoomin");
        $pan        = $parent.find("#pan");
        $annotate   = $parent.find("#annot");

        // Retrieve/resize container
        $container = $parent.find("div").width(width).height(height);

        // Reload the image
        $img = $parent.find("img").attr("src", src).width(width).height(height);

        // Retrieve canvas
        $canvas = $parent.find("canvas");

        // Reset pan/zoom
        curScale = 0.9;
        xOffs = 0;
        yOffs = 0;
      }
      else {
        // Register and generate annotator components
        $parent.addClass("annotator");
      
        // Controls
    	  $zoomin    = $('<button id="zoomin">+</button>').appendTo($parent);
        $zoomout   = $('<button id="zoomout">-</button>').appendTo($parent);
        $pan       = $('<button id="pan">Pan</button>').appendTo($parent);
        $annotate  = $('<button id="annot">Annotate</button>').appendTo($parent);

        // Canvas container
        $container = $('<div></div>')
                    .css(containercss)
                    .width(width)
                    .height(width)
                    .appendTo($parent);

        // Load the image
        $img = $('<img src="'+src+'"></img>')
                    .width(width)
                    .height(height)
                    .hide()
                    .appendTo($parent);

        // The drawing canvas
        $canvas = $('<canvas>Unsupported browser.</canvas>')
                    .css(canvascss)
                    .appendTo($container);

        if (typeof G_vmlCanvasManager != 'undefined') {
          console.log("um");
          canvas = G_vmlCanvasManager.initElement(canvas);
        }
      }

      // Scale the canvas to the original image
      $canvas[0].width = width;
      $canvas[0].height = height;

      // 'g' is the graphics context for rendering
      var g = $canvas[0].getContext("2d");

      // Control functionality
      $zoomin.click(  function(){zoom(g, $img, 1.25 );});
      $zoomout.click( function(){zoom(g, $img, 0.8  );});

      // We have to wait for the image to load before we can use it!
      $img.load(function(){
        doTransform(g, $img);
        repaint(g, $img);

        // Canvas operations
        var x0;
        var y0;
        var op = "pan";
        var active = false;

        // Operation selection
        $pan.click(function(){
          op = "pan";
          $canvas.css("cursor", "move");
        });
        $annotate.click(function(){
          op = "annotate";
          $canvas.css("cursor", "crosshair");
        });

        // Mouse down - start drawing or panning
        $canvas.mousedown(function(e){
          var offset = $canvas.offset();
          x0 = e.pageX - offset.left;
          y0 = e.pageY - offset.top;
          active = true;
        });

        // Movement continues draw/pan as long as the mouse button is held
        $canvas.mousemove(function(e){
          if (!active) return;

          var offset = $canvas.offset();
          var x1 = e.pageX - offset.left;
          var y1 = e.pageY - offset.top;

          var dx = x1 - x0;
          var dy = y1 - y0;

          if (op == "pan") {
            // Panning the image
            pan(g, $img, dx, dy);
            x0 = x1;
            y0 = y1;
          }
          else if (op == "annotate") {
            // Annotation - in image space
            annotation.x = (x0-width/2-xOffs)/curScale;
            annotation.y = (y0-height/2-yOffs)/curScale;
            annotation.w = dx/curScale;
            annotation.h = dy/curScale;

            doTransform(g, $img);
            repaint(g, $img);
          }
        });

        // Operation end
        $canvas.mouseup(function(){
          active = false;
        });
      });
    });
  };
}(jQuery));
