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
SuperShape.fn.getPts = function() {return this.pts;};


// Rect shape definition //
function RectAnn() {
  SuperShape.call(this);
  this.type = 'rect';
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

RectAnn.fn.getPts = function() {
  if (this.valid) {
    return this.getDrawPts();
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


// Polygon shape definition //
function PolyAnn() {
  SuperShape.call(this);
  this.type = 'poly';
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
