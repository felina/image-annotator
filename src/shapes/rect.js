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