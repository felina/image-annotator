var SuperShape = require('../superShape');

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

module.exports = PolyAnn;