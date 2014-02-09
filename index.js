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
  this.pts = [{x:0,y:0}, {x:0,y:0}];
  this.type = "rect";
};

var att = new Annotation();

// Canvas re-draw op
function repaint(g, $img) {
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
function drawAtt(g) {
  g.shadowBlur = 10;
  g.strokeStyle = "white";
  g.lineWidth = 1 / curScale;

  // Box drawing (2-point)
  if (att.type == "rect") {
    var x0 = att.pts[0].x;
    var y0 = att.pts[0].y;
    var x1 = att.pts[1].x;
    var y1 = att.pts[1].y;

    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);
    var x = Math.min(x0, x1);
    var y = Math.min(y0, y1);

    g.strokeRect(x, y, dx, dy);
  }
  // Polygon drawing (n-point)
  else if (att.type == "poly") {
    g.beginPath();
    g.moveTo(att.pts[0].x, att.pts[0].y);

    for (var i = 1; i < att.pts.length; i++) {
      g.lineTo(att.pts[i].x, att.pts[i].y);
    }

    g.lineTo(att.pts[0].x, att.pts[0].y);
    g.stroke();
  }
}

// Transform info
var curScale = 0.9;
var xOffs = 0;
var yOffs = 0;

// General transform op
function doTransform(g, $img) {
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
function zoom(g, $img, scale) {
  // New scaling level
  curScale *= scale;

  if (curScale < 0.9) {
    curScale = 0.9;
  }

  doTransform(g, $img);
};

// Pan op
function pan(g, $img, x, y) {
  // New offset
  var margin = 100;

  xOffs += x;
  yOffs += y;

  var xLim = ($img.width()/2)*curScale;
  var yLim = ($img.height()/2)*curScale;

  if (xOffs >  xLim) xOffs =  xLim;
  if (xOffs < -xLim) xOffs = -xLim;
  if (yOffs >  yLim) yOffs =  yLim;
  if (yOffs < -yLim) yOffs = -yLim;

  doTransform(g, $img);
};

// Util - canvas to image space
function ptToImg($img, x, y) {
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
                      .html('<option>Box</option><option>Polygon</option>')
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
        var polyC = 0;

        // Operation selection
        $type.change(function(){
          var str = $(this).val();
          if (str == "Box") {
            att.type = "rect";
          }
          else if (str == "Polygon") {
            att.type = "poly";
          }
        });
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

            if (op == "annotate" && att.type == "poly") {
              att = new Annotation();
              att.type = "poly";
              att.pts[0] = ptToImg($img, x0, y0);
              polyC = 1;
            }
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
            var pt2 = ptToImg($img, x1, y1);

            if (att.type == "rect") {
              att.pts[0] = pt1;
              att.pts[1] = pt2;
            }
            else if (att.type == "poly") {
              // Save next point
              att.pts[polyC] = pt2;
            }

            // Redraw
            doTransform(g, $img);
          }
        });

        // Operation end
        $canvas.mouseup(function(){
          // End ONLY if dragged
          if (op == "annotate") {
            if (x0 != x1 && y0 != y1) {
              if (att.type == "rect") active = false;
              else if (att.type == "poly") {
                x0 = x1;
                y0 = y1;
                polyC++;
              }
            }
            else if (att.type == "poly" && polyC > 1) {
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
