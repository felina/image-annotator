// Pan tool class definition //

function PanTool(parent) {
  SuperTool.call(this);
  this.parent = parent;
}

PanTool.prototype = Object.create(SuperTool.prototype);
PanTool.fn = PanTool.prototype;

/*jshint unused:vars*/

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

/*jshint unused:true*/
