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

function AttTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}
AttTool.prototype = Object.create(SuperTool.prototype);
AttTool.fn = AttTool.prototype;

// Mouse down - start an annotation if we're not already making one
AttTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();

    this.x1 = this.x0 = x - offset.left;
    this.y1 = this.y0 = y - offset.top;

    var pt = ptToImg(a.cHelper, this.x0, this.y0);
    a.attHelper.startAtt(pt);

    this.active = true;
  }
};

// Mouse up - add a point to the annotation
AttTool.fn.lbUp = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var pt = ptToImg(a.cHelper, this.x1, this.y1);
    this.active = a.attHelper.nextPt(pt);
    a.updateControls();
  }
};

// Double click - finish a polygon annotation
AttTool.fn.lbDbl = function(x, y) {
  if (this.active) {
    var a = this.parent;
    this.active = false;

    a.attHelper.endAtt();
    a.updateControls();
  }
};

// Mouse move - update current point
AttTool.fn.mMove = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();
    this.x1 = x - offset.left;
    this.y1 = y - offset.top;

    // Annotation - in image space
    var pt = ptToImg(a.cHelper, this.x1, this.y1);
    a.attHelper.showPt(pt);

    // Redraw
    a.cHelper.repaint();
  }
};


/*jshint unused:true*/
