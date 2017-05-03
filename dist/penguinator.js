(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Feature = require('./feature');
var createAnnotation = require('./util').createAnnotation;

/**
 * AnnHelper deals with managing the annotation
 * data and doing import/export.
 * @param {Annotator} parent The annotator using this helper instance
 * @constructor
 */
function AnnHelper(parent) {
  this.parent = parent;

  /** @type {Array.<SuperShape>} The stored annotations */
  this.anns = [];
  this.aInd = 0;
  this.fInd = 0;
  /** @type {Array.<Feature>} The stored features */
  this.ftrs = [];
  /** @type {String} The next annotation type to use */
  this.curType = "rect";
}
AnnHelper.fn = AnnHelper.prototype;

/**
 * Gets the current (selected) annotation
 * @return {Annotation}
 * @memberof AnnHelper#
 * @method getAnn
 */
AnnHelper.fn.getAnn = function() {
  if (this.anns.length === 0) {
    return null;
  }
  else {
    return this.anns[this.aInd];
  }
};

/**
 * Replaces the selected annotation with the one provided
 * @param  {RectAnn|PolyAnn|PointAnn} ann Annotation to store
 * @memberof AnnHelper#
 * @method replaceAnn
 */
AnnHelper.fn.replaceAnn = function(ann) {
  this.anns[this.aInd] = ann;
};

/**
 * Sets thse selection to an existing annotation.
 * @param {RectAnn|PolyAnn|PointAnn} ann
 * @memberof AnnHelper#
 * @method setAnn
 */
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

/**
 * Gets the current (selected) feature - the one being annotated.
 * @return {Feature}
 * @memberof AnnHelper#
 * @method getFtr
 */
AnnHelper.fn.getFtr = function() {
  if (this.ftrs.length === 0) {
    return null;
  }
  else {
    return this.ftrs[this.fInd];
  }
};

/**
 * Gets the complete feature array.
 * @return {Array.<Feature>}
 * @memberof AnnHelper#
 * @method getFtrs
 */
AnnHelper.fn.getFtrs = function() {
  return this.ftrs;
};

/**
 * Sets the feature selection to an existing feature.
 * This will do nothing if the specified feature is not
 * in the feature array.
 * @param {Feature} ftr
 * @memberof AnnHelper#
 * @method setFtr
 */
AnnHelper.fn.setFtr = function(ftr) {
  for (var f = 0; f < this.ftrs.length; f++) {
    if (ftr === this.ftrs[f]) {
      this.fInd = f;
      this.ftrChanged();
      return;
    }
  }
};

/**
 * Sets the helper to its default state.
 * @memberof AnnHelper#
 * @method reset
 */
AnnHelper.fn.reset = function() {
  // Reset annotation
  this.anns = [];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.ftrs = [];

  this.curType = "rect";
};

//////////////////////////////////////////////////////
// Data import / export

/**
 * Imports data for a single feature.
 * @param {{name : String, required : Boolean, shape : String}} ftr The feature to import
 * @memberof AnnHelper#
 * @method addFtrData
 */
AnnHelper.fn.addFtrData = function(ftr) {
  this.ftrs.push(new Feature(ftr.name, ftr.required, ftr.shape));
};

/**
 * Imports external feature data provided by the client application.
 * If input is null, a single default "image" feature is added.
 * @param  {Array.<{name : String, required : Boolean, shape : String}>} input
 * @memberof AnnHelper#
 * @method importFeatures
 */
AnnHelper.fn.importFeatures = function(input) {
  // Clear existing
  this.ftrs = [];

  if (input === null || input.length === 0) {
    // null feature array input
    input = [new Feature("Image", false, "any")];
  }

  for (var i = 0; i < input.length; i++) {
    this.addFtrData(input[i]);
  }

  this.parent.updateFtrs(this.ftrs);
  this.ftrChanged();
};

/**
 * Imports annotation data provided by the client application.
 * This depends on features having already being imported -
 * call importFeatures(null) to setup a 'default' feature.
 * @param  {Object} anns Map from feature names to annotation data arrays to import.
 * @memberof AnnHelper#
 * @method importAnns
 */
AnnHelper.fn.importAnns = function(anns) {
  // Iterate features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];
    f.anns = [];

    if (typeof anns[f.name] === 'undefined') {
      continue; // Skip feature if there was no input attribute data
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
      } else if (s.type == 'point') {
        ann.pts[0] = s.pos;
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

/**
 * Allows export of the annotations to the client application.
 * Returns object mapping feature names to arrays of annotations.
 * @return {Object}
 * @memberof AnnHelper#
 * @method exportAnns
 */
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

/**
 * Correctly finalises a feature change. Must be called
 * when the selected feature index changes.
 * @memberof AnnHelper#
 * @method ftrChanged
 */
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

/**
 * Selects the next feature in the feature array, up to the last.
 * @memberof AnnHelper#
 * @method nextFtr
 */
AnnHelper.fn.nextFtr = function() {
  this.fInd++;

  if (this.fInd >= this.ftrs.length) {
    this.fInd = this.ftrs.length - 1;
  }

  this.ftrChanged();
};

/**
 * Selects the previous feature in the feature array, down to the first.
 * @memberof AnnHelper#
 * @method prevFtr
 */
AnnHelper.fn.prevFtr = function() {
  this.fInd--;

  if (this.fInd < 0) {
    this.fInd = 0;
  }

  this.ftrChanged();
};


//////////////////////////////////////////////////////
// Annotation operations

/**
 * Invalidates the current annotation and clears it from storage.
 * @memberof AnnHelper#
 * @method delAnn
 */
AnnHelper.fn.delAnn = function() {
  this.getAnn().invalidate();
  this.clrInvalid();
};

// Creates a new annotation
/**
 * Creates an returns a new annotation. This is the only safe way to
 * add new annotations.
 * @return {RectAnn|PolyAnn|PointAnn}
 * @memberof AnnHelper#
 * @method newAnn
 */
AnnHelper.fn.newAnn = function() {
  this.anns.push(createAnnotation(this.curType));
  this.aInd = this.anns.length - 1;
  return this.getAnn();
};


//////////////////////////////////////////////////////
// Annotation UI

/**
 * Picks the closest annotation point to the given image-space
 * point, and returns it, its distance from the given point, 
 * its index in the shape, and the annotation itself.
 * @param  {Number} x X-coordinate in image space
 * @param  {Number} y Y-coordinate in image space
 * @return {{dist : Number, pt : {x : Number, y : Number}, ind : Integer, ann : RectAnn|PolyAnn|PointAnn}}
 * @memberof AnnHelper#
 * @method pickPt
 */
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

      if (ann.isValid()) {
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
  }

  return pick;
};

/**
 * Picks the closest annotation line to the given image-space point
 * and returns the closest point on the line, the annotation which
 * holds the line, the indices of the points which define the line,
 * and the distance from the given point to the line. Also returns
 * whether or not the picked point is an endpoint on the line.
 * @param  {Number} x X-coordinate in image space
 * @param  {Number} y Y-coordinate in image space
 * @return {{pt : {x : Number, y : Number}, dist : Number, ann : PolyAnn|RectAnn|PointAnn, i0 : Number, i1 : Number, endpt : Boolean}}
 * @memberof AnnHelper#
 * @method pickLn
 */
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

      if (ann.isValid()) {
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
  }

  return pick;
};


//////////////////////////////////////////////////////
// Misc functions

/**
 * Changes the current annotation type - the type to use
 * for the next created annotation.
 * @param  {String} type
 * @memberof AnnHelper#
 * @method changeType
 */
AnnHelper.fn.changeType = function(type) {
  this.curType = type;
};

/**
 * Clears invalidated annotations from the current annotation array.
 * @memberof AnnHelper#
 * @method clrInvalid
 */
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

module.exports = AnnHelper;
},{"./feature":5,"./util":15}],2:[function(require,module,exports){
// Other core components
var AnnHelper     = require('./annHelper');
var CanvasHelper  = require('./canvasHelper');

// Tools
var PanTool       = require('./tools/pan');
var AnnTool       = require('./tools/annotate');
var EditTool      = require('./tools/edit');

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

/**
 * Manages an annotator, which must be bound to a DOM object.
 * @param {Image} img Image to annotate. Can be null - a placeholder is displayed.
 * @param {Number} w Width of annotation area
 * @param {Number} h Height of annotation area
 * @constructor
 */
function Annotator(img, w, h) {
  // Parameters

  /** @type {Image} The image being annotated. */
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

  /** @type {SuperTool} The tool currently in use. */
  this.curTool = new PanTool(this);

  /** @type {AnnHelper} The attached annotation helper. */
  this.annHelper = new AnnHelper(this);

  /** @type {CanvasHelper} The attached canvas helper. */
  this.cHelper = null;
}
Annotator.fn = Annotator.prototype;


//////////////////////////////////////////////////////
// Data import / export

/**
 * Applies feature data import - calls {@link AnnHelper#importFeatures}.
 * @param  {Object} data
 * @memberOf Annotator#
 * @method   featuresIn
 */
Annotator.fn.featuresIn = function(data) {
  if (typeof data.features === 'undefined') {
    console.log('Not a valid object:', data);
    return; // No input provided
  }

  this.annHelper.importFeatures(data.features);
  this.showChange();
};

/**
 * Applies annotation data import - calls {@link AnnHelper#importAnns}.
 * @param  {Object} data
 * @memberOf Annotator#
 * @method   annsIn
 */
Annotator.fn.annsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    console.log('Not a valid object:', data);
    return; // No input provided
  }

  this.annHelper.importAnns(data.annotations);
  this.showChange();
};

/**
 * Applies css styling provided by the client application.
 * @param  {Css} data
 * @memberOf Annotator#
 * @method   cssin
 */
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

/**
 * Gets the annotation data describing the annotations the user has made.
 * @return {Object}
 * @memberOf Annotator#
 * @method   getExport
 */
Annotator.fn.getExport = function() {
  return this.annHelper.exportAnns();
};

/**
 * Gets the features being annotated.
 * @return {Object}
 * @memberOf Annotator#
 * @method   getFeatures
 */
Annotator.fn.getFeatures = function() {
  return this.annHelper.ftrs;
};

//////////////////////////////////////////////////////
// Update / build functionality

/**
 * Updates an existing annotator with a new image.
 * This also resets the pan/zoom and annotations,
 * @param  {Image} img New Image to use
 * @param  {Number} w New width of annotator
 * @param  {Number} h New height of annotator
 * @memberOf Annotator#
 * @method   update
 */
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

/**
 * Instantiates an annotator inside a DOM object. This creates the annotation canvas and all the HTML controls, and sets up user interaction events for all components.
 * @param  {JQuery} $parent
 * @memberOf Annotator#
 * @method   build
 */
Annotator.fn.build = function($parent) {
  // Register and generate annotator components
  $parent.addClass("annotator");
  $parent.data("Annotator", this);

  // Controls
  this.zoomin    = $('<button id="zoomin">+</button>').appendTo($parent);
  this.zoomout   = $('<button id="zoomout">-</button>').appendTo($parent);
  this.pan       = $('<button id="pan">Pan</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.annotate  = $('<button id="annot">Annotate</button>').appendTo($parent);
  this.annType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option><option>Point</option>')
                      .appendTo($parent);
  this.edit      = $('<button id="edit">Edit</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.title     = $('<label>Annotating:</label>').appendTo($parent)
                      .css("font-family", "sans-serif")
                      .css("font-size", "12px");

  this.ftrSel    = $('<select id="ftrsel"></select>')
                      .html('<option>Image</option>')
                      .prop('disabled', true)
                      .appendTo($parent);

  // Canvas container
  this.container = $('<div tabindex=0></div>')
                      .css(containercss)
                      .width(this.w)
                      .height(this.h)
                      .appendTo($parent);

  // The drawing canvas
  this.canvas = $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo(this.container);

  // Bottom controls
  this.delAnn    = $('<button id="nextAnn">Delete Annotation</button>').appendTo($parent);

  // Disable some of the normal page interaction in the canvas area
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
      case "Point":
        a.annHelper.changeType("point");
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

  this.container.keydown(function(e) {
    if (a.img) {
      var key = e.keyCode;
      console.log("Key " + key);
      a.curTool.keyDown(key);
    }
  });

  // Call the normal update
  this.update(this.img, this.w, this.h);
};


//////////////////////////////////////////////////////
// Annotation UI

/**
 * Shows a state change in the canvas and UI elements.
 * @memberOf Annotator#
 * @method   showChange
 */
Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
};

/**
 * Select annotation type to use with a lock, or disables the lock.
 * However, the "annotation type" control will stay disabled if the image is null.
 * @param  {String} type Type to switch to (with lock=false)
 * @param  {Boolean} lock Whether to lock the "annotation type" control
 * @memberOf Annotator#
 * @method   lockSelect
 */
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
      else if (type === "rect") {
        this.annType.val('Polygon');
      }
      else {
        this.annType.val('Point');
      }
    }
  }
};

/**
 * Selects a feature to display in the "selected feature" control.
 * @param  {Feature} ftr
 * @memberOf Annotator#
 * @method   dispFtr
 */
Annotator.fn.dispFtr = function(ftr) {
  this.ftrSel.val(ftr.fmtName());
};

/**
 * Show the feature list in the "selected feature" control.
 * @param  {Array.<Feature>} ftrs
 * @memberOf Annotator#
 * @method   updateFtrs
 */
Annotator.fn.updateFtrs = function(ftrs) {
  var options = "";
  this.ftrSel.prop('disabled', false);

  for (var f = 0; f < ftrs.length; f++) {
    var ftr = ftrs[f];
    options = options.concat("<option>" + ftr.fmtName() + "</option>");
  }

  this.ftrSel.empty().html(options);
};

/**
 * Updates the state of various controls, disabling or enabling them as appropriate to the Annotator's state.
 * @memberOf Annotator#
 * @method   updateControls
 */
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

/**
 * Switches between the main annotation tools: 'annotate' for Annotation, 'pan' for Panning and 'edit' for Annotation Editing.
 * @param  {String} op
 * @memberOf Annotator#
 * @method   switchOp
 */
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

module.exports = Annotator;
},{"./annHelper":1,"./canvasHelper":4,"./tools/annotate":12,"./tools/edit":13,"./tools/pan":14}],3:[function(require,module,exports){
var Annotator = require('./annotator');

/**
 * The annotator api function - applicable to any jQuery object, this creates an Annotator which is bound to the parent element.
 * If an annotator is already bound to the element, this method updates the annotator with the new input.
 * @param  {Object} input
 * @return {Annotator} The element's annotator.
 * @method annotator
 */
module.exports.annotator = function(input) {
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

},{"./annotator":2}],4:[function(require,module,exports){
/**
 * Manages the Annotator's canvas, passing user input to the tools and performing all rendering functionality.
 * @param {Annotator} parent The Annotator using this helper instance.
 * @constructor
 */
function CanvasHelper(parent) {
  this.parent = parent;
  var w = parent.w;
  var h = parent.h;

  /** @type {Canvas} The HTML canvas object */
  this.canvas = parent.canvas;
  /** @type {GraphicsContext} The canvas' attached graphics context, used for drawing  */
  this.g = this.canvas[0].getContext("2d");

  // Dim
  this.canvas[0].width = w;
  this.canvas[0].height = h;
  this.w = w;
  this.h = h;
  this.imgW = w;
  this.imgH = h;

  /** @type {Number} The default scaling level for the current image (see {@link CanvasHelper#calcZoom}) */
  this.defScale = 1.0;
  /** @type {Number} The current scaling level */
  this.curScale = this.defScale;
  /** @type {Number} The current x offset (pan) */
  this.xOffs = 0;
  /** @type {Number} The current y offset (pan) */
  this.yOffs = 0;

  /** @type {SuperShape} Annotation to highlight independently of the currently selected annotation */
  this.hlt = null;
  this.select = [];
}

CanvasHelper.fn = CanvasHelper.prototype;

/**
 * Re-draws the canvas - updates the view of the image and its annotations.
 * @memberOf CanvasHelper#
 * @method   repaint
 */
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

/**
 * Draws an annotation to the canvas.
 * @param  {SuperShape} ann Annotation to draw.
 * @param  {Number} fInd The index of the feature the annotation belongs to.
 * @memberOf CanvasHelper#
 * @method   drawAnn
 */
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

  if (ann === this.hlt || this.parent.annHelper.getAnn() === ann) {
    cInd = 1;
    fillCol = col[1];
    drawPts = true;
  }

  // Make sure to always draw point annontations.
  if (ann.type === 'point' || this.parent.annHelper.getAnn() === 'point') {
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

/**
 * Draws a point as a small circle to the canvas.
 * @param  {Object} pt
 * @memberOf CanvasHelper#
 * @method   drawPt
 */
CanvasHelper.fn.drawPt = function(pt) {
  var g = this.g;
  g.beginPath();
  g.arc(pt.x, pt.y, 3/this.curScale, 0, 2*Math.PI, false);
  g.fill();
};

/**
 * Pans the view of the image and annotations.
 * @param  {Number} x Distance to pan horizontally
 * @param  {Number} y Distance to pan vertically
 * @memberOf CanvasHelper#
 * @method   doPan
 */
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

/**
 * Zooms in or out of the image and annotations.
 * @param  {Number} scale Scaling factor, e.g. 2 to zoom in by 2x
 * @memberOf CanvasHelper#
 * @method   zoom
 */
CanvasHelper.fn.zoom = function(scale) {
  // New scaling level
  this.curScale *= scale;

  if (this.curScale < this.defScale) {
    this.curScale = this.defScale;
  }

  this.doPan(0, 0);
  this.repaint();
};

/**
 * Updates the canvas to new dimensions and resets the pan and zoom to their default levels.
 * @param  {Number} w New canvas width
 * @param  {Number} h New canvas height
 * @memberOf CanvasHelper#
 * @method   reset
 */
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

/**
 * Finalizes image load, registering the image's true width and height. Calls {@link CanvasHelper#calcZoom}.
 * This is called automatically when a new image finishes loading.
 * @param  {Image} img
 * @memberOf CanvasHelper#
 * @method   imgLoaded
 */
CanvasHelper.fn.imgLoaded = function(img) {
  // Grab the image dimensions. These are only available
  // once the image is fully loaded
  this.imgW = img[0].width;
  this.imgH = img[0].height;

  this.calcZoom();
  this.curScale = this.defScale;

  this.repaint();
};

/**
 * Calculates the correct default zoom level, taking into account aspect ratio to keep the image fully in view at the furthest zoom level.
 * @memberOf CanvasHelper#
 * @method   calcZoom
 */
CanvasHelper.fn.calcZoom = function() {
  // We can use the dimensions and the available canvas
  // area to work out a good zoom level
  var xRatio = this.w / this.imgW;
  var yRatio = this.h / this.imgH;
  var absRatio = Math.min(xRatio, yRatio);

  this.defScale = absRatio * 0.9;
};

/**
 * Sets the annotation which is to be highlighted.
 * @param {SuperShape} ann
 * @memberOf CanvasHelper#
 * @method   setHlt
 */
CanvasHelper.fn.setHlt = function(ann) {
  this.hlt = ann;
};

/**
 * Utility function which transforms a point from screen to image space according to the current pan and zoom settings.
 * @param  {Number} xin
 * @param  {Number} yin
 * @return {Object} Transformed point
 * @memberOf CanvasHelper#
 * @method   ptToImg
 */
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

/**
 * Utility function which transforms a distance from screen to image space.
 * @param  {Number} dist
 * @return {Number} Scaled distance
 * @memberOf CanvasHelper#
 * @method   scaleDist
 */
CanvasHelper.fn.scaleDist = function(dist) {
  return dist / this.curScale;
};

module.exports = CanvasHelper;
},{}],5:[function(require,module,exports){
/**
 * Describes a feature to be annotated.
 * @param {String} name
 * @param {Boolean} required
 * @param {String} shape Allowed type(s) of annotation. Can be "any".
 * @constructor
 */
function Feature(name, required, shape) {
  /** @type {String} The feature's name */
  this.name = name;
  /** @type {Boolean} Whether the feature is required (currently unused!) */
  this.req = required;
  /** @type {String} Allowed type(s) of annotation. Can be "any". */
  this.shape = shape;
  /** @type {Array.<SuperShape>} The stored annotations for the feature */
  this.anns = [];
  this.annC = 0;
}
Feature.fn = Feature.prototype;

/**
 * Returns a formatted name, with the first letter capitalized.
 * @return {String}
 * @memberOf Feature#
 * @method fmtName
 */
Feature.fn.fmtName = function() {
  var first = this.name.charAt(0).toUpperCase();
  return first.concat(this.name.substr(1));
};

module.exports = Feature;
},{}],6:[function(require,module,exports){
var api = require('./api');

/**
 * Registers the annotator API function to jQuery objects. Called immediately on load of the script.
 * @param  {JQuery} $
 * @method Initializer
 */
(function($) {
  $.fn.annotator = api.annotator;
}(jQuery));
},{"./api":3}],7:[function(require,module,exports){
var SuperShape = require('../superShape');

/**
 * Annotation of a single point.
 * @constructor
 * @extends {SuperShape}
 */
function PointAnn() {
  SuperShape.call(this);
  this.type = 'point';
}

PointAnn.prototype = Object.create(SuperShape.prototype);
PointAnn.fn = PointAnn.prototype;

/*jshint unused:vars*/

/**
 * Creates the point.
 * @param {Object} pt
 * @return {Boolean} True if another point can be added, false if the shape is complete.
 * @memberOf PointAnn#
 * @method   addPt
 */
PointAnn.fn.addPt = function(newPt) {
  // Init
  if (this.pts.length === 0) {
    this.pts.push(newPt);
    this.valid = true;
    return false;
  }
};

/**
 * Modifies the point added to match the input.
 * @param  {Object} pt
 * @memberOf PointAnn#
 * @method   modLastPt
 */
PointAnn.fn.modLastPt = function(pt) {
    if (this.pts.length === 1) {
        this.pts[0] = pt;
    }
};

/**
 * Modifies the single point at the given index to match the input.
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf PointAnn#
 * @method   modPt
 */
PointAnn.fn.modPt = function(ind, pt) {
    if (this.pts.length === 1) {
        this.pts[0] = pt;
    }
};

/**
 * Gets an array of the single point to draw - called by the {@link CanvasHelper}.
 * @return {Array} Array of one single point to draw
 * @memberOf PointAnn#
 * @method   getDrawPts
 */
PointAnn.fn.getDrawPts = function() {
  if (!this.valid) {
    return [];
  }

  var res = [];

  var x0 = this.pts[0].x;
  var y0 = this.pts[0].y;

  res.push({x:x0, y:y0});
  res.push({x:x0, y:y0});

  return res;
};

/**
 * Gets the array of the single point as the user will interact with it - see {@link PointAnn#getDrawPts} for point to be drawn.
 * @return {Array} Array of one single point
 * @memberOf PointAnn#
 * @method   getPts
 */
PointAnn.fn.getPts = function() {
  if (this.valid) {
    var pts = [this.getDrawPts()[0]];
    return pts;
  }
  else {
    return [];
  }
};

/**
 * Deleting a single point isn't meaningful -
 * instead, this method override invalidates the shape,
 * essentially deleting it.
 * @param  {Number} ind
 * @memberOf PointAnn#
 * @method   delPt
 */
PointAnn.fn.delPt = function(ind) {
  this.invalidate();
};

/**
 * Gets the export data for the annotation.
 * @return {Object} Data for export to client application
 * @memberOf PointAnn#
 * @method   getExport
 */
PointAnn.fn.getExport = function() {
  var res = {};

  res.type = 'point';

  var x = this.pts[0].x;
  var y = this.pts[0].y;

  res.pos = {x : x, y : y};

  return res;
};

/*jshint unused:true*/

module.exports = PointAnn;
},{"../superShape":10}],8:[function(require,module,exports){
var SuperShape = require('../superShape');

/**
 * Polygon Shaped Annotation
 * @constructor
 * @extends {SuperShape}
 */
function PolyAnn() {
  SuperShape.call(this);
  this.type = 'poly';
}

PolyAnn.prototype = Object.create(SuperShape.prototype);
PolyAnn.fn = PolyAnn.prototype;

/*jshint unused:vars*/

/**
 * Adds a point to the polygon - each point is notionally 'connected' in turn to the next, looping back around to the first.
 * @param {Object} pt
 * @return {Boolean} Always true (A Polygon is never 'complete')
 * @memberOf PolyAnn#
 * @method   addPt
 */
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

/**
 * Inserts a point after the given index.
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf PolyAnn#
 * @method   insPt
 */
PolyAnn.fn.insPt = function(ind, pt) {
  if (ind < 0 || ind > this.pts.length) {
    return;
  }

  this.pts.splice(ind, 0, pt);
};

/**
 * Whether or not a point can be inserted into the polygon.
 * Overrides {@link SuperTool} definition - since the polygon has an arbitray number of points, this always returns true.
 * @return {Boolean} Always true
 * @memberOf PolyAnn#
 * @method   canInsPt
 */
PolyAnn.fn.canInsPt = function() {
  return true;
};

/**
 * Modifies the last point added to match the input.
 * @param  {Object} pt
 * @memberOf PolyAnn#
 * @method   modLastPt
 */
PolyAnn.fn.modLastPt = function(pt) {
  if (this.pts.length > 0) {
    this.pts[this.pts.length-1] = pt;
  }
};

/**
 * Modifies the point at the given index to match the input.
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf PolyAnn#
 * @method   modPt
 */
PolyAnn.fn.modPt = function(ind, pt) {
  if (ind >= 0 && ind < this.pts.length) {
    this.pts[ind] = pt;
  }
};

/**
 * Gets an array of points to draw - called by the {@link CanvasHelper}.
 * For the polygon, this just returns the stored points with a repeat of the first point appended, in order to create the desired loop.
 * @return {Array} Array of points to draw
 * @memberOf PolyAnn#
 * @method   getDrawPts
 */
PolyAnn.fn.getDrawPts = function() {
  return this.pts.concat([this.pts[0]]);
};

/**
 * Deletes the point at the given index.
 * @param  {Number} ind
 * @memberOf PolyAnn#
 * @method   delPt
 */
PolyAnn.fn.delPt = function(ind) {
  this.pts.splice(ind, 1);

  if (this.pts.length < 2) {
    this.invalidate();
    this.pts = [];
  }
};

/**
 * Gets the export data for the annotation.
 * For the polygon, this just returns export data with the internally stored points.
 * @return {Object} Data for export to client application
 * @memberOf PolyAnn#
 * @method   getExport
 */
PolyAnn.fn.getExport = function() {
  var res = {};

  res.type = 'poly';
  res.points = this.pts;

  return res;
};

/*jshint unused:true*/

module.exports = PolyAnn;
},{"../superShape":10}],9:[function(require,module,exports){
var SuperShape = require('../superShape');

/**
 * Rectangle Shaped Annotation. Defined by exactly two points.
 * @constructor
 * @extends {SuperShape}
 */
function RectAnn() {
  SuperShape.call(this);
  this.type = 'rect';
}

RectAnn.prototype = Object.create(SuperShape.prototype);
RectAnn.fn = RectAnn.prototype;

/*jshint unused:vars*/

/**
 * Adds a point to the rectangle - the first call will add the first point, and every subsequent call will modify the second.
 * @param {Object} pt
 * @return {Boolean} True if another point can be added, false if the shape is complete.
 * @memberOf RectAnn#
 * @method   addPt
 */
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

/**
 * Modifies the last point added to match the input.
 * @param  {Object} pt
 * @memberOf RectAnn#
 * @method   modLastPt
 */
RectAnn.fn.modLastPt = function(pt) {
  if (this.pts.length === 2) {
    this.pts[1] = pt;
  }
};

/**
 * Modifies the point at the given index to match the input.
 * For the rectangle, the indices are 'faked' - this function accepts 0-3 when only two
 * points are stored. This allows the tools to interact with the shape as though control
 * points exist at all four corners.
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf RectAnn#
 * @method   modPt
 */
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

/**
 * Gets an array of points to draw - called by the {@link CanvasHelper}.
 * For the rectangle, this generates an array of five points based on the stored
 * two. (Note: the first point is repeated at the end to create the desired loop)
 * @return {Array} Array of points to draw
 * @memberOf RectAnn#
 * @method   getDrawPts
 */
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

/**
 * Gets the points array as the user will interact with them - see {@link RectAnn#getDrawPts} for points to be drawn.
 * @return {Array} Array of four points - the corners of the rectangle
 * @memberOf RectAnn#
 * @method   getPts
 */
RectAnn.fn.getPts = function() {
  if (this.valid) {
    var pts = this.getDrawPts().slice(0, -1);
    return pts;
  }
  else {
    return [];
  }
};

/**
 * Deleting a point from a rectangle isn't meaningful -
 * instead, this method override invalidates the shape,
 * essentially deleting it.
 * @param  {Number} ind
 * @memberOf RectAnn#
 * @method   delPt
 */
RectAnn.fn.delPt = function(ind) {
  this.invalidate();
};

/**
 * Gets the export data for the annotation.
 * For the rectangle, this generates an object holding a position
 * (for the top-left point) and a 'size' (width and height).
 * @return {Object} Data for export to client application
 * @memberOf RectAnn#
 * @method   getExport
 */
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

module.exports = RectAnn;
},{"../superShape":10}],10:[function(require,module,exports){
/**
 * Parent class for the different annotation types.
 * @constructor
 */
function SuperShape() {
  /** @type {Boolean} Indicates validity of the shape */
  this.valid = false;
  /** @type {Array} The array of points defining the shape */
  this.pts = [];
  /** @type {String} Indicates the type of the shape, e.g. "rect" */
  this.type = 'none';
}

SuperShape.fn = SuperShape.prototype;

/*jshint unused:vars*/
// Available functions for shapes with default/empty defns

/**
 * Invalidates the shape
 * @memberOf SuperShape#
 * @method   invalidate
 */
SuperShape.fn.invalidate  = function() {this.valid = false;};

/**
 * Determines if the shape is valid.
 * @return {Boolean} Whether the shape is valid.
 * @memberOf SuperShape#
 * @method   isValid
 */
SuperShape.fn.isValid     = function() {return this.valid;};

/**
 * Adds a point to the shape.
 * @abstract 
 * @param {Object} pt
 * @return {Boolean} False if the shape is complete
 * @memberOf SuperShape#
 * @method   addPt
 */
SuperShape.fn.addPt       = function(pt) {return false;};

/**
 * Modifies the last point to match the input.
 * @abstract
 * @param  {Object} pt
 * @memberOf SuperShape#
 * @method   modLastPt
 */
SuperShape.fn.modLastPt   = function(pt) {};

/**
 * Modifies the point at the given index to match the input.
 * @abstract
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf SuperShape#
 * @method   modPt
 */
SuperShape.fn.modPt       = function(ind, pt) {};

/**
 * Inserts a point after the given index.
 * @abstract
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf SuperShape#
 * @method   insPt
 */
SuperShape.fn.insPt       = function(ind, pt) {};

/**
 * Deletes the point at the given index.
 * @abstract
 * @param  {Number} ind
 * @memberOf SuperShape#
 * @method   delPt
 */
SuperShape.fn.delPt       = function(ind) {};

/**
 * Gets an array of points to draw - called by the {@link CanvasHelper}.
 * @abstract
 * @return {Array} Array of points to draw
 * @memberOf SuperShape#
 * @method   getDrawPts
 */
SuperShape.fn.getDrawPts  = function() {return [];};

/**
 * Gets the export data for the annotation.
 * @abstract
 * @return {Object} Data for export to client application
 * @memberOf SuperShape#
 * @method   getExport
 */
SuperShape.fn.getExport   = function() {return {};};

/**
 * Gets the number of points in the shape.
 * @return {Number} Number of points
 * @memberOf SuperShape#
 * @method   getNumPts
 */
SuperShape.fn.getNumPts   = function() {return this.pts.length;};

/**
 * Gets the points array as the user will interact with them - see {@link SuperShape#getDrawPts} for points to be drawn.
 * @return {Array} Array of points
 * @memberOf SuperShape#
 * @method   getPts
 */
SuperShape.fn.getPts      = function() {return this.pts;};

/**
 * Whether or not a point can be inserted into the shape.
 * @abstract
 * @return {Boolean}
 * @memberOf SuperShape#
 * @method   canInsPt
 */
SuperShape.fn.canInsPt    = function() {return false;};

/**
 * Calculates the rectangular boudns of a shape. The default implementation of this method should suffice for most shapes.
 * @return {Object}
 * @memberOf SuperShape#
 * @method   getBounds
 */
SuperShape.fn.getBounds   = function() {
  if (this.pts.length === 0) {
    return null;
  }

  var out = {};
  out.x0 = this.pts[0].x;
  out.y0 = this.pts[0].y;
  out.x1 = out.x0;
  out.y1 = out.y0;

  for (var i = 1; i < this.pts.length; i++) {
    var pt = this.pts[i];
    out.x0 = Math.min(out.x0, pt.x);
    out.x1 = Math.max(out.x1, pt.x);
    out.y0 = Math.min(out.y0, pt.y);
    out.y1 = Math.max(out.y1, pt.y);
  }

  return out;
};

/*jshint unused:true*/

module.exports = SuperShape;

},{}],11:[function(require,module,exports){
/**
 * The parent class for tools (essentially user input handlers)<br/>
 * The default handlers all do nothing when called.
 * @constructor
 */
function SuperTool() {
  this.x0 = 0;
  this.x1 = 0;
  this.y0 = 0;
  this.y1 = 0;

  /** @type {Boolean} Indicates whether or not the tool is actively performing an operation */
  this.active = false;
}

SuperTool.fn = SuperTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for left-click press
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbDown
 */
SuperTool.fn.lbDown   = function(x, y) {};

/**
 * Handler for left-click release
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbUp
 */
SuperTool.fn.lbUp     = function(x, y) {};

/**
 * Handler for left double-click
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbDbl
 */
SuperTool.fn.lbDbl    = function(x, y) {};

/**
 * Handler for right-click press
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method rbDown
 */
SuperTool.fn.rbDown   = function(x, y) {};

/**
 * Handler for right-click release
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method rbUp
 */
SuperTool.fn.rbUp     = function(x, y) {};

/**
 * Handler for mouse movement
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method  mMove
 */
SuperTool.fn.mMove    = function(x, y) {};

/**
 * Handler for keyboard input
 * @param  {Number} key
 * @abstract
 * @memberOf SuperTool#
 * @method keyDown
 */
SuperTool.fn.keyDown  = function(key) {};

/**
 * Allows custom rendering to be performed by the tool, e.g. for extra information on-screen while in use.
 * Called by {@link CanvasHelper} on the current tool when the canvas is repainted.
 * @param  {GraphicsContext} g Graphics context handle.
 * @abstract
 * @memberOf SuperTool#
 * @method draw
 */
SuperTool.fn.draw     = function(g) {};

/*jshint unused:true*/

module.exports = SuperTool;
},{}],12:[function(require,module,exports){
var SuperTool = require('../superTool');

/**
 * The annotation tool handles user input to the canvas. It allows
 * the user to draw out NEW annotations.
 * @param {Annotator} parent The Annotator the tool will operate on
 * @constructor
 * @extends {SuperTool}
 */
function AnnTool(parent) {
  SuperTool.call(this);
  this.parent = parent;

  /** @type {SuperShape} The annotation being drawn */
  this.ann = null;
}
AnnTool.prototype = Object.create(SuperTool.prototype);
AnnTool.fn = AnnTool.prototype;

/*jshint unused:vars*/

/**
 * Handles a left mouse up event, attempting to add a point to the annotation.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf AnnTool#
 * @method  lbUp
 */
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

/**
 * Handler for left double-click, which immediately completes a Polygon annotation
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf AnnTool#
 * @method lbDbl
 */
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

/**
 * Handler for mouse movement, which updates the last added point
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf AnnTool#
 * @method  mMove
 */
AnnTool.fn.mMove = function(x, y) {
  if (this.active) {
    var c = this.parent.cHelper;
    var pt = c.ptToImg(x, y);

    this.ann.modLastPt(pt);
    c.repaint();
  }
};

/**
 * Handler for keyboard input - delete key deletes the current annotation and ends drawing.
 * Backspace removes the last placed point, and deletes the annotation if it was the last point.
 * @param  {Number} key
 * @memberOf AnnTool#
 * @method keyDown
 */
AnnTool.fn.keyDown = function(key) {
  var anh = this.parent.annHelper;

  switch (key) {
    case 46: // Delete
      anh.getAnn().invalidate();
      this.active = false;
      this.parent.showChange();
      break;
    case 8: // Backspace
      if (this.active) {
        // Delete last placed point
        var pt = this.ann.getPts()[this.ann.getNumPts()-1];
        this.ann.delPt(-1);
        this.active = this.ann.isValid();

        if (this.active) {
          this.ann.modLastPt(pt);
        }

        this.parent.showChange();
      }
      break;
  }
};

/*jshint unused:true*/

module.exports = AnnTool;
},{"../superTool":11}],13:[function(require,module,exports){
var SuperTool = require('../superTool');

/**
 * The Edit tool handles user input to the canvas. It allows the user
 * to modify existing annotations by moving, adding or removing points.
 * @param {Annotator} parent The Annotator the tool will operate on
 * @constructor
 * @extends {SuperTool}
 */
function EditTool(parent) {
  SuperTool.call(this);
  this.parent = parent;

  /** @type {Boolean} Whether an edit operation can be started (depends on cursor position) */
  this.canEdit = false;
  /** @type {Boolean} Whether an edit operation is in progress */
  this.editing = false;
  /** @type {Number} Index of the point being edited */
  this.editPt = 0;
  /** @type {Object} Point to be displayed as a highlight on the canvas */
  this.hlt = null;
}

EditTool.prototype = Object.create(SuperTool.prototype);
EditTool.fn = EditTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for mouse movement, which either highlights nearby annotations/points or
 * continues an edit operation which is in progress by updating the editPt.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method  mMove
 */
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

/**
 * Handler for left-click press. This can select a new annotation to edit, 
 * a point on the current annotation to edit, or create a new point to edit.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method lbDown
 */
EditTool.fn.lbDown = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  // Run normal editing logic
  if (!this.canEdit) {
    // Make a new selection
    var pick = anh.pickLn(pt.x, pt.y);

    if (pick.dist < c.scaleDist(15)) {
      anh.setAnn(pick.ann);
      return;
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
    else if (ann.canInsPt()) {
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
  else if (this.editing) {
    // Finish point modification
    this.editing = false;
    return;
  }
};

/**
 * This performs the picking logic for highlighting
 * annotations or potential edit points for selection.
 * It is called by {@link EditTool#mMove} when an edit operation is not already in progress.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method passiveMove
 */
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

    // Only highlight edge if the shape allows it
    // Can always highlight points
    if (pick === pickln && !pick.ann.canInsPt()) {
      this.hlt = null;
    }
    else {
      this.hlt = pick.pt;
    }
  }
  else {
    this.canEdit = false;
    this.hlt = null;
  }

  if (pick.ann.type === 'point') {
    anh.aInd = anh.anns.indexOf(pick.ann);
    anh.curType = 'point';

    this.canEdit = true;

    if (pick === pickln && !pick.ann.canInsPt()) {
      this.hlt = null;
    }
    else {
      this.hlt = pick.pt;
    }
  }

  c.setHlt(pick.ann);
};

/**
 * Handler for right-click press, which deletes the highlighted point.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method rbDown
 */
EditTool.fn.rbDown = function(x, y) {
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

/**
 * Handler for keyboard input. The delete key removes the point currently being edited.
 * @param  {Number} key
 * @memberOf EditTool#
 * @method keyDown
 */
EditTool.fn.keyDown = function(key) {
  var anh = this.parent.annHelper;

  switch (key) {
    case 46: // Delete
      // Delete edit point if applicable
      if (this.editing) {
        anh.getAnn().delPt(this.editPt);
        this.editing = false;
      }
      // Otherwise the whole shape
      else {
        anh.delAnn();
      }

      this.parent.showChange();
      break;
  }
};

/**
 * Draws the current highlight point to the canvas - this is a point which can potentially
 * be selected, or a point which is being edited.
 * Called by {@link CanvasHelper} on the current tool when the canvas is repainted.
 * @param  {GraphicsContext} g Graphics context handle.
 * @memberOf EditTool#
 * @method draw
 */
EditTool.fn.draw = function(g) {
  if (this.hlt) {
    g.fillStyle = "white";
    this.parent.cHelper.drawPt(this.hlt);
  }
};


/*jshint unused:true*/

module.exports = EditTool;
},{"../superTool":11}],14:[function(require,module,exports){
var SuperTool = require('../superTool');

/**
 * The Pan tool handles user input to the canvas. It allows the user
 * to pan their vew of the image and annotations.
 * @param {Annotator} parent The Annotator the tool will operate on
 * @constructor
 * @extends {SuperTool}
 */
function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}

PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for left-click press, which starts the pan operation.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method lbDown
 */
PanTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    this.x0 = x;
    this.y0 = y;
    this.active = true;
  }
};

/**
 * Handler for left-click release, which ends the pan operation
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method lbUp
 */
PanTool.fn.lbUp = function(x, y) {
  this.active = false;
};

/**
 * Handler for mouse movement, which pans the canvas.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method  mMove
 */
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

module.exports = PanTool;
},{"../superTool":11}],15:[function(require,module,exports){
var RectAnn = require('./shapes/rect');
var PolyAnn = require('./shapes/poly');
var PointAnn = require('./shapes/point');

/**
 * Creates an annotation of the specified type.
 * Note: Use {@link AnnHelper#newAnn} to add new annotations, NOT this method.
 * @param  {String} type
 * @method
 */
module.exports.createAnnotation = function createAnnotation(type) {
  switch (type) {
    case 'rect':
      return new RectAnn();
    case 'poly':
      return new PolyAnn();
    case 'point':
      return new PointAnn();
  }
};

},{"./shapes/point":7,"./shapes/poly":8,"./shapes/rect":9}]},{},[6]);
