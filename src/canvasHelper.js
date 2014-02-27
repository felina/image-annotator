// Canvas helper class definition //

(function( $ ) {

  // Creates a new CanvasHelper
  function CanvasHelper(parent, canvas) {
    this.parent = parent;

    // Drawing
    this.canvas = canvas;
    this.g = canvas[0].getContext("2d");

    // Dim
    this.w = canvas.width();
    this.h = canvas.height();

    // Transform info
    this.curScale = 0.9;
    this.xOffs = 0;
    this.yOffs = 0
  }
  CanvasHelper.fn = CanvasHelper.prototype;

  // Canvas re-draw op
  CanvasHelper.fn.repaint = function() {
    var g = this.g;

    // Reset xform & clear
    g.setTransform(1,0,0,1,0,0);
    g.clearRect(0, 0, this.w, this.h);

    // To draw in position with scaling,
    // move to position (translate), then
    // scale before drawing at (0, 0)
    g.translate(this.w/2 + this.xOffs, this.h/2 + this.yOffs);
    g.scale(this.curScale, this.curScale);

    // Drop shadow
    g.shadowColor = "#555";
    g.shadowBlur = 40;

    // Draw the image
    g.drawImage(this.img[0], -this.w/2, -this.h/2);

    // Annotation
    for (var f = 0; f < this.ftrs.length; f++) {
      var ftr = this.ftrs[f];
      for (var i = 0; i < ftr.atts.length; i++) {
        this.drawAtt(ftr.atts[i], f);
      }
    }
  };

  // Annotation draw op
  CanvasHelper.fn.drawAtt = function(att, fInd) {
    var g = this.g;

    var cols = 
    [
      "rgb(255, 20, 20)",
      "rgb(0, 200, 0)",
      "rgb(00, 0, 255)",
      "rgb(255, 255, 0)",
      "rgb(50, 200, 200)"
    ];

    if (!att.valid) {
      return;
    }

    var col = cols[fInd % cols.length];
    var fillCol = col;

    if (att === this.parent.att) {
      fillCol = "white";
    }

    g.shadowColor = "#000";
    g.shadowBlur = 3;
    g.strokeStyle = col;
    g.lineWidth = 1.5 / this.curScale;
    g.fillStyle = fillCol;

    // Box drawing (2-point)
    if (att.type === "rect") {
      var x0 = att.pts[0].x;
      var y0 = att.pts[0].y;
      var x1 = att.pts[1].x;
      var y1 = att.pts[1].y;

      var dx = Math.abs(x1-x0);
      var dy = Math.abs(y1-y0);
      var x = Math.min(x0, x1);
      var y = Math.min(y0, y1);

      g.strokeRect(x, y, dx, dy);

      this.drawPt({x:x0, y:y0});
      this.drawPt({x:x0, y:y1});
      this.drawPt({x:x1, y:y0});
      this.drawPt({x:x1, y:y1});
    }
    // Polygon drawing (n-point)
    else if (att.type === "poly") {
      g.beginPath();
      g.moveTo(att.pts[0].x, att.pts[0].y);

      for (var i = 1; i < att.pts.length; i++) {
        g.lineTo(att.pts[i].x, att.pts[i].y);
      }

      g.lineTo(att.pts[0].x, att.pts[0].y);
      g.stroke();

      for (i = 0; i < att.pts.length; i++) {
        this.drawPt(att.pts[i]);
      }
    }
  };

  // Point drawing util
  CanvasHelper.fn.drawPt = function(pt) {
    var g = this.g;
    g.beginPath();
    g.arc(pt.x, pt.y, 3/this.curScale, 0, 2*Math.PI, false);
    g.fill();
  };

  // Pan op
  CanvasHelper.fn.doPan = function(x, y) {
    // New offset
    this.xOffs += x;
    this.yOffs += y;

    var xLim = (this.w/2)*this.curScale;
    var yLim = (this.h/2)*this.curScale;

    if (this.xOffs >  xLim) {this.xOffs =  xLim;}
    if (this.xOffs < -xLim) {this.xOffs = -xLim;}
    if (this.yOffs >  yLim) {this.yOffs =  yLim;}
    if (this.yOffs < -yLim) {this.yOffs = -yLim;}

    this.repaint();
  };

  // Zoom op
  CanvasHelper.fn.zoom = function(scale) {
    // New scaling level
    this.curScale *= scale;

    if (this.curScale < 0.9) {
      this.curScale = 0.9;
    }

    this.repaint();
  };

}(jQuery));
