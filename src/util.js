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
  this.anns = [];
  this.annC = 0;
}
