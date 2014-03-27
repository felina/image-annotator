// Shape superclass
function SuperShape() {
  this.valid = false;
  this.pts = [];
  this.type = 'none';
}

SuperShape.fn = SuperShape.prototype;

/*jshint unused:vars*/
// Available functions for shapes with default/empty defns
SuperShape.fn.invalidate  = function() {this.valid = false;};
SuperShape.fn.isValid     = function() {return this.valid;};
SuperShape.fn.addPt       = function(pt) {};
SuperShape.fn.modLastPt   = function(pt) {};
SuperShape.fn.modPt       = function(ind, pt) {};
SuperShape.fn.insPt       = function(ind, pt) {};
SuperShape.fn.delPt       = function(ind) {};
SuperShape.fn.getDrawPts  = function() {return [];};
SuperShape.fn.getExport   = function() {return {};};
SuperShape.fn.getNumPts   = function() {return this.pts.length;};
SuperShape.fn.getPts      = function() {return this.pts;};
SuperShape.fn.canInsPt    = function() {return false;};

// Default implementation of getBounds should suffice for
// most shapes
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
