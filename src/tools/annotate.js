var SuperTool = require('../superTool');

// Annotation tool class definition //
// This accepts user input to generate a *new* Annotation

function AnnTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
  this.ann = null;
}
AnnTool.prototype = Object.create(SuperTool.prototype);
AnnTool.fn = AnnTool.prototype;

/*jshint unused:vars*/

// Mouse up - add a point to the annotation
AnnTool.fn.lbUp = function(x, y) {
  var a = this.parent;

  // Create annotation if we're not already making
  // one
  if (!this.active) {
    this.active = true;
    this.ann = a.annHelper.newAnn();
  }

  var pt = a.cHelper.ptToImg(x, y);

  this.active = this.ann.addPt(pt);
  a.showChange();
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
    var c = this.parent.cHelper;
    var pt = c.ptToImg(x, y);

    this.ann.modLastPt(pt);
    c.repaint();
  }
};

AnnTool.fn.keyDown = function(key) {
  var anh = this.parent.annHelper;

  switch (key) {
    case 46: // Delete
      anh.getAnn().invalidate();
      this.active = false;
      this.parent.showChange();
      break;
    case 8: // Backspace
      if (this.active) {
        // Delete last placed point
        var pt = this.ann.getPts()[this.ann.getNumPts()-1];
        this.ann.delPt(-1);
        this.active = this.ann.isValid();

        if (this.active) {
          this.ann.modLastPt(pt);
        }

        this.parent.showChange();
      }
      break;
  }
};

/*jshint unused:true*/

module.exports = AnnTool;