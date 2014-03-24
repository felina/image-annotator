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


// Rect shape definition //
function RectAnn() {
  SuperShape.call(this);

  this.pts = [];
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


// Polygon shape definition //
function PolyAnn() {
  SuperShape.call(this);
  // TODO
}

/*jshint unused:true*/
