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
