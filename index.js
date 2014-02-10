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

// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.atts = new Array();
  this.attC = 0;
}

// Annotations - as distinct on the canvas
function Annotation(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];
  this.type = type;
};

Annotation.prototype.reset = function(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];
  if (type != null) this.type = type;
}


//////////////////////////////////////////////////////
///// Annotator Object Definition ////////////////////

// Creates a new annotator (to be bound to a DOM object)
function Annotator(src, w, h) {
  // Parameters
  this.src = src;
  this.w = w;
  this.h = h;

  this.ftr = null;
  this.ftrs = new Array();
  this.fInd = 0;
  this.attInd = 0;

  // Controls
  this.zoomin = null;
  this.zoomout = null;
  this.pan = null;
  this.annotate = null;
  this.attType = null;
  this.nextAtt = null;
  this.prevAtt = null;
  this.delAtt = null;

  this.nextFtr = null;
  this.prevFtr = null;

  this.title = null;

  // Components
  this.container = null
  this.canvas = null;

  // Annotations
  this.att = new Annotation("rect");
  this.atts = [this.att];
  this.selectedType = "rect";

  // Drawing
  this.g = null;

  // Transform info
  this.curScale = 0.9;
  this.xOffs = 0;
  this.yOffs = 0;

  // Canvas ops
  this.x0 = 0;
  this.x1 = 0;
  this.y0 = 0;
  this.y1 = 0;
  this.curOp = "pan";
  this.active = false;
  this.polyC = 0;
}
Annotator.fn = Annotator.prototype;

// Apply annotation data import
Annotator.fn.dataIn = function(data) {
  var a = this;
  var input = data.features;

  a.ftrs = new Array();
  for (var i = 0; i < input.length; i++) {
    var f = input[i];
    a.ftrs.push(new Feature(f.name, f.required, f.shape));
  }

  a.changeFtr();
}

// Updates an existing annotator with a new image
// (Also resets the pan/zoom and annotations)
Annotator.fn.update = function(src, w, h) {
  this.src = src;
  this.w = w;
  this.h = h;

  // Reloading & resizing
  this.container.width(w).height(h);
  this.img.attr("src", src).width(w).height(h);

  // Reset pan/zoom
  this.curScale = 0.9;
  this.xOffs = 0;
  this.yOffs = 0;

  // Reset annotation
  this.att = new Annotation(this.selectedType);
  this.atts = [att];

  // Resize canvas
  this.canvas[0].width = w;
  this.canvas[0].height = h;
}

//////////////////////////////////////////////////////
// Instantiates an annotator inside a DOM object
Annotator.fn.build = function($parent) {
  // Register and generate annotator components
  $parent.addClass("annotator");
  $parent.data("Annotator", this);

  // Controls
  this.zoomin    = $('<button id="zoomin">+</button>').appendTo($parent);
  this.zoomout   = $('<button id="zoomout">-</button>').appendTo($parent);
  this.pan       = $('<button id="pan">Pan</button>').appendTo($parent);
  this.annotate  = $('<button id="annot">Annotate</button>').appendTo($parent)
                    .css("margin-right", "20px");

  this.prevFtr   = $('<button id="prevFtr">&lt&lt</button>').appendTo($parent);
  this.prevAtt   = $('<button id="prevAtt">&lt</button>').appendTo($parent);

  this.attType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option>')
                      .appendTo($parent);

  this.delAtt    = $('<button id="nextAtt">X</button>').appendTo($parent);
  this.nextAtt   = $('<button id="nextAtt">&gt</button>').appendTo($parent);
  this.nextFtr   = $('<button id="nextAtt">&gt&gt</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.title     = $('<label>Annotating:</label>').appendTo($parent)
                      .css("font-family", "sans-serif")
                      .css("font-size", "12px");

  // Canvas container
  this.container = $('<div></div>')
                      .css(containercss)
                      .width(this.w)
                      .height(this.h)
                      .appendTo($parent);

  // Load the image
  this.img = $('<img src="'+this.src+'"></img>')
                      .width(this.w)
                      .height(this.h)
                      .hide()
                      .appendTo($parent);

  // The drawing canvas
  this.canvas = $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo(this.container);
  // Resize canvas
  this.canvas[0].width = this.w;
  this.canvas[0].height = this.h;

  // Get the drawing context
  this.g = this.canvas[0].getContext("2d");

  var a = this; // loss of context when defining callbacks

  // Zoom control
  this.zoomin.click(function(){a.zoom(1.25);});
  this.zoomout.click(function(){a.zoom(0.8);});

  // Operation selection
  this.attType.change(function() {
    var str = $(this).val();

    if (str == "Box") {
      a.selectedType = "rect";
      a.switchOp("annotate");
    }
    else if (str == "Polygon") {
      a.selectedType = "poly";
      a.switchOp("annotate");
    }
  });

  this.pan.click(function(){
    a.switchOp("pan");
  });

  this.annotate.click(function(){
    a.switchOp("annotate");
  });

  this.delAtt.click(function() {
    a.att.reset();
    a.updateControls();
    a.repaint();
  });

  // Annotations - next/prev
  this.prevAtt.click(function() {
    var ind = a.atts.indexOf(a.att) - 1;
    a.changeAtt(ind);
  });

  this.nextAtt.click(function() {
    var ind = a.atts.indexOf(a.att) + 1;
    a.changeAtt(ind);
  });

  // Features next/prev
  this.prevFtr.click(function() {
    a.fInd--;
    a.changeFtr();
  });

  this.nextFtr.click(function() {
    a.fInd++;
    a.changeFtr();
  });

  // Mouse down - start drawing or panning
  this.canvas.mousedown(function(e){
    a.mbDown(e.pageX, e.pageY);
  });

  // Movement continues draw/pan as long as the mouse button is held
  this.canvas.mousemove(function(e){
    a.mMove(e.pageX, e.pageY);
  });

  // Operation end
  this.canvas.mouseup(function(){
    a.mbUp();
  });

  // We have to wait for the image to load before we can use it
  this.img.load(function(){
    a.repaint();
  });
}

//////////////////////////////////////////////////////
// Annotation control

Annotator.fn.changeFtr = function() {
  if (this.fInd < 0) {
    this.fInd = 0;
    return;
  }
  else if (this.fInd == this.ftrs.length) {
    this.fInd = this.ftrs.length - 1;
  }
  else {
    this.ftr = this.ftrs[this.fInd];
  }

  // Switch att correspondingly
  this.atts = this.ftr.atts;
  this.changeAtt(0);

  this.repaint();

  this.updateControls();
  this.updateTitle();
}

Annotator.fn.changeAtt = function(ind) {
  // Remove redundant (invalid) annotations before we switch
  for (var i = 0; i < this.atts.length; i++) {
    var att = this.atts[i];
    if (!att.valid) {
      this.atts.splice(i, 1);

      // Correct the index which was passed in
      if (i <= ind) ind--;
    }
  }

  // Make a valid change - either switch or add a new one
  if (ind < 0) {
    return;
  }
  else if (ind == this.atts.length) {
    this.att = new Annotation(this.selectedType);
    this.atts.push(this.att);
  }
  else {
    this.att = this.atts[ind];
  }

  this.repaint();

  this.updateControls();
  this.updateTitle();
}

Annotator.fn.updateControls = function() {
  this.prevFtr.prop('disabled', this.fInd == 0);
  this.nextFtr.prop('disabled', this.fInd == this.ftrs.length - 1);

  this.prevAtt.prop('disabled', this.atts[0] == this.att);

  var ind = this.atts.indexOf(this.att)+1;
  var nextValid = false;
  if (ind < this.atts.length) nextValid = this.atts[ind].valid;
  this.nextAtt.prop('disabled', !this.att.valid && !nextValid);
  this.delAtt.prop('disabled', !this.att.valid || this.ftr.req);
}

Annotator.fn.updateTitle = function() {
  this.title.text("Annotating: " + this.ftr.name + " (" + (this.fInd+1) + "/" + this.ftrs.length + ")");
}

//////////////////////////////////////////////////////
// Mouse control

Annotator.fn.switchOp = function(op) {
  this.curOp = op;
  if (op == "annotate") {
    this.canvas.css("cursor", "crosshair");
  }
  else {
    this.canvas.css("cursor", "move");
  }
}

Annotator.fn.mbDown = function(x, y) {
  if (!this.active) {
    var offset = this.canvas.offset();
    this.x1 = this.x0 = x - offset.left;
    this.y1 = this.y0 = y - offset.top;
    this.active = true;

    if (this.curOp == "annotate") {
      this.att.reset(this.selectedType);
      this.att.valid = true;

      if (this.att.type == "poly") {
        this.att.pts[0] = new ptToImg(this, this.x0, this.y0);
        this.polyC = 1;
      }
    }
  }
}

Annotator.fn.mbUp = function() {
  // End ONLY if dragged
  if (this.curOp == "annotate") {
    if (this.x0 != this.x1 && this.y0 != this.y1) {
      if (this.att.type == "rect") {
        this.active = false;
        this.updateControls();
      }
      else if (this.att.type == "poly") {
        this.x0 = this.x1;
        this.y0 = this.y1;
        this.polyC++;
      }
    }
    else if (this.att.type == "poly" && this.polyC > 1) {
      this.active = false;
      this.updateControls();
    }
  }
  else {
    this.active = false;
    this.updateControls();
  }
}

Annotator.fn.mMove = function(x, y) {
  if (!this.active) return;

  var offset = this.canvas.offset();
  this.x1 = x - offset.left;
  this.y1 = y - offset.top;

  var dx = this.x1 - this.x0;
  var dy = this.y1 - this.y0;

  if (this.curOp == "pan") {
    // Panning the image
    this.doPan(dx, dy);
    this.x0 = this.x1;
    this.y0 = this.y1;
  }
  else if (this.curOp == "annotate") {
    // Annotation - in image space
    var pt1 = new ptToImg(this, this.x0, this.y0);
    var pt2 = new ptToImg(this, this.x1, this.y1);

    if (this.att.type == "rect") {
      this.att.pts[0] = pt1;
      this.att.pts[1] = pt2;
    }
    else if (this.att.type == "poly") {
      // Save next point
      this.att.pts[this.polyC] = pt2;
    }

    // Redraw
    this.repaint();
  }
}

//////////////////////////////////////////////////////
// Canvas Operations

// Canvas re-draw op
Annotator.fn.repaint = function() {
  var g = this.g;

  // Reset xform & clear
  g.setTransform(1,0,0,1,0,0);
  g.clearRect(0, 0, this.w, this.h);

  // To draw in position with scaling,
  // move to position (translate), then
  // scale before drawing at (0, 0)
  g.translate(this.w/2 + this.xOffs, this.h/2 + this.yOffs);
  g.scale(this.curScale, this.curScale);

  // Drop shadow
  g.shadowColor = "#555";
  g.shadowBlur = 40;

  // Draw the image
  g.drawImage(this.img[0], -this.w/2, -this.h/2);

  // Annotation
  for (var f = 0; f < this.ftrs.length; f++) {
    var ftr = this.ftrs[f];
    for (var i = 0; i < ftr.atts.length; i++) {
      this.drawAtt(ftr.atts[i]);
    }
  }
}

// Annotation draw op
Annotator.fn.drawAtt = function(att) {
  var g = this.g;

  if (!att.valid) return;

  var col = "white";
  if (att == this.att) {
    col = "rgb(160, 160, 255)";
  }

  g.shadowColor = "#222";
  g.shadowBlur = 5;
  g.strokeStyle = col;
  g.lineWidth = 1.5 / this.curScale;
  g.fillStyle = col;

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

    this.drawPt({x:x0, y:y0});
    this.drawPt({x:x0, y:y1});
    this.drawPt({x:x1, y:y0});
    this.drawPt({x:x1, y:y1});
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

    for (var i = 0; i < att.pts.length; i++) {
      this.drawPt(att.pts[i]);
    }
  }
}

// Point drawing util
Annotator.fn.drawPt = function(pt) {
  var g = this.g;
  g.beginPath();
  g.arc(pt.x, pt.y, 3/this.curScale, 0, 2*Math.PI, false);
  g.fill();
}

// Pan op
Annotator.fn.doPan = function(x, y) {
  // New offset
  var margin = 100;

  this.xOffs += x;
  this.yOffs += y;

  var xLim = (this.w/2)*this.curScale;
  var yLim = (this.h/2)*this.curScale;

  if (this.xOffs >  xLim) this.xOffs =  xLim;
  if (this.xOffs < -xLim) this.xOffs = -xLim;
  if (this.yOffs >  yLim) this.yOffs =  yLim;
  if (this.yOffs < -yLim) this.yOffs = -yLim;

  this.repaint();
}

// Zoom op
Annotator.fn.zoom = function(scale) {
  // New scaling level
  this.curScale *= scale;
  if (this.curScale < 0.9) this.curScale = 0.9;
  this.repaint();
}

// Util - canvas to image space
function ptToImg(a, x, y) {
  var x = (x-a.w/2-a.xOffs)/a.curScale;
  var y = (y-a.h/2-a.yOffs)/a.curScale;

  if (x < -a.w/2) x = -a.w/2;
  if (x >  a.w/2) x =  a.w/2;
  if (y < -a.h/2) y = -a.h/2;
  if (y >  a.h/2) y =  a.h/2;

  return {x:x,y:y};
}


//////////////////////////////////////////////////////
///// API Definition /////////////////////////////////

(function( $ ) {
  // The annotator function - appplicable to any jQuery object collection
  $.fn.annotator = function(src, width, height, input) {
    return this.each(function() {
      // Check for annotator class
      $parent = $(this);
      var a;

      // Update if we're passed an existing annotator
      if ($parent.hasClass("annotator")) {
        a = $parent.data("Annotator");
        a.update(src, width, height);
      }
      else {
        a = new Annotator(src, width, height);
        a.build($parent);
      }

      // Apply input
      a.dataIn(input);

      a.updateControls();
      a.updateTitle();
    });
  };

  // Data retrieval... TODO
}(jQuery));
