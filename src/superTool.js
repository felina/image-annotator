/**
 * The parent class for tools (essentially user input handlers)<br/>
 * The default handlers all do nothing when called.
 * @constructor
 */
function SuperTool() {
  this.x0 = 0;
  this.x1 = 0;
  this.y0 = 0;
  this.y1 = 0;

  /** @type {Boolean} Indicates whether or not the tool is actively performing an operation */
  this.active = false;
}

SuperTool.fn = SuperTool.prototype;

/*jshint unused:vars*/

/**
 * Handler for left-click press
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbDown
 */
SuperTool.fn.lbDown   = function(x, y) {};

/**
 * Handler for left-click release
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbUp
 */
SuperTool.fn.lbUp     = function(x, y) {};

/**
 * Handler for left double-click
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method lbDbl
 */
SuperTool.fn.lbDbl    = function(x, y) {};

/**
 * Handler for right-click press
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method rbDown
 */
SuperTool.fn.rbDown   = function(x, y) {};

/**
 * Handler for right-click release
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method rbUp
 */
SuperTool.fn.rbUp     = function(x, y) {};

/**
 * Handler for mouse movement
 * @param  {Number} x
 * @param  {Number} y
 * @abstract
 * @memberOf SuperTool#
 * @method  mMove
 */
SuperTool.fn.mMove    = function(x, y) {};

/**
 * Handler for keyboard input
 * @param  {Number} key
 * @abstract
 * @memberOf SuperTool#
 * @method keyDown
 */
SuperTool.fn.keyDown  = function(key) {};

/**
 * Allows custom rendering to be performed by the tool, e.g. for extra information on-screen while in use.
 * Called by {@link CanvasHelper} on the current tool when the canvas is repainted.
 * @param  {GraphicsContext} g Graphics context handle.
 * @abstract
 * @memberOf SuperTool#
 * @method draw
 */
SuperTool.fn.draw     = function(g) {};

/*jshint unused:true*/

module.exports = SuperTool;