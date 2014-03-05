// Annotation helper class definition //

// This deals with managing the annotation data,
// doing import/export etc

function AttHelper(parent) {
  this.parent = parent;

  // Features
  this.curFtr = null;
  this.ftrs = [];
  this.fInd = 0;
  this.aInd = 0;

  // Annotations
  this.curAtt = new Annotation("rect");
  this.atts = [this.curAtt];
  this.curType = "rect";
}
AttHelper.fn = AttHelper.prototype;

// Resets to default state
AttHelper.fn.reset = function() {
  // Reset annotation
  this.curAtt = new Annotation(this.curType);
  this.atts = [this.curAtt];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.curFtr = null;
  this.ftrs = [];
};

// Feature import
AttHelper.fn.addFtrData = function(ftr) {
    this.ftrs.push(new Feature(ftr.name, ftr.required, ftr.shape));
};

AttHelper.fn.importFeatures = function(input) {
  // Clear existing
  this.ftrs = [];

  for (var i = 0; i < input.length; i++) {
    this.addFtrData(input[i]);
  }
};

// Attribute import - Depends on previous feature import
AttHelper.fn.importAtts = function(atts) {
  // Iterate features
  for (var i = 0; i < a.ftrs.length; i++) {
    var f = this.ftrs[i];
    f.atts = [];

    if (typeof atts[f.name] === 'undefined') {
      continue; // Skip feature if there was no input attribute data
    }

    var input = atts[f.name];
    var shapes = input.shapes;

    for (var j = 0; j < shapes.length; j++) {
      var s = shapes[j];

      // Generate each annotation from input data
      var att = new Annotation(s.type);
      att.valid = true;

      if (s.type === 'rect') {
        att.pts[0] = s.pos;
        att.pts[1] = {x : s.pos.x+s.size.width, y : s.pos.y+s.size.height};
      }
      else {
        att.pts = s.points;
      }

      f.atts.push(att);
    }
  }
};

// Annotation export
AttHelper.fn.exportAtts = function() {
  // Empty output object
  var out = {};

  // Iterate the features
  for (var i = 0; i < this.ftrs.length; i++) {
    var f = this.ftrs[i];

    // Store shapes
    out[f.name] = {};
    out[f.name].shapes = [];

    // Iterate the annotatons for the feature
    for (var j = 0; j < f.atts.length; j++) {
      var att = f.atts[j];

      // Check it's a valid shape
      if (typeof att === 'undefined') {
        continue;
      }
      else if (!att.valid) {
        continue;
      }

      // The shape as it's output
      var s = {};
      s.type = att.type;

      if (s.type === 'rect') {
        var x0 = att.pts[0].x;
        var y0 = att.pts[0].y;
        var x1 = att.pts[1].x;
        var y1 = att.pts[1].y;

        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var x = Math.min(x0, x1);
        var y = Math.min(y0, y1);

        s.pos = {x : x, y : y};
        s.size = {width : dx, height : dy};
      }
      else {
        s.points = att.pts;
      }

      out[f.name].shapes.push(s);
    }
  }

  return out;
};

AttHelper.fn.changeType = function(type) {
  this.curType = type;
};

// Clears invalid annotations
AttHelper.fn.clrInvalid = function() {
  for (var i = 0; i < this.atts.length; i++) {
    var att = this.atts[i];
    if (!att.valid) {
      this.atts.splice(i, 1);
    }
  }
};

AttHelper.fn.nextFtr = function() {

};

AttHelper.fn.prevFtr = function() {

};

AttHelper.fn.delAtt = function() {
  this.curAtt.reset();
};

AttHelper.fn.nextAtt = function() {
  //var ind = a.atts.indexOf(a.att) + 1;
  //a.changeAtt(ind);
};

AttHelper.fn.prevAtt = function() {
  //var ind = a.atts.indexOf(a.att) - 1;
  //a.changeAtt(ind);
};