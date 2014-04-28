var SuperTool = require('../superTool');

/**
 * The Pan tool handles user input to the canvas. It allows the user
 * to pan their vew of the image and annotations.
 * @param {Annotator} parent The Annotator the tool will operate on
 * @constructor
 * @extends {SuperTool}
 */
function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}

PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for left-click press, which starts the pan operation.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method lbDown
 */
PanTool.fn.lbDown = function(x, y) {
  if (!this.active) {
    this.x0 = x;
    this.y0 = y;
    this.active = true;
  }
};

/**
 * Handler for left-click release, which ends the pan operation
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method lbUp
 */
PanTool.fn.lbUp = function(x, y) {
  this.active = false;
};

/**
 * Handler for mouse movement, which pans the canvas.
 * @param  {Number} x
 * @param  {Number} y
 * @memberOf PanTool#
 * @method  mMove
 */
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

/*jshint unused:true*/

module.exports = PanTool;