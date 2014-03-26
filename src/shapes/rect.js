var SuperShape = require('../superShape');

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

module.exports = RectAnn;