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
 * @param  {RectAnn|PolyAnn} ann Annotation to store
 * @memberof AnnHelper#
 * @method replaceAnn
 */
AnnHelper.fn.replaceAnn = function(ann) {
  this.anns[this.aInd] = ann;
};

/**
 * Sets thse selection to an existing annotation.
 * @param {RectAnn|PolyAnn} ann
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
 * @return {RectAnn|PolyAnn}
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
 * @return {{dist : Number, pt : {x : Number, y : Number}, ind : Integer, ann : RectAnn|PolyAnn}}
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
 * @return {{pt : {x : Number, y : Number}, dist : Number, ann : PolyAnn|RectAnn, i0 : Number, i1 : Number, endpt : Boolean}}
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