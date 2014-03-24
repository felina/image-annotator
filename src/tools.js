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
  var pt = a.cHelper.ptToImg(x, y);

  this.active = this.ann.addPt(pt);
  a.updateControls();
};

// Double click - finish a polygon annotation
AnnTool.fn.lbDbl = function(x, y) {
  // NB: We get 2x 'up' events before the double-click
  // Need to remove erroneous extra points
  if (this.active) {
    var a = this.parent;
    this.active = false;

    this.ann.delPt(-1); // Remove pt from second click
    this.ann.delPt(-1); // Remove intermediate pt (would be next placed)

    a.showChange();
  }
};

// Mouse move - update last point
AnnTool.fn.mMove = function(x, y) {
  if (this.active) {
    var a = this.parent;
    var offset = a.canvas.offset();
    x -= offset.left;
    y -= offset.top;
    var pt = a.cHelper.ptToImg(x, y);

    this.ann.modLastPt(pt);
    a.cHelper.repaint();
  }
};



// Edit tool class definition //
// This allows selection and modification of existing annotations

function EditTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
  this.ann = null;
}
EditTool.prototype = Object.create(SuperTool.prototype);
EditTool.fn = EditTool.prototype;

EditTool.fn.mMove = function(x, y) {
  var a = this.parent;
  var offset = a.canvas.offset();
  x -= offset.left;
  y -= offset.top;
  var pt = this.parent.cHelper.ptToImg(x, y);

  if (this.ann === null) {
    this.passiveMove(pt.x, pt.y);
    a.showChange();
  }
  // TODO: Active move code (for modifications)
};

// Highlight annotations under the cursor
EditTool.fn.passiveMove = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pickpt = anh.pickPt(x, y);
  var pickln = anh.pickLn(x, y);
  var pick;

  // Compare line and point distances
  // NB could combine in line function...?
  if (pickpt.dist < pickln.dist) {
    pick = pickpt;
  }
  else {
    pick = pickln;
  }

  if (pick.dist < 15) {
    c.setHlt(pick.ann);
  }
  else {
    c.setHlt(null);
  }
};

/*jshint unused:true*/
