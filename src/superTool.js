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
SuperTool.fn.rbDown = function(x, y) {};
SuperTool.fn.rbUp   = function(x, y) {};
SuperTool.fn.mMove  = function(x, y) {};
SuperTool.fn.draw   = function(g) {};
/*jshint unused:true*/
