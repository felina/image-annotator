var SuperTool = require('../superTool');

// Edit tool class definition //
// This allows selection and modification of existing annotations

function EditTool(parent) {
  SuperTool.call(this);
  this.parent = parent;

  this.canEdit = false;

  this.editing = false;
  this.editPt = 0;

  this.hlt = null;
}

EditTool.prototype = Object.create(SuperTool.prototype);
EditTool.fn = EditTool.prototype;

/*jshint unused:vars*/

EditTool.fn.mMove = function(x, y) {
  var a = this.parent;
  var c = a.cHelper;

  var pt = c.ptToImg(x, y);

  if (!this.editing) {
    this.passiveMove(pt.x, pt.y);
    a.showChange();
  }
  else {
    // Point editing
    var ann = a.annHelper.getAnn();
    ann.modPt(this.editPt, pt);
    this.hlt = pt;
    a.showChange();
  }
};

EditTool.fn.lbUp = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  if (!this.canEdit) {
    // Make a new selection
    var pick = anh.pickLn(pt.x, pt.y);

    if (pick.dist < c.scaleDist(15)) {
      anh.setAnn(pick.ann);
    }
  }
  else if (!this.editing) {
    // Point modifications
    var pickpt = anh.pickPt(pt.x, pt.y);

    if (pickpt.ann === ann && pickpt.dist < c.scaleDist(15)) {
      // Editing point
      this.editPt = pickpt.ind;
      this.editing = true;
      return;
    }

    // New points
    if (ann.canInsPt()) {
      var pickln = anh.pickLn(pt.x, pt.y);

      if (pickln.ann === ann && pickln.dist < c.scaleDist(15)) {
        // Editing *new* point - create it
        ann.insPt(pickln.i1, pt);
        this.editPt = pickln.i1;
        this.editing = true;
        return;
      }
    }
  }
  else {
    // Finish point modification
    this.editing = false;
  }
};

// Highlight annotations under the cursor
EditTool.fn.passiveMove = function(x, y) {
  var c = this.parent.cHelper;
  var anh = this.parent.annHelper;

  var pickpt = anh.pickPt(x, y);
  var pickln = anh.pickLn(x, y);
  var pick = null;

  // Compare line and point distances
  if (pickpt.dist < c.scaleDist(15)) {
    pick = pickpt;
  }
  else if (pickln.dist < c.scaleDist(15)) {
    pick = pickln;
  }
  else {
    this.canEdit = false;
    this.hlt = null;
    c.setHlt(null);
    return;
  }

  // At this point we know the distance is in range
  if (pick.ann === anh.getAnn()) {
    this.canEdit = true;
    this.hlt = pick.pt;
  }
  else {
    this.canEdit = false;
    this.hlt = null;
  }

  c.setHlt(pick.ann);
};

// Point deletion (right click)
EditTool.fn.rbUp = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  if (this.canEdit && !this.editing) {
    // Point deletion
    var pickpt = anh.pickPt(pt.x, pt.y);

    if (pickpt.ann === ann && pickpt.dist < c.scaleDist(15)) {
      // Editing point
      ann.delPt(pickpt.ind);
      return;
    }
  }
};

// Draw point to change/create
EditTool.fn.draw = function(g) {
  if (this.hlt) {
    g.fillStyle = "white";
    this.parent.cHelper.drawPt(this.hlt);
  }
};

/*jshint unused:true*/

module.exports = EditTool;