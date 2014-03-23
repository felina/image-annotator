/*! penguinator - v3.4.4 - 2014-03-23
* https://github.com/felina/image-annotator
* Copyright (c) 2014 Alistair Wick <alistair.wk@gmail.com>; Licensed MIT */
(function($) {

// Annotator class definition //

var containercss = {
  position : "relative",
  overflow : "hidden"
};

var canvascss = {
  position : "absolute",
  left : 0,
  top : 0,
  "z-index" : 100,
  cursor : "move"
};

// Creates a new annotator (to be bound to a DOM object)
function Annotator(img, w, h) {
  // Parameters
  this.img = img;
  this.w = w;
  this.h = h;

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
  this.parent = null;
  this.container = null;
  this.canvas = null;

  // Tools
  this.curTool = new PanTool(this);

  // Annotations
  this.attHelper = new AttHelper(this);

  // Canvas ops
  this.cHelper = null;
}
Annotator.fn = Annotator.prototype;


//////////////////////////////////////////////////////
// Data import / export

// Apply feature data import
Annotator.fn.featuresIn = function(data) {
  if (typeof data.features === 'undefined') {
    return; // No input provided
  }

  this.attHelper.importFeatures(data.features);
  this.showChange();
};

// Apply annotation data import
Annotator.fn.attsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    return; // No input provided
  }

  this.attHelper.importAtts(data.annotations);
  this.showChange();
};

// Apply css styling
Annotator.fn.cssIn = function(data) {
  if (typeof data.style === 'undefined') {
    return; // No input provided
  }

  var style = data.style;
  var btns  = this.parent.find('button');

  if (typeof style.classes !== 'undefined') {
    btns.addClass(style.classes);
  }

  if (typeof style.css !== 'undefined') {
    btns.css(style.css);
  }
};

// Annotation export
Annotator.fn.getExport = function() {
  return this.attHelper.exportAtts();
};

// Feature retrieval
Annotator.fn.getFeatures = function() {
  return this.attHelper.ftrs;
};

//////////////////////////////////////////////////////
// Update / build functionality

// Updates an existing annotator with a new image
// (Also resets the pan/zoom and annotations)
Annotator.fn.update = function(img, w, h) {
  if (this.img !== img) {
    var a = this;
    this.img = img;

    if (this.img !== null) {
      this.img.load(function(){
        a.cHelper.imgLoaded(a.img);
      });
    }
  }
  
  this.w = w;
  this.h = h;

  // Reloading & resizing
  this.container.width(w).height(h);

  // Reset pan/zoom
  this.cHelper.reset(w, h);

  // Reset annotations
  this.attHelper.reset();
};

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

  // The drawing canvas
  this.canvas = $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo(this.container);
  this.canvas[0].onselectstart = function(){return false;};

  // Generate the canvas helper
  this.cHelper = new CanvasHelper(this);

  var a = this; // loss of context when defining callbacks

  // Zoom control
  this.zoomin.click(function(){a.cHelper.zoom(1.25);});
  this.zoomout.click(function(){a.cHelper.zoom(0.8);});

  // Switching annotation modes
  this.attType.change(function() {
    var str = $(this).val();

    if (str === "Box") {
      a.attHelper.changeType("rect");
      a.switchOp("annotate");
    }
    else if (str === "Polygon") {
      a.attHelper.changeType("poly");
      a.switchOp("annotate");
    }
  });

  // Operation selection
  this.pan.click(function(){ a.switchOp("pan"); });
  this.annotate.click(function(){ a.switchOp("annotate"); });

  // Annotation deletion
  this.delAtt.click(function() {
    a.attHelper.delAtt();
    a.updateControls();
    a.cHelper.repaint();
  });

  // Annotations - next/prev
  this.prevAtt.click(function() { a.attHelper.prevAtt(); });
  this.nextAtt.click(function() { a.attHelper.nextAtt(); });

  // Features next/prev
  this.prevFtr.click(function() { a.attHelper.prevFtr(); });
  this.nextFtr.click(function() { a.attHelper.nextFtr(); });

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ a.curTool.lbDown(e.pageX, e.pageY); });
  this.canvas.mousemove(function(e){ a.curTool.mMove(e.pageX, e.pageY); });
  this.canvas.mouseup(function(e){ a.curTool.lbUp(e.pageX, e.pageY); });

  this.canvas.dblclick(function(e){
    a.curTool.lbDbl(e.pageX, e.pageY);
    e.preventDefault();
    return false;
  });

  // Call the normal update
  this.update(this.img, this.w, this.h);
};


//////////////////////////////////////////////////////
// Annotation UI

Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
  this.updateTitle();
};

Annotator.fn.lockSelect = function(type, lock) {
  this.attType.prop('disabled', lock);

  if (lock) {
    if (type === "rect") {
      this.attType.val('Box');
    }
    else {
      this.attType.val('Polygon');
    }
  }
};

Annotator.fn.updateControls = function() {
  var ath = this.attHelper;
  this.prevFtr.prop('disabled', ath.fInd === 0);
  this.nextFtr.prop('disabled', ath.fInd === ath.ftrs.length - 1);

  this.prevAtt.prop('disabled', ath.aInd === 0);

  // Logic for enabling the 'next attribute' button
  var ind = ath.atts.indexOf(ath.getAtt())+1;
  var nextValid = false;

  if (ind < ath.atts.length) {
    nextValid = ath.atts[ind].valid;
  }

  this.nextAtt.prop('disabled', !ath.getAtt().valid && !nextValid);
  this.delAtt.prop('disabled', !ath.getAtt().valid);
};

Annotator.fn.updateTitle = function() {
  var name = this.attHelper.getFtr().name;
  var ind  = this.attHelper.fInd;
  var len  = this.attHelper.ftrs.length;
  this.title.text("Annotating: " + name + " (" + (ind+1) + "/" + len + ")");
};

//////////////////////////////////////////////////////
// Tool switching

Annotator.fn.switchOp = function(op) {
  if (op === "annotate") {
    this.curTool = new AttTool(this);
    this.canvas.css("cursor", "crosshair");
  }
  else if (op === "pan") {
    this.curTool = new PanTool(this);
    this.canvas.css("cursor", "move");
  }
};

// The annotator function - appplicable to any jQuery object collection
$.fn.annotator = function(input) {
  var w, h;

  if (typeof input.src !== "undefined") {
    input.img = $('<img src="'+input.src+'"></img>').hide();
  }
  else if (typeof input.img === "undefined") {
    input.img = null;
  }

  if (typeof input.features === "undefined") {
    throw "Error: Input feature array is required";
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
  a.attsIn(input);
  a.cssIn(input);

  a.updateControls();
  a.updateTitle();

  return a;
};

// Annotation helper class definition //

// This deals with managing the annotation data,
// doing import/export etc

function AttHelper(parent) {
  this.parent = parent;

  // Features
  this.ftrs = [];
  this.fInd = 0;
  this.aInd = 0;

  // Annotations
  this.atts = [new Annotation("rect")];
  this.curType = "rect";

  // Drawing
  this.pInd = 0;
}
AttHelper.fn = AttHelper.prototype;

AttHelper.fn.getAtt = function() {
  return this.atts[this.aInd];
};

AttHelper.fn.getFtr = function() {
  return this.ftrs[this.fInd];
};

// Resets to default state
AttHelper.fn.reset = function() {
  // Reset annotation
  this.atts = [new Annotation(this.curType)];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.ftrs = [];
};

//////////////////////////////////////////////////////
// Data import / export

// Feature import
AttHelper.fn.addFtrData = function(ftr) {
    this.ftrs.push(new Feature(ftr.name, ftr.required, ftr.shape));
};

AttHelper.fn.importFeatures = function(input) {
  // Clear existing
  this.ftrs = [];

  for (var i = 0; i < input.length; i++) {
    this.addFtrData(input[i]);
  }

  this.ftrChanged();
};

// Attribute import - Depends on previous feature import
AttHelper.fn.importAtts = function(atts) {
  // Iterate features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];
    f.atts = [];

    if (typeof atts[f.name] === 'undefined') {
      continue; // Skip feature if there was no input attribute data
    }

    var input = atts[f.name];
    var shapes = input.shapes;

    for (var j = 0; j < shapes.length; j++) {
      var s = shapes[j];

      // Generate each annotation from input data
      var att = new Annotation(s.type);
      att.valid = true;

      if (s.type === 'rect') {
        att.pts[0] = s.pos;
        att.pts[1] = {x : s.pos.x+s.size.width, y : s.pos.y+s.size.height};
      }
      else {
        att.pts = s.points;
      }

      f.atts.push(att);
    }
  }

  // Recapture current feature/annotation
  this.atts = this.getFtr().atts;
  this.parent.showChange();
};

// Annotation export
AttHelper.fn.exportAtts = function() {
  // Empty output object
  var out = {};

  // Iterate the features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];

    // Store shapes
    out[f.name] = {};
    out[f.name].shapes = [];

    // Iterate the annotatons for the feature
    for (var j = 0; j < f.atts.length; j++) {
      var att = f.atts[j];

      // Check it's a valid shape
      if (typeof att === 'undefined') {
        continue;
      }
      else if (!att.valid) {
        continue;
      }

      // The shape as it's output
      var s = {};
      s.type = att.type;

      if (s.type === 'rect') {
        var x0 = att.pts[0].x;
        var y0 = att.pts[0].y;
        var x1 = att.pts[1].x;
        var y1 = att.pts[1].y;

        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var x = Math.min(x0, x1);
        var y = Math.min(y0, y1);

        s.pos = {x : x, y : y};
        s.size = {width : dx, height : dy};
      }
      else {
        s.points = att.pts;
      }

      out[f.name].shapes.push(s);
    }
  }

  return out;
};


//////////////////////////////////////////////////////
// Feature selection

// Common to feature changes
AttHelper.fn.ftrChanged = function() {
  // Lock/unlock shape selection
  var lock = this.getFtr().shape !== "any";
  this.parent.lockSelect(this.getFtr().shape, lock);

  if (lock) {
    this.curType = this.getFtr().shape;
  }

  // Update annotations to match
  this.atts = this.getFtr().atts;
  this.aInd = 0;

  if (this.atts.length === 0) {
    this.atts.push(new Annotation(this.curType));
  }

  // Update UI
  this.parent.showChange();
};

// Select the next feature
AttHelper.fn.nextFtr = function() {
  this.fInd++;

  if (this.fInd >= this.ftrs.length) {
    this.fInd = this.ftrs.length - 1;
  }

  this.ftrChanged();
};

// Select the previous feature
AttHelper.fn.prevFtr = function() {
  this.fInd--;

  if (this.fInd < 0) {
    this.fInd = 0;
  }

  this.ftrChanged();
};


//////////////////////////////////////////////////////
// Annotation selection

// Invalidates the current annotation -
// it will be removed when the next switch
// occurs
AttHelper.fn.delAtt = function() {
  this.getAtt().reset();
};

// Select next annotation/start a new one
// Jumps to next att index, creates a new annotation
// if we hit the end of the list
AttHelper.fn.nextAtt = function() {
  this.aInd++;

  if (this.aInd === this.atts.length) {
    this.atts.push(new Annotation(this.curType));
  }

  this.clrInvalid();
  this.parent.showChange();
};

// Select previous annotation, if one exists
AttHelper.fn.prevAtt = function() {
  this.aInd--;

  if (this.aInd < 0) {
    this.aInd = 0;
  }

  this.clrInvalid();
  this.parent.showChange();
};


//////////////////////////////////////////////////////
// Annotation generation

AttHelper.fn.startAtt = function(pt) {
  this.getAtt().reset(this.curType);
  this.getAtt().valid = true;
  this.getAtt().pts[0] = pt;
  this.pInd = 1;
};

// Update the next point
AttHelper.fn.showPt = function(pt) {
  if (this.getAtt().type === "rect") {
    this.getAtt().pts[1] = pt;
  }
  else if (this.getAtt().type === "poly") {
    this.getAtt().pts[this.pInd] = pt;
  }
};

// Finalize the next point. Returns false
// if the drawing is complete.
AttHelper.fn.nextPt = function(pt) {
  var lastPt;

  if (this.getAtt().type === "rect") {
    lastPt = this.getAtt().pts[0];

    if (lastPt.x !== pt.x || lastPt.y !== pt.y) {
      this.getAtt().pts[1] = pt;
      this.endAtt();
      return false;
    }
    else {
      return true;
    }
  }
  else if (this.getAtt().type === "poly") {
    lastPt = this.getAtt().pts[this.pInd-1];

    if (lastPt.x !== pt.x || lastPt.y !== pt.y) {
      this.getAtt().pts[this.pInd] = pt;
      this.pInd++;
    }

    return true;
  }

  return false;
};

// Ends an annotation - remove duplicate point
AttHelper.fn.endAtt = function() {
  if (this.getAtt().type === 'poly') {
    this.getAtt().pts.pop();
  }

  // Start next annotation

  this.nextAtt();
};

//////////////////////////////////////////////////////
// Misc functions

// Type selection
AttHelper.fn.changeType = function(type) {
  this.curType = type;
};

// Clears invalid annotations
AttHelper.fn.clrInvalid = function() {
  for (var i = 0; i < this.atts.length; i++) {
    if (i === this.aInd) {
      continue;
    }

    var att = this.atts[i];

    if (!att.valid) {
      this.atts.splice(i, 1);
      if (this.aInd > i) {
        this.aInd--;
      }
    }
  }
};

// Canvas helper class definition //

// Creates a new CanvasHelper
function CanvasHelper(parent) {
  this.parent = parent;
  var w = parent.w;
  var h = parent.h;

  // Drawing
  this.canvas = parent.canvas;
  this.g = this.canvas[0].getContext("2d");

  // Dim
  this.canvas[0].width = w;
  this.canvas[0].height = h;
  this.w = w;
  this.h = h;
  this.imgW = w;
  this.imgH = h;

  // Transform info
  this.defScale = 1.0; // TODO: Correct for size
  this.curScale = this.defScale;
  this.xOffs = 0;
  this.yOffs = 0;
}

CanvasHelper.fn = CanvasHelper.prototype;

// Canvas re-draw op
CanvasHelper.fn.repaint = function() {
  var g = this.g;
  var ftrs = this.parent.getFeatures();

  // Reset xform & clear
  g.setTransform(1,0,0,1,0,0);
  g.fillStyle = "rgb(240, 240, 240)";
  g.fillRect(0, 0, this.w, this.h);

  // To draw in position with scaling,
  // move to position (translate), then
  // scale before drawing at (0, 0)
  g.translate(this.w/2 + this.xOffs, this.h/2 + this.yOffs);
  g.scale(this.curScale, this.curScale);

  // Drop shadow
  g.shadowColor = "#555";
  g.shadowBlur = 20;

  // Draw the image
  if (this.parent.img !== null) {
    g.drawImage(this.parent.img[0], -this.imgW/2, -this.imgH/2);
  }
  else {
    g.fillStyle = "rgb(220, 220, 220)";
    g.fillRect(-this.imgW/2, -this.imgH/2, this.imgW, this.imgH);

    g.shadowBlur = 0;
    g.fillStyle = "white";
    g.font = "22px sans-serif";
    g.fillText("No Image", -40, -8);
  }

  // Annotation
  for (var f = 0; f < ftrs.length; f++) {
    var ftr = ftrs[f];
    for (var i = 0; i < ftr.atts.length; i++) {
      this.drawAtt(ftr.atts[i], f);
    }
  }
};

// Annotation draw op
CanvasHelper.fn.drawAtt = function(att, fInd) {
  var g = this.g;

  var cols =
  [
    "rgb(255, 20, 20)",
    "rgb(0, 200, 0)",
    "rgb(00, 0, 255)",
    "rgb(255, 255, 0)",
    "rgb(50, 200, 200)"
  ];

  if (!att.valid) {
    return;
  }

  var col = cols[fInd % cols.length];
  var fillCol = col;

  if (att === this.parent.attHelper.getAtt()) {
    fillCol = "white";
  }

  g.shadowColor = "#000";
  g.shadowBlur = 1;
  g.strokeStyle = col;
  g.lineWidth = 1.5 / this.curScale;
  g.fillStyle = fillCol;

  // Box drawing (2-point)
  if (att.type === "rect") {
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
  else if (att.type === "poly") {
    g.beginPath();
    g.moveTo(att.pts[0].x, att.pts[0].y);

    for (var i = 1; i < att.pts.length; i++) {
      g.lineTo(att.pts[i].x, att.pts[i].y);
    }

    g.lineTo(att.pts[0].x, att.pts[0].y);
    g.stroke();

    for (i = 0; i < att.pts.length; i++) {
      this.drawPt(att.pts[i]);
    }
  }
};

// Point drawing util
CanvasHelper.fn.drawPt = function(pt) {
  var g = this.g;
  g.beginPath();
  g.arc(pt.x, pt.y, 3/this.curScale, 0, 2*Math.PI, false);
  g.fill();
};

// Pan op
CanvasHelper.fn.doPan = function(x, y) {
  // New offset
  this.xOffs += x;
  this.yOffs += y;

  var xLim = (this.imgW/2)*this.curScale;
  var yLim = (this.imgH/2)*this.curScale;

  if (this.xOffs >  xLim) {this.xOffs =  xLim;}
  if (this.xOffs < -xLim) {this.xOffs = -xLim;}
  if (this.yOffs >  yLim) {this.yOffs =  yLim;}
  if (this.yOffs < -yLim) {this.yOffs = -yLim;}

  this.repaint();
};

// Zoom op
CanvasHelper.fn.zoom = function(scale) {
  // New scaling level
  this.curScale *= scale;

  if (this.curScale < this.defScale) {
    this.curScale = this.defScale;
  }

  this.doPan(0, 0);
  this.repaint();
};

// Resizing and resetting pan/zoom
CanvasHelper.fn.reset = function(w, h) {
  this.canvas[0].width = w;
  this.canvas[0].height = h;
  this.w = w;
  this.h = h;

  if (this.parent.img) {
    var img = this.parent.img;
    this.imgW = img[0].width;
    this.imgH = img[0].height;
  }
  else {
    this.imgW = w;
    this.imgH = h;
  }

  this.xOffs = 0;
  this.yOffs = 0;

  this.calcZoom();
  this.curScale = this.defScale;
};

// Called when the image finishes loading
CanvasHelper.fn.imgLoaded = function(img) {
  // Grab the image dimensions. These are only available
  // once the image is fully loaded
  this.imgW = img[0].width;
  this.imgH = img[0].height;

  console.log("" + this.imgW + ", " + this.imgH);
  this.calcZoom();
  this.curScale = this.defScale;

  this.repaint();
};

// Calculates the correct default zoom level
CanvasHelper.fn.calcZoom = function() {
  // We can use the dimensions and the available canvas
  // area to work out a good zoom level
  var xRatio = this.w / this.imgW;
  var yRatio = this.h / this.imgH;
  var absRatio = Math.min(xRatio, yRatio);

  this.defScale = absRatio * 0.9;
};

// Base tool class defn //

function SuperTool() {
  this.x0 = 0;
  this.x1 = 0;
  this.y0 = 0;
  this.y1 = 0;

  this.active = false;

}

SuperTool.fn = SuperTool.prototype;

/*jshint unused:vars*/
SuperTool.fn.lbDown = function(x, y) {};
SuperTool.fn.lbUp   = function(x, y) {};
SuperTool.fn.lbDbl  = function(x, y) {};
SuperTool.fn.mMove  = function(x, y) {};


// Pan tool class definition //

function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}
PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

PanTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    this.x0 = x;
    this.y0 = y;
    this.active = true;
  }
};

PanTool.fn.lbUp = function(x, y) {
  this.active = false;
};

PanTool.fn.mMove = function(x, y) {
  if (this.active) {
    var dx = x - this.x0;
    var dy = y - this.y0;

    // Panning the image
    this.parent.cHelper.doPan(dx, dy);
    this.x0 = x;
    this.y0 = y;
  }
};


// Annotation tool class definition //
// This accepts user input to generate a *new* Annotation

function AttTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}
AttTool.prototype = Object.create(SuperTool.prototype);
AttTool.fn = AttTool.prototype;

// Mouse down - start an annotation if we're not already making one
AttTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();

    this.x1 = this.x0 = x - offset.left;
    this.y1 = this.y0 = y - offset.top;

    var pt = ptToImg(a.cHelper, this.x0, this.y0);
    a.attHelper.startAtt(pt);

    this.active = true;
  }
};

// Mouse up - add a point to the annotation
AttTool.fn.lbUp = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var pt = ptToImg(a.cHelper, this.x1, this.y1);
    this.active = a.attHelper.nextPt(pt);
    a.updateControls();
  }
};

// Double click - finish a polygon annotation
AttTool.fn.lbDbl = function(x, y) {
  if (this.active) {
    var a = this.parent;
    this.active = false;

    a.attHelper.endAtt();
    a.updateControls();
  }
};

// Mouse move - update current point
AttTool.fn.mMove = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();
    this.x1 = x - offset.left;
    this.y1 = y - offset.top;

    // Annotation - in image space
    var pt = ptToImg(a.cHelper, this.x1, this.y1);
    a.attHelper.showPt(pt);

    // Redraw
    a.cHelper.repaint();
  }
};


/*jshint unused:true*/

// Util.js: Functions and small classes helpful elsewhere //

// Canvas to image space
function ptToImg(a, xin, yin) {
  var x = (xin-a.w/2-a.xOffs)/a.curScale;
  var y = (yin-a.h/2-a.yOffs)/a.curScale;

  if (x < -a.imgW/2) {x = -a.imgW/2;}
  if (x >  a.imgW/2) {x =  a.imgW/2;}
  if (y < -a.imgH/2) {y = -a.imgH/2;}
  if (y >  a.imgH/2) {y =  a.imgH/2;}

  var out = {x:x,y:y};

  return out;
}

// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.atts = [];
  this.attC = 0;
}

// Annotations - as distinct on the canvas
function Annotation(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];
  this.type = type;
}

Annotation.prototype.reset = function(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];

  if (type != null) {
    this.type = type;
  }
};
}(jQuery));
