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