// Base tool class defn //

function SuperTool() {
  this.x0 = 0;
  this.x1 = 0;
  this.y0 = 0;
  this.y1 = 0;

  this.active = false;

}

SuperTool.fn = SuperTool.prototype;

/*jshint unused:vars*/
SuperTool.fn.lbDown = function(x, y) {};
SuperTool.fn.lbUp   = function(x, y) {};
SuperTool.fn.lbDbl  = function(x, y) {};
SuperTool.fn.mMove  = function(x, y) {};


// Pan tool class definition //

function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}
PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

PanTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    this.x0 = x;
    this.y0 = y;
    this.active = true;
  }
};

PanTool.fn.lbUp = function(x, y) {
  this.active = false;
};

PanTool.fn.mMove = function(x, y) {
  if (this.active) {
    var dx = x - this.x0;
    var dy = y - this.y0;

    // Panning the image
    this.parent.cHelper.doPan(dx, dy);
    this.x0 = x;
    this.y0 = y;
  }
};


// Annotation tool class definition //
// This accepts user input to generate a *new* Annotation

function AnnTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
  this.ann = null;
}
AnnTool.prototype = Object.create(SuperTool.prototype);
AnnTool.fn = AnnTool.prototype;

// Mouse up - add a point to the annotation
AnnTool.fn.lbUp = function(x, y) {
  var a = this.parent;

  // Create annotation if we're not already making
  // one
  if (!this.active) {
    this.active = true;
    this.ann = a.annHelper.newAnn();
  }

  var offset = a.canvas.offset();
  x -= offset.left;
  y -= offset.top;
  var pt = ptToImg(a.cHelper, x, y);

  this.active = this.ann.addPt(pt);
  a.updateControls();
};

// Double click - finish a polygon annotation
// TODO!
AnnTool.fn.lbDbl = function(x, y) {
  // if (this.active) {
  //   var a = this.parent;
  //   this.active = false;

  //   a.annHelper.endAnn();
  //   a.updateControls();
  // }
};

// Mouse move - update last point
AnnTool.fn.mMove = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();
    x -= offset.left;
    y -= offset.top;
    var pt = ptToImg(a.cHelper, x, y);

    this.ann.modLastPt(pt);
    a.cHelper.repaint();
  }
};


/*jshint unused:true*/
