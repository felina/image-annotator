/*! penguinator - v3.6.0 - 2014-03-26
* https://github.com/felina/image-annotator
* Copyright (c) 2014 Alistair Wick <alistair.wk@gmail.com>; Licensed MIT */
(function($) {

// Annotation helper class definition //

// This deals with managing the annotation data,
// doing import/export etc

function AnnHelper(parent) {
  this.parent = parent;
  this.reset();
}
AnnHelper.fn = AnnHelper.prototype;

// Returns the current annotation
AnnHelper.fn.getAnn = function() {
  if (this.anns.length === 0) {
    return null;
  }
  else {
    return this.anns[this.aInd];
  }
};

// Replaces the currently selected annotation
AnnHelper.fn.replaceAnn = function(ann) {
  this.anns[this.aInd] = ann;
};

// Sets the selection to an existing annotation
AnnHelper.fn.setAnn = function(ann) {
  for (var f = 0; f < this.ftrs.length; f++) {
    var ftr = this.ftrs[f];
    for (var a = 0; a < ftr.anns.length; a++) {
      var foundA = ftr.anns[a];
      if (foundA === ann) {
        this.fInd = f;
        this.ftrChanged();
        this.aInd = a;
        this.anns = this.getFtr().anns;
        return;
      }
    }
  }
};

AnnHelper.fn.getFtr = function() {
  if (this.ftrs.length === 0) {
    return null;
  }
  else {
    return this.ftrs[this.fInd];
  }
};

AnnHelper.fn.getFtrs = function() {
  return this.ftrs;
};

// Sets the feature selection to an existing feature
AnnHelper.fn.setFtr = function(ftr) {
  for (var f = 0; f < this.ftrs.length; f++) {
    if (ftr === this.ftrs[f]) {
      this.fInd = f;
      this.ftrChanged();
      return;
    }
  }
};

// Resets to default state
AnnHelper.fn.reset = function() {
  // Reset annotation
  this.anns = [];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.ftrs = [];

  // Reset type
  this.curType = "rect";
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

  if (!input) {
    // null feature array input
    input = [new Feature("Image", false, "any")];
  }

  for (var i = 0; i < input.length; i++) {
    this.addFtrData(input[i]);
  }

  this.parent.updateFtrs(this.ftrs);
  this.ftrChanged();
};

// Attribute import - Depends on previous feature import
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
  this.parent.dispFtr(this.getFtr());
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
// Annotation operations

// Invalidates the current annotation -
// it is effectively deleted
AnnHelper.fn.delAnn = function() {
  this.getAnn().invalidate();
};

// Creates a new annotation
AnnHelper.fn.newAnn = function() {
  this.anns.push(createAnnotation(this.curType));
  this.aInd = this.anns.length - 1;
  return this.getAnn();
};


//////////////////////////////////////////////////////
// Annotation UI

// Picks the closest annotation point to
// the given image-space point
// Returns it, its index in the shape, and
// the annotation object itself
AnnHelper.fn.pickPt = function(x, y) {
  var pick = {};
  pick.pt = null;
  pick.dist = Infinity;
  pick.ann = null;
  pick.ind = 0;

  for (var f = 0; f < this.ftrs.length; f++) {
    var anns = this.ftrs[f].anns;
    for (var a = 0; a < anns.length; a++) {
      var ann = anns[a];
      var pts = ann.getPts();
      for (var p = 0; p < pts.length; p++) {
        // (For every point currently in the annotator)
        var pt = pts[p];
        var d = Math.sqrt(Math.pow(x-pt.x,2) + Math.pow(y-pt.y,2));

        if (d < pick.dist) {
          pick.dist = d;
          pick.pt = pt;
          pick.ind = p;
          pick.ann = ann;
        }
      }
    }
  }

  return pick;
};

// Pick the closest annotation line to
// the given image-space point
// Returns the closest point on the line, the
// annotation which holds the line, and the indices
// of the endpoints which define the line
AnnHelper.fn.pickLn = function(x, y) {
  var pick = {};
  pick.pt = null;
  pick.dist = Infinity;
  pick.ann = null;
  pick.i0 = 0;
  pick.i1 = 0;
  pick.endpt = false;

  for (var f = 0; f < this.ftrs.length; f++) {
    var anns = this.ftrs[f].anns;
    for (var a = 0; a < anns.length; a++) {
      var ann = anns[a];
      var pts = ann.getDrawPts();
      for (var p = 0; p < pts.length-1; p++) {
        // (For every line currently in the annotator)
        var i0 = p;
        var i1 = p+1;

        // These points define the line
        var p0 = pts[i0];
        var p1 = pts[i1];

        // 'u' defines a percentage along the line the closest point lies at
        var u = ((x - p0.x)*(p1.x - p0.x) + (y - p0.y)*(p1.y - p0.y)) /
                (Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));

        // Limit the range of u, and register if
        // it's an endpoint
        var endpt = false;
        if (u <= 0) {
          u = 0;
          endpt = true;
        }
        else if (u >= 1) {
          u = 1;
          endpt = true;
        }

        // 'pu' is the closest point on the line
        var pu = {};
        pu.x = p0.x + u*(p1.x - p0.x);
        pu.y = p0.y + u*(p1.y - p0.y);

        var d = Math.sqrt(Math.pow(x-pu.x,2) + Math.pow(y-pu.y,2));

        // We're finding the closest "closest point"
        if (d < pick.dist) {
          pick.dist = d;
          pick.pt = pu;
          pick.ann = ann;
          pick.i0 = i0;
          pick.i1 = i1;
          pick.endpt = endpt;
        }
      }
    }
  }

  return pick;
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
  this.edit = null;
  this.annType = null;
  this.ftrSel = null;
  this.delAnn = null;

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
  this.annotate  = $('<button id="annot">Annotate</button>').appendTo($parent);
  this.edit      = $('<button id="edit">Edit</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.annType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option>')
                      .appendTo($parent);

  this.delAnn    = $('<button id="nextAnn">X</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.title     = $('<label>Annotating:</label>').appendTo($parent)
                      .css("font-family", "sans-serif")
                      .css("font-size", "12px");

  this.ftrSel    = $('<select id="ftrsel"></select>')
                      .html('<option>Image</option>')
                      .prop('disabled', true)
                      .appendTo($parent);

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
  this.canvas[0].oncontextmenu = function(){return false;};

  // Generate the canvas helper
  this.cHelper = new CanvasHelper(this);

  var a = this; // loss of context when defining callbacks

  // Zoom control
  this.zoomin.click(function(){a.cHelper.zoom(1.25);});
  this.zoomout.click(function(){a.cHelper.zoom(0.8);});

  // Switching annotation modes
  this.annType.change(function() {
    var str = $(this).val();

    switch (str) {
      case "Box":
        a.annHelper.changeType("rect");
        a.switchOp("annotate");
        break;
      case "Polygon":
        a.annHelper.changeType("poly");
        a.switchOp("annotate");
        break;
    }
  });

  // Switching features
  this.ftrSel.change(function() {
    var str = $(this).val();
    var ftrs = a.annHelper.getFtrs();

    for (var f = 0; f < ftrs.length; f++) {
      var ftr = ftrs[f];

      if (str === ftr.fmtName()) {
        a.annHelper.setFtr(ftr);
        return;
      }
    }
  });

  // Operation selection
  this.pan.click(function(){ a.switchOp("pan"); });
  this.annotate.click(function(){ a.switchOp("annotate"); });
  this.edit.click(function(){ a.switchOp("edit"); });

  // Annotation deletion
  this.delAnn.click(function() {
    a.annHelper.delAnn();
    a.updateControls();
    a.cHelper.repaint();
  });

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ 
    if (a.img) {
      switch (e.which) {
        case 1:
          a.curTool.lbDown(e.pageX, e.pageY);
          break;
        case 3:
          e.preventDefault();
          a.curTool.rbDown(e.pageX, e.pageY);
          break;
      }
    }
  });

  this.canvas.mousemove(function(e){ a.curTool.mMove(e.pageX, e.pageY); });

  this.canvas.mouseup(function(e){
    if (a.img) {
      switch (e.which) {
        case 1:
          a.curTool.lbUp(e.pageX, e.pageY);
          break;
        case 3:
          e.preventDefault();
          a.curTool.rbUp(e.pageX, e.pageY);
          break;
      }
    }
  });

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

// Select feature to display
Annotator.fn.dispFtr = function(ftr) {
  this.ftrSel.val(ftr.fmtName());
};

// Show features
Annotator.fn.updateFtrs = function(ftrs) {
  var options = "";
  this.ftrSel.prop('disabled', false);

  for (var f = 0; f < ftrs.length; f++) {
    var ftr = ftrs[f];
    options = options.concat("<option>" + ftr.fmtName() + "</option>");
  }

  this.ftrSel.empty().html(options);
};

Annotator.fn.updateControls = function() {
  var ath = this.annHelper;

  this.delAnn.prop('disabled', !ath.getAnn().valid || !this.img);
  this.zoomin.prop('disabled', !this.img);
  this.zoomout.prop('disabled', !this.img);
  this.pan.prop('disabled', !this.img);
  this.annotate.prop('disabled', !this.img);
  this.edit.prop('disabled', !this.img);
};

//////////////////////////////////////////////////////
// Tool switching

// Switches between the main annotation tools:
// Annotation ('annotate')
// Panning ('pan')
Annotator.fn.switchOp = function(op) {
  switch (op) {
    case "annotate":
      this.curTool = new AnnTool(this);
      this.canvas.css("cursor", "crosshair");
      break;
    case "pan":
      this.curTool = new PanTool(this);
      this.canvas.css("cursor", "move");
      break;
    case "edit":
      this.curTool = new EditTool(this);
      this.canvas.css("cursor", "select");
      break;
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

  // Highlighting / selection visibility
  this.hlt = null;
  this.select = [];
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

  // Tools
  if (this.parent.curTool) {
    this.parent.curTool.draw(g);
  }
};

// Annotation draw op
CanvasHelper.fn.drawAnn = function(ann, fInd) {
  var g = this.g;

  var cols =
  [
    ["rgb(255, 20, 20)","rgb(255, 80, 80)"],
    ["rgb(0, 200, 0)","rgb(80, 240, 80)"],
    ["rgb(0, 0, 255)","rgb(80, 80, 255)"],
    ["rgb(255, 255, 0)","rgb(255, 255, 90)"],
    ["rgb(50, 200, 200)","rgb(90, 255, 255)"]
  ];

  if (!ann.valid) {
    return;
  }

  var col = cols[fInd % cols.length];
  var fillCol = col[0];
  var cInd = 0;
  var drawPts = false;

  if (ann === this.hlt || this.parent.annHelper.getAnn() === ann && !this.hlt) {
    cInd = 1;
    fillCol = col[1];
    drawPts = true;
  }

  g.shadowColor = "#FFF";
  g.shadowBlur = 0;
  g.fillStyle = fillCol;

  // Shape drawing (n-point)
  var pts = ann.getDrawPts();
  
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);

  for (var i = 1; i < pts.length; i++) {
    g.lineTo(pts[i].x, pts[i].y);
  }

  g.strokeStyle = col[cInd];
  g.lineWidth = 1.5 / this.curScale;
  g.stroke();

  if (drawPts) {
    for (i = 0; i < pts.length; i++) {
      this.drawPt(pts[i]);
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

// Set highlighted Annotation
CanvasHelper.fn.setHlt = function(ann) {
  this.hlt = ann;
};

// Screen to image space
CanvasHelper.fn.ptToImg = function(xin, yin) {
  var offset = this.canvas.offset();
  xin -= offset.left;
  yin -= offset.top;

  var a = this;
  var x = (xin-a.w/2-a.xOffs)/a.curScale;
  var y = (yin-a.h/2-a.yOffs)/a.curScale;

  if (x < -a.imgW/2) {x = -a.imgW/2;}
  if (x >  a.imgW/2) {x =  a.imgW/2;}
  if (y < -a.imgH/2) {y = -a.imgH/2;}
  if (y >  a.imgH/2) {y =  a.imgH/2;}

  var out = {x:x,y:y};

  return out;
};

// Scales a distance to image space
CanvasHelper.fn.scaleDist = function(dist) {
  return dist / this.curScale;
};

// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.anns = [];
  this.annC = 0;
}
Feature.fn = Feature.prototype;

// Returns formatted name
Feature.fn.fmtName = function() {
  var first = this.name.charAt(0).toUpperCase();
  return first.concat(this.name.substr(1));
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
SuperShape.fn.getPts = function() {return this.pts;};
SuperShape.fn.canInsPt = function() {return false;};
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
SuperTool.fn.rbDown = function(x, y) {};
SuperTool.fn.rbUp   = function(x, y) {};
SuperTool.fn.mMove  = function(x, y) {};
SuperTool.fn.draw   = function(g) {};
/*jshint unused:true*/

// Polygon shape definition //
function PolyAnn() {
  SuperShape.call(this);
  this.type = 'poly';
}

PolyAnn.prototype = Object.create(SuperShape.prototype);
PolyAnn.fn = PolyAnn.prototype;

/*jshint unused:vars*/

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

// Insert a point at the given index
PolyAnn.fn.insPt = function(ind, pt) {
  if (ind < 0 || ind > this.pts.length) {
    return;
  }

  this.pts.splice(ind, 0, pt);
};

PolyAnn.fn.canInsPt = function() {
  return true;
};

PolyAnn.fn.modLastPt = function(pt) {
  if (this.pts.length > 0) {
    this.pts[this.pts.length-1] = pt;
  }
};

PolyAnn.fn.modPt = function(ind, pt) {
  if (ind >= 0 && ind < this.pts.length) {
    this.pts[ind] = pt;
  }
};

PolyAnn.fn.getDrawPts = function() {
  return this.pts.concat([this.pts[0]]);
};

PolyAnn.fn.delPt = function(ind) {
  this.pts.splice(ind, 1);

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
// Rect shape definition //
function RectAnn() {
  SuperShape.call(this);
  this.type = 'rect';
}

RectAnn.prototype = Object.create(SuperShape.prototype);
RectAnn.fn = RectAnn.prototype;

/*jshint unused:vars*/

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

RectAnn.fn.modPt = function(ind, pt) {
  switch (ind) {
    case 0:
      this.pts[0] = pt;
      break;
    case 1:
      this.pts[1].x = pt.x;
      this.pts[0].y = pt.y;
      break;
    case 2:
      this.pts[1] = pt;
      break;
    case 3:
      this.pts[0].x = pt.x;
      this.pts[1].y = pt.y;
      break;
  }
};

RectAnn.fn.getDrawPts = function() {
  if (!this.valid) {
    return [];
  }

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

RectAnn.fn.getPts = function() {
  if (this.valid) {
    return this.getDrawPts().slice(0, -1);
  }
  else {
    return [];
  }
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

/*jshint unused:true*/

// Annotation tool class definition //
// This accepts user input to generate a *new* Annotation

function AnnTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
  this.ann = null;
}
AnnTool.prototype = Object.create(SuperTool.prototype);
AnnTool.fn = AnnTool.prototype;

/*jshint unused:vars*/

// Mouse up - add a point to the annotation
AnnTool.fn.lbUp = function(x, y) {
  var a = this.parent;

  // Create annotation if we're not already making
  // one
  if (!this.active) {
    this.active = true;
    this.ann = a.annHelper.newAnn();
  }

  var pt = a.cHelper.ptToImg(x, y);

  this.active = this.ann.addPt(pt);
  a.showChange();
};

// Double click - finish a polygon annotation
AnnTool.fn.lbDbl = function(x, y) {
  // NB: We get 2x 'up' events before the double-click
  // Need to remove erroneous extra points
  if (this.active) {
    var a = this.parent;
    this.active = false;

    this.ann.delPt(-1); // Remove pt from second click
    this.ann.delPt(-1); // Remove intermediate pt (would be next placed)

    a.showChange();
  }
};

// Mouse move - update last point
AnnTool.fn.mMove = function(x, y) {
  if (this.active) {
    var c = this.parent.cHelper;
    var pt = c.ptToImg(x, y);

    this.ann.modLastPt(pt);
    c.repaint();
  }
};
/*jshint unused:true*/

// Edit tool class definition //
// This allows selection and modification of existing annotations

function EditTool(parent) {
  SuperTool.call(this);
  this.parent = parent;

  this.canEdit = false;

  this.editing = false;
  this.editPt = 0;

  this.hlt = null;
}

EditTool.prototype = Object.create(SuperTool.prototype);
EditTool.fn = EditTool.prototype;

/*jshint unused:vars*/

EditTool.fn.mMove = function(x, y) {
  var a = this.parent;
  var c = a.cHelper;

  var pt = c.ptToImg(x, y);

  if (!this.editing) {
    this.passiveMove(pt.x, pt.y);
    a.showChange();
  }
  else {
    // Point editing
    var ann = a.annHelper.getAnn();
    ann.modPt(this.editPt, pt);
    this.hlt = pt;
    a.showChange();
  }
};

EditTool.fn.lbUp = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  if (!this.canEdit) {
    // Make a new selection
    var pick = anh.pickLn(pt.x, pt.y);

    if (pick.dist < c.scaleDist(15)) {
      anh.setAnn(pick.ann);
    }
  }
  else if (!this.editing) {
    // Point modifications
    var pickpt = anh.pickPt(pt.x, pt.y);

    if (pickpt.ann === ann && pickpt.dist < c.scaleDist(15)) {
      // Editing point
      this.editPt = pickpt.ind;
      this.editing = true;
      return;
    }

    // New points
    if (ann.canInsPt()) {
      var pickln = anh.pickLn(pt.x, pt.y);

      if (pickln.ann === ann && pickln.dist < c.scaleDist(15)) {
        // Editing *new* point - create it
        ann.insPt(pickln.i1, pt);
        this.editPt = pickln.i1;
        this.editing = true;
        return;
      }
    }
  }
  else {
    // Finish point modification
    this.editing = false;
  }
};

// Highlight annotations under the cursor
EditTool.fn.passiveMove = function(x, y) {
  var c = this.parent.cHelper;
  var anh = this.parent.annHelper;

  var pickpt = anh.pickPt(x, y);
  var pickln = anh.pickLn(x, y);
  var pick = null;

  // Compare line and point distances
  if (pickpt.dist < c.scaleDist(15)) {
    pick = pickpt;
  }
  else if (pickln.dist < c.scaleDist(15)) {
    pick = pickln;
  }
  else {
    this.canEdit = false;
    this.hlt = null;
    c.setHlt(null);
    return;
  }

  // At this point we know the distance is in range
  if (pick.ann === anh.getAnn()) {
    this.canEdit = true;
    this.hlt = pick.pt;
  }
  else {
    this.canEdit = false;
    this.hlt = null;
  }

  c.setHlt(pick.ann);
};

// Point deletion (right click)
EditTool.fn.rbUp = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  if (this.canEdit && !this.editing) {
    // Point deletion
    var pickpt = anh.pickPt(pt.x, pt.y);

    if (pickpt.ann === ann && pickpt.dist < c.scaleDist(15)) {
      // Editing point
      ann.delPt(pickpt.ind);
      return;
    }
  }
};

// Draw point to change/create
EditTool.fn.draw = function(g) {
  if (this.hlt) {
    g.fillStyle = "white";
    this.parent.cHelper.drawPt(this.hlt);
  }
};

/*jshint unused:true*/

// Pan tool class definition //

function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}

PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

/*jshint unused:vars*/

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

/*jshint unused:true*/

}(jQuery));
