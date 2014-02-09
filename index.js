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

function Annotation() {
  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.h = 0;
  this.type = "rect";
};

var att = new Annotation();

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
  drawAtt(g);
};

// Annotation draw op
var drawAtt = function(g) {
  var dx = Math.abs(att.w);
  var dy = Math.abs(att.h);
  var x = Math.min(att.x, att.x+att.w);
  var y = Math.min(att.y, att.y+att.h);

  g.strokeStyle = "white";
  g.lineWidth = 2 / curScale;
  g.strokeRect(x, y, dx, dy);
}

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

// Util - canvas to image space
var ptToImg = function($img, x, y) {
  var out = {
    x : 0, y : 0
  }

  out.x = (x-$img.width()/2-xOffs)/curScale;
  out.y = (y-$img.height()/2-yOffs)/curScale;

  return out;
};

(function( $ ) {
  // The annotator function - appplicable to any jQuery object collection
  $.fn.annotator = function(src, width, height) {
    return this.each(function() {
      var $zoomin, $zoomout, $pan, $annotate,
          $container, $img, $canvas, $type, g;

      // Check for annotator class
      $parent = $(this);

      // Update if we're passed an existing annotator
      if ($parent.hasClass("annotator")) {
        // Retrieve controls
        $zoomin     = $parent.find("#zoomin");
        $zoomout    = $parent.find("#zoomin");
        $pan        = $parent.find("#pan");
        $annotate   = $parent.find("#annot");

        $type       = $parent.find("#typesel");

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

        // Reset annotation
        att = new Annotation();
      }
      else {
        // Register and generate annotator components
        $parent.addClass("annotator");
      
        // Controls
    	  $zoomin    = $('<button id="zoomin">+</button>').appendTo($parent);
        $zoomout   = $('<button id="zoomout">-</button>').appendTo($parent);
        $pan       = $('<button id="pan">Pan</button>').appendTo($parent);
        $annotate  = $('<button id="annot">Annotate</button>').appendTo($parent);

        $type      = $('<select id="typesel"></select>')
                      .html('<option>Rect</option><option>Polygon</option>')
                      .appendTo($parent);

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

        // Zoom control
        $zoomin.click(function(){zoom(g, $img, 1.25 );});
        $zoomout.click(function(){zoom(g, $img, 0.8  );});

        // Canvas operations
        var x0, x1;
        var y0, y1;
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
          if (!active) {
            var offset = $canvas.offset();
            x1 = x0 = e.pageX - offset.left;
            y1 = y0 = e.pageY - offset.top;
            active = true;
          }
        });

        // Movement continues draw/pan as long as the mouse button is held
        $canvas.mousemove(function(e){
          if (!active) return;

          var offset = $canvas.offset();
          x1 = e.pageX - offset.left;
          y1 = e.pageY - offset.top;

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
            var pt1 = ptToImg($img, x0, y0);
            att.x = pt1.x;
            att.y = pt1.y;

            var pt2 = ptToImg($img, x1, y1);
            att.w = pt2.x - pt1.x;
            att.h = pt2.y - pt1.y;

            doTransform(g, $img);
          }
        });

        // Operation end
        $canvas.mouseup(function(){
          // End ONLY if dragged
          if (op == "annotate") {
            if (x0 != x1 && y0 != y1) {
              active = false;
            }
          }
          else {
            active = false;
          }
        });
      } // end of conditional update

      // Scale the canvas to the original image
      $canvas[0].width = width;
      $canvas[0].height = height;

      // 'g' is the graphics context for rendering
      g = $canvas[0].getContext("2d");

      // We have to wait for the image to load before we can use it
      $img.load(function(){
        doTransform(g, $img);
      });
    });
  };
}(jQuery));
