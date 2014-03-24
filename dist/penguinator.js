/*! penguinator - v3.5.0 - 2014-03-24
* https://github.com/felina/image-annotator
* Copyright (c) 2014 Alistair Wick <alistair.wk@gmail.com>; Licensed MIT */
(function($) {

// Annotation helper class definition //

// This deals with managing the annotation data,
// doing import/export etc

function AnnHelper(parent) {
  this.parent = parent;

  // Features
  this.ftrs = [];
  this.fInd = 0;
  this.aInd = 0;

  // Annotations
  this.anns = [createAnnotation("rect")];
  this.curType = "rect";

  // Drawing
  this.pInd = 0;
}
AnnHelper.fn = AnnHelper.prototype;

AnnHelper.fn.getAnn = function() {
  return this.anns[this.aInd];
};

AnnHelper.fn.setAnn = function(ann) {
  this.anns[this.aInd] = ann;
};

AnnHelper.fn.getFtr = function() {
  return this.ftrs[this.fInd];
};

// Resets to default state
AnnHelper.fn.reset = function() {
  // Reset annotation
  this.anns = [createAnnotation(this.curType)];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.ftrs = [];
};

//////////////////////////////////////////////////////
// Data import / export

// Feature import
AnnHelper.fn.addFtrData = function(ftr) {
    this.ftrs.push(new Feature(ftr.name, ftr.required, ftr.shape));
};

AnnHelper.fn.importFeatures = function(input) {
  // Clear existing
  this.ftrs = [];

  for (var i = 0; i < input.length; i++) {
    this.addFtrData(input[i]);
  }

  this.ftrChanged();
};

// Annribute import - Depends on previous feature import
AnnHelper.fn.importAnns = function(anns) {
  // Iterate features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];
    f.anns = [];

    if (typeof anns[f.name] === 'undefined') {
      continue; // Skip feature if there was no input annribute data
    }

    var input = anns[f.name];
    var shapes = input.shapes;

    for (var j = 0; j < shapes.length; j++) {
      var s = shapes[j];

      // Generate each annotation from input data
      var ann = createAnnotation(s.type);
      ann.valid = true;

      if (s.type === 'rect') {
        ann.pts[0] = s.pos;
        ann.pts[1] = {x : s.pos.x+s.size.width, y : s.pos.y+s.size.height};
      }
      else {
        ann.pts = s.points;
      }

      f.anns.push(ann);
    }
  }

  // Recapture current feature/annotation
  this.anns = this.getFtr().anns;
  this.parent.showChange();
};

// Annotation export
AnnHelper.fn.exportAnns = function() {
  // Empty output object
  var out = {};

  // Iterate the features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];

    // Store shapes
    out[f.name] = {};
    out[f.name].shapes = [];

    // Iterate the annotatons for the feature
    for (var j = 0; j < f.anns.length; j++) {
      var ann = f.anns[j];

      // Check it's a valid shape
      if (typeof ann === 'undefined') {
        continue;
      }
      else if (!ann.valid) {
        continue;
      }

      // Get the export data from the shape
      var s = ann.getExport();
      out[f.name].shapes.push(s);
    }
  }

  return out;
};


//////////////////////////////////////////////////////
// Feature selection

// Common to feature changes
AnnHelper.fn.ftrChanged = function() {
  // Lock/unlock shape selection
  var lock = this.getFtr().shape !== "any";
  this.parent.lockSelect(this.getFtr().shape, lock);

  if (lock) {
    this.curType = this.getFtr().shape;
  }

  // Update annotations to match
  this.anns = this.getFtr().anns;
  this.aInd = 0;

  // Create an empty shape if there is none
  if (this.anns.length === 0) {
    this.anns.push(createAnnotation(this.curType));
  }

  // Update UI
  this.parent.showChange();
};

// Select the next feature
AnnHelper.fn.nextFtr = function() {
  this.fInd++;

  if (this.fInd >= this.ftrs.length) {
    this.fInd = this.ftrs.length - 1;
  }

  this.ftrChanged();
};

// Select the previous feature
AnnHelper.fn.prevFtr = function() {
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
AnnHelper.fn.delAnn = function() {
  this.getAnn().invalidate();
};

// Select next annotation/start a new one
// Jumps to next ann index, creates a new annotation
// if we hit the end of the list
AnnHelper.fn.nextAnn = function() {
  this.aInd++;

  if (this.aInd === this.anns.length) {
    this.anns.push(createAnnotation(this.curType));
  }

  this.clrInvalid();
  this.parent.showChange();
};

// Select previous annotation, if one exists
AnnHelper.fn.prevAnn = function() {
  this.aInd--;

  if (this.aInd < 0) {
    this.aInd = 0;
  }

  this.clrInvalid();
  this.parent.showChange();
};


//////////////////////////////////////////////////////
// Annotation generation

AnnHelper.fn.newAnn = function() {
  this.aInd = this.anns.length - 1;
  this.nextAnn();
  return this.getAnn();
};

//////////////////////////////////////////////////////
// Misc functions

// Type selection
AnnHelper.fn.changeType = function(type) {
  this.curType = type;
};

// Clears invalid annotations
AnnHelper.fn.clrInvalid = function() {
  for (var i = 0; i < this.anns.length; i++) {
    if (i === this.aInd) {
      continue;
    }

    var ann = this.anns[i];

    if (!ann.valid) {
      this.anns.splice(i, 1);
      if (this.aInd > i) {
        this.aInd--;
      }
    }
  }
};

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
  this.annType = null;
  this.nextAnn = null;
  this.prevAnn = null;
  this.delAnn = null;

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
  this.annHelper = new AnnHelper(this);

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

  this.annHelper.importFeatures(data.features);
  this.showChange();
};

// Apply annotation data import
Annotator.fn.annsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    return; // No input provided
  }

  this.annHelper.importAnns(data.annotations);
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
  return this.annHelper.exportAnns();
};

// Feature retrieval
Annotator.fn.getFeatures = function() {
  return this.annHelper.ftrs;
};

//////////////////////////////////////////////////////
// Update / build functionality

// Updates an existing annotator with a new image
// (Also resets the pan/zoom and annotations)
Annotator.fn.update = function(img, w, h) {
  var a = this;
  this.img = img;

  if (this.img !== null) {
    this.img.load(function(){
      a.cHelper.imgLoaded(a.img);
    });
  }
  
  this.w = w;
  this.h = h;

  // Reloading & resizing
  this.container.width(w).height(h);

  // Reset pan/zoom
  this.cHelper.reset(w, h);

  // Reset annotations
  this.annHelper.reset();
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
  this.prevAnn   = $('<button id="prevAnn">&lt</button>').appendTo($parent);

  this.annType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option>')
                      .appendTo($parent);

  this.delAnn    = $('<button id="nextAnn">X</button>').appendTo($parent);
  this.nextAnn   = $('<button id="nextAnn">&gt</button>').appendTo($parent);
  this.nextFtr   = $('<button id="nextAnn">&gt&gt</button>').appendTo($parent)
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
  this.annType.change(function() {
    var str = $(this).val();

    if (str === "Box") {
      a.annHelper.changeType("rect");
      a.switchOp("annotate");
    }
    else if (str === "Polygon") {
      a.annHelper.changeType("poly");
      a.switchOp("annotate");
    }
  });

  // Operation selection
  this.pan.click(function(){ a.switchOp("pan"); });
  this.annotate.click(function(){ a.switchOp("annotate"); });

  // Annotation deletion
  this.delAnn.click(function() {
    a.annHelper.delAnn();
    a.updateControls();
    a.cHelper.repaint();
  });

  // Annotations - next/prev
  this.prevAnn.click(function() { a.annHelper.prevAnn(); });
  this.nextAnn.click(function() { a.annHelper.nextAnn(); });

  // Features next/prev
  this.prevFtr.click(function() { a.annHelper.prevFtr(); });
  this.nextFtr.click(function() { a.annHelper.nextFtr(); });

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ 
    if (a.img) {
      a.curTool.lbDown(e.pageX, e.pageY);
    }
  });
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

// Shows a sate change in the canvas and UI elements
Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
  this.updateTitle();
};

// Select annotation type with lock/disable lock
Annotator.fn.lockSelect = function(type, lock) {
  if (!this.img) {
    this.annType.prop('disabled', true);
  }
  else {
    this.annType.prop('disabled', lock);

    if (lock) {
      if (type === "rect") {
        this.annType.val('Box');
      }
      else {
        this.annType.val('Polygon');
      }
    }
  }
};

Annotator.fn.updateControls = function() {
  var ath = this.annHelper;

  this.prevFtr.prop('disabled', ath.fInd === 0 || !this.img);
  this.nextFtr.prop('disabled', ath.fInd === ath.ftrs.length - 1 || !this.img);
  this.prevAnn.prop('disabled', ath.aInd === 0 || !this.img);

  // Logic for enabling the 'next annribute' button
  var ind = ath.anns.indexOf(ath.getAnn())+1;
  var nextValid = false;

  if (ind < ath.anns.length) {
    nextValid = ath.anns[ind].valid;
  }

  this.nextAnn.prop('disabled', !ath.getAnn().valid && !nextValid || !this.img);
  this.delAnn.prop('disabled', !ath.getAnn().valid || !this.img);

  this.zoomin.prop('disabled', !this.img);
  this.zoomout.prop('disabled', !this.img);
  this.pan.prop('disabled', !this.img);
  this.annotate.prop('disabled', !this.img);
};

Annotator.fn.updateTitle = function() {
  var name = this.annHelper.getFtr().name;
  var ind  = this.annHelper.fInd;
  var len  = this.annHelper.ftrs.length;
  this.title.text("Annotating: " + name + " (" + (ind+1) + "/" + len + ")");
};

//////////////////////////////////////////////////////
// Tool switching

// Switches between the main annotation tools:
// Annotation ('annotate')
// Panning ('pan')
Annotator.fn.switchOp = function(op) {
  if (op === "annotate") {
    this.curTool = new AnnTool(this);
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
  a.annsIn(input);
  a.cssIn(input);

  a.updateControls();
  a.updateTitle();

  return a;
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
    for (var i = 0; i < ftr.anns.length; i++) {
      this.drawAnn(ftr.anns[i], f);
    }
  }
};

// Annotation draw op
CanvasHelper.fn.drawAnn = function(ann, fInd) {
  var g = this.g;

  var cols =
  [
    "rgb(255, 20, 20)",
    "rgb(0, 200, 0)",
    "rgb(00, 0, 255)",
    "rgb(255, 255, 0)",
    "rgb(50, 200, 200)"
  ];

  if (!ann.valid) {
    return;
  }

  var col = cols[fInd % cols.length];
  var fillCol = col;

  if (ann === this.parent.annHelper.getAnn()) {
    fillCol = "white";
  }

  g.shadowColor = "#000";
  g.shadowBlur = 1;
  g.strokeStyle = col;
  g.lineWidth = 1.5 / this.curScale;
  g.fillStyle = fillCol;

  // Shape drawing (n-point)
  var pts = ann.getDrawPts();
  
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);

  for (var i = 1; i < pts.length; i++) {
    g.lineTo(pts[i].x, pts[i].y);
  }

  g.lineTo(pts[0].x, pts[0].y);
  g.stroke();

  for (i = 0; i < pts.length; i++) {
    this.drawPt(pts[i]);
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

// Annotations - as distinct on the canvas
function createAnnotation(type) {
  //this.valid = false;
  //this.pts = [{x:0,y:0}, {x:0,y:0}];
  //this.type = type;

  switch (type) {
    case 'rect':
      return new RectAnn();
    case 'poly':
      return new PolyAnn();
  }
}

// TODO: Something with this
// Annotation.prototype.reset = function(type) {
//   this.valid = false;
//   this.pts = [{x:0,y:0}, {x:0,y:0}];

//   if (type != null) {
//     this.type = type;
//   }
// };

// Shape superclass
function SuperShape() {
  this.valid = false;
  this.pts = [];
  this.type = 'none';
}

SuperShape.fn = SuperShape.prototype;

/*jshint unused:vars*/
// Available functions for shapes with default/empty defns
SuperShape.fn.invalidate = function() {this.valid = false;};
SuperShape.fn.addPt = function(pt) {};
SuperShape.fn.modLastPt = function(pt) {};
SuperShape.fn.modPt = function(ind, pt) {};
SuperShape.fn.insPt = function(ind, pt) {};
SuperShape.fn.delPt = function(ind) {};
SuperShape.fn.getDrawPts = function() {return [];};
SuperShape.fn.getExport = function() {return {};};
SuperShape.fn.getNumPts = function() {return this.pts.length;};


// Rect shape definition //
function RectAnn() {
  SuperShape.call(this);
}
RectAnn.prototype = Object.create(SuperShape.prototype);
RectAnn.fn = RectAnn.prototype;

RectAnn.fn.addPt = function(newPt) {
  // Init
  if (this.pts.length === 0) {
    this.pts.push(newPt);
    this.pts.push(newPt);
    this.valid = true;
    return true;
  }
  else {
    // Set the second point
    this.pts[1] = newPt;
    return false;
  }
};

RectAnn.fn.modLastPt = function(pt) {
  if (this.pts.length === 2) {
    this.pts[1] = pt;
  }
};

RectAnn.fn.getDrawPts = function() {
  var res = [];

  var x0 = this.pts[0].x;
  var y0 = this.pts[0].y;
  var x1 = this.pts[1].x;
  var y1 = this.pts[1].y;

  res.push({x:x0, y:y0});
  res.push({x:x1, y:y0});
  res.push({x:x1, y:y1});
  res.push({x:x0, y:y1});
  res.push({x:x0, y:y0});

  return res;
};

RectAnn.fn.delPt = function(ind) {
  // Deleting a rect point isn't meaningful -
  // invalidate the shape
  this.invalidate();
};

RectAnn.fn.getExport = function() {
  var res = {};

  res.type = 'rect';

  var x0 = this.pts[0].x;
  var y0 = this.pts[0].y;
  var x1 = this.pts[1].x;
  var y1 = this.pts[1].y;

  var dx = Math.abs(x1-x0);
  var dy = Math.abs(y1-y0);
  var x = Math.min(x0, x1);
  var y = Math.min(y0, y1);

  res.pos = {x : x, y : y};
  res.size = {width : dx, height : dy};

  return res;
};


// Polygon shape definition //
function PolyAnn() {
  SuperShape.call(this);
}

PolyAnn.prototype = Object.create(SuperShape.prototype);
PolyAnn.fn = PolyAnn.prototype;

PolyAnn.fn.addPt = function(pt) {
  if (this.pts.length === 0) {
    this.pts = [pt, pt];
  }
  else {
    this.pts.push(pt);
  }

  this.valid = true;
  return true;
};

PolyAnn.fn.modLastPt = function(pt) {
  if (this.pts.length > 0) {
    this.pts[this.pts.length-1] = pt;
  }
};

PolyAnn.fn.getDrawPts = function() {
  return this.pts;
};

PolyAnn.fn.delPt = function(ind) {
  this.pts.splice(ind);

  if (this.pts.length < 2) {
    this.invalidate();
    this.pts = [];
  }
};

PolyAnn.fn.getExport = function() {
  var res = {};

  res.type = 'poly';
  res.points = this.pts;

  return res;
};

/*jshint unused:true*/

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

function AnnTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
  this.ann = null;
}
AnnTool.prototype = Object.create(SuperTool.prototype);
AnnTool.fn = AnnTool.prototype;

// Mouse up - add a point to the annotation
AnnTool.fn.lbUp = function(x, y) {
  var a = this.parent;

  // Create annotation if we're not already making
  // one
  if (!this.active) {
    this.active = true;
    this.ann = a.annHelper.newAnn();
  }

  var offset = a.canvas.offset();
  x -= offset.left;
  y -= offset.top;
  var pt = ptToImg(a.cHelper, x, y);

  this.active = this.ann.addPt(pt);
  a.updateControls();
};

// Double click - finish a polygon annotation
AnnTool.fn.lbDbl = function(x, y) {
  // NB: We get 2x 'up' events before the double-click
  // Need to remove erroneous extra point
  if (this.active) {
    var a = this.parent;
    this.active = false;

    this.ann.delPt(-1);
    this.ann.delPt(-1);

    a.showChange();
  }
};

// Mouse move - update last point
AnnTool.fn.mMove = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();
    x -= offset.left;
    y -= offset.top;
    var pt = ptToImg(a.cHelper, x, y);

    this.ann.modLastPt(pt);
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
  this.anns = [];
  this.annC = 0;
}

}(jQuery));
