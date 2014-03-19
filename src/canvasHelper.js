// Canvas helper class definition //

// Creates a new CanvasHelper
function CanvasHelper(parent) {
  this.parent = parent;
  var w = parent.w;
  var h = parent.h;

  // Drawing
  this.canvas = parent.canvas;
  this.g = this.canvas[0].getContext("2d");

  // Dim
  this.canvas[0].width = w;
  this.canvas[0].height = h;
  this.w = w;
  this.h = h;
  this.imgW = 0;
  this.imgH = 0;

  // Transform info
  this.defScale = 1.0; // TODO: Correct for size
  this.curScale = this.defScale;
  this.xOffs = 0;
  this.yOffs = 0;
}

CanvasHelper.fn = CanvasHelper.prototype;

// Canvas re-draw op
CanvasHelper.fn.repaint = function() {
  var g = this.g;
  var ftrs = this.parent.getFeatures();

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
  g.shadowBlur = 20;

  // Draw the image
  if (this.parent.img !== null) {
    g.drawImage(this.parent.img[0], -this.imgW/2, -this.imgH/2);
  }
  else {
    g.fillStyle = "rgb(220, 220, 220)";
    g.fillRect(-this.w/2, -this.h/2, this.w, this.h);

    g.shadowBlur = 0;
    g.fillStyle = "white";
    g.font = "22px sans-serif";
    g.fillText("No Image", -40, -8);
  }

  // Annotation
  for (var f = 0; f < ftrs.length; f++) {
    var ftr = ftrs[f];
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

  if (att === this.parent.attHelper.getAtt()) {
    fillCol = "white";
  }

  g.shadowColor = "#000";
  g.shadowBlur = 1;
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

  var xLim = (this.imgW/2)*this.curScale;
  var yLim = (this.imgH/2)*this.curScale;

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

  if (this.curScale < this.defScale) {
    this.curScale = this.defScale;
  }

  this.repaint();
};

// Resizing and resetting pan/zoom
CanvasHelper.fn.reset = function(w, h) {
  this.canvas[0].width = w;
  this.canvas[0].height = h;
  this.w = w;
  this.h = h;

  this.imgW = parent.imgW;
  this.imgH = parent.imgH;

  this.xOffs = 0;
  this.yOffs = 0;
  this.curScale = this.defScale;
};

// Called when the image finishes loading
CanvasHelper.fn.imgLoaded = function(img) {
  // Grab the image dimensions. These are only available
  // once the image is fully loaded
  this.imgW = img[0].width;
  this.imgH = img[0].height;

  // We can use the dimensions and the available canvas
  // area to work out a good zoom level
  var xRatio = this.w / this.imgW;
  var yRatio = this.h / this.imgH;
  var absRatio = Math.min(xRatio, yRatio);

  this.defScale = absRatio * 0.9;
  this.curScale = this.defScale;

  this.repaint();
};
