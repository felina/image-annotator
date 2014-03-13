// Util.js: Functions and small classes helpful elsewhere //

// Canvas to image space
function ptToImg(a, xin, yin) {
  var x = (xin-a.w/2-a.xOffs)/a.curScale;
  var y = (yin-a.h/2-a.yOffs)/a.curScale;

  if (x < -a.imgW/2) {x = -a.imgW/2;}
  if (x >  a.imgW/2) {x =  a.imgW/2;}
  if (y < -a.imgH/2) {y = -a.imgH/2;}
  if (y >  a.imgH/2) {y =  a.imgH/2;}

  var out = {x:x,y:y};

  return out;
}

// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.atts = [];
  this.attC = 0;
}

// Annotations - as distinct on the canvas
function Annotation(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];
  this.type = type;
}

Annotation.prototype.reset = function(type) {
  this.valid = false;
  this.pts = [{x:0,y:0}, {x:0,y:0}];

  if (type != null) {
    this.type = type;
  }
};