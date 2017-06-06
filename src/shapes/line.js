var SuperShape = require('../superShape');

/**
 * Polygon Shaped Annotation
 * @constructor
 * @extends {SuperShape}
 */
function LineAnn() {
  SuperShape.call(this);
  this.type = 'line';
}

LineAnn.prototype = Object.create(SuperShape.prototype);
LineAnn.fn = LineAnn.prototype;

/*jshint unused:vars*/

/**
 * Adds a point to the line - each point is notionally 'connected' in turn to the next.
 * @param {Object} pt
 * @return {Boolean} Always true (A Line is never 'complete')
 * @memberOf LineAnn#
 * @method   addPt
 */
LineAnn.fn.addPt = function(pt) {
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
 * @memberOf LineAnn#
 * @method   insPt
 */
LineAnn.fn.insPt = function(ind, pt) {
  if (ind < 0 || ind > this.pts.length) {
    return;
  }

  this.pts.splice(ind, 0, pt);
};

/**
 * Whether or not a point can be inserted into the line.
 * Overrides {@link SuperTool} definition - since the line has an arbitray number of points, this always returns true.
 * @return {Boolean} Always true
 * @memberOf LineAnn#
 * @method   canInsPt
 */
LineAnn.fn.canInsPt = function() {
  return true;
};

/**
 * Modifies the last point added to match the input.
 * @param  {Object} pt
 * @memberOf LineAnn#
 * @method   modLastPt
 */
LineAnn.fn.modLastPt = function(pt) {
  if (this.pts.length > 0) {
    this.pts[this.pts.length-1] = pt;
  }
};

/**
 * Modifies the point at the given index to match the input.
 * @param  {Number} ind
 * @param  {Object} pt
 * @memberOf LineAnn#
 * @method   modPt
 */
LineAnn.fn.modPt = function(ind, pt) {
  if (ind >= 0 && ind < this.pts.length) {
    this.pts[ind] = pt;
  }
};

/**
 * Gets an array of points to draw - called by the {@link CanvasHelper}.
 * For the line, this just returns the stored points.
 * @return {Array} Array of points to draw
 * @memberOf LineAnn#
 * @method   getDrawPts
 */
LineAnn.fn.getDrawPts = function() {
  return this.pts;
};

/**
 * Deletes the point at the given index.
 * @param  {Number} ind
 * @memberOf LineAnn#
 * @method   delPt
 */
LineAnn.fn.delPt = function(ind) {
  this.pts.splice(ind, 1);

  if (this.pts.length < 2) {
    this.invalidate();
    this.pts = [];
  }
};

/**
 * Gets the export data for the annotation.
 * For the line, this just returns export data with the internally stored points.
 * @return {Object} Data for export to client application
 * @memberOf LineAnn#
 * @method   getExport
 */
LineAnn.fn.getExport = function() {
  var res = {};

  res.type = 'line';
  res.points = this.pts;

  return res;
};

/*jshint unused:true*/

module.exports = LineAnn;