var SuperTool = require('../superTool');

/**
 * The Edit tool handles user input to the canvas. It allows the user
 * to modify existing annotations by moving, adding or removing points.
 * @param {Annotator} parent The Annotator the tool will operate on
 * @constructor
 * @extends {SuperTool}
 */
function EditTool(parent) {
  SuperTool.call(this);
  this.parent = parent;

  /** @type {Boolean} Whether an edit operation can be started (depends on cursor position) */
  this.canEdit = false;
  /** @type {Boolean} Whether an edit operation is in progress */
  this.editing = false;
  /** @type {Number} Index of the point being edited */
  this.editPt = 0;
  /** @type {Object} Point to be displayed as a highlight on the canvas */
  this.hlt = null;
}

EditTool.prototype = Object.create(SuperTool.prototype);
EditTool.fn = EditTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for mouse movement, which either highlights nearby annotations/points or
 * continues an edit operation which is in progress by updating the editPt.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method  mMove
 */
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

/**
 * Handler for left-click press. This can select a new annotation to edit, 
 * a point on the current annotation to edit, or create a new point to edit.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method lbDown
 */
EditTool.fn.lbDown = function(x, y) {
  var anh = this.parent.annHelper;
  var c = this.parent.cHelper;

  var pt = c.ptToImg(x, y);
  var ann = anh.getAnn();

  // Run normal editing logic
  if (!this.canEdit) {
    // Make a new selection
    var pick = anh.pickLn(pt.x, pt.y);

    if (pick.dist < c.scaleDist(15)) {
      anh.setAnn(pick.ann);
      return;
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
    else if (ann.canInsPt()) {
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
  else if (this.editing) {
    // Finish point modification
    this.editing = false;
    return;
  }
};

/**
 * This performs the picking logic for highlighting
 * annotations or potential edit points for selection.
 * It is called by {@link EditTool#mMove} when an edit operation is not already in progress.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method passiveMove
 */
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

    // Only highlight edge if the shape allows it
    // Can always highlight points
    if (pick === pickln && !pick.ann.canInsPt()) {
      this.hlt = null;
    }
    else {
      this.hlt = pick.pt;
    }
  }
  else {
    this.canEdit = false;
    this.hlt = null;
  }

  if (pick.ann.type === 'point') {
    anh.aInd = anh.anns.indexOf(pick.ann);
    anh.curType = 'point';

    this.canEdit = true;

    if (pick === pickln && !pick.ann.canInsPt()) {
      this.hlt = null;
    }
    else {
      this.hlt = pick.pt;
    }
  }

  c.setHlt(pick.ann);
};

/**
 * Handler for right-click press, which deletes the highlighted point.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf EditTool#
 * @method rbDown
 */
EditTool.fn.rbDown = function(x, y) {
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

/**
 * Handler for keyboard input. The delete key removes the point currently being edited.
 * @param  {Number} key
 * @memberOf EditTool#
 * @method keyDown
 */
EditTool.fn.keyDown = function(key) {
  var anh = this.parent.annHelper;

  switch (key) {
    case 46: // Delete
      // Delete edit point if applicable
      if (this.editing) {
        anh.getAnn().delPt(this.editPt);
        this.editing = false;
      }
      // Otherwise the whole shape
      else {
        anh.delAnn();
      }

      this.parent.showChange();
      break;
  }
};

/**
 * Draws the current highlight point to the canvas - this is a point which can potentially
 * be selected, or a point which is being edited.
 * Called by {@link CanvasHelper} on the current tool when the canvas is repainted.
 * @param  {GraphicsContext} g Graphics context handle.
 * @memberOf EditTool#
 * @method draw
 */
EditTool.fn.draw = function(g) {
  if (this.hlt) {
    g.fillStyle = "white";
    this.parent.cHelper.drawPt(this.hlt);
  }
};


/*jshint unused:true*/

module.exports = EditTool;