// Annotation helper class definition //

// This deals with managing the annotation data,
// doing import/export etc

function AttHelper(parent) {
  this.parent = parent;

  // Features
  this.ftrs = [];
  this.fInd = 0;
  this.aInd = 0;

  // Annotations
  this.atts = [new Annotation("rect")];
  this.curType = "rect";

  // Drawing
  this.pInd = 0;
}
AttHelper.fn = AttHelper.prototype;

AttHelper.fn.getAtt = function() {
  return this.atts[this.aInd];
};

AttHelper.fn.getFtr = function() {
  return this.ftrs[this.fInd];
};

// Resets to default state
AttHelper.fn.reset = function() {
  // Reset annotation
  this.atts = [new Annotation(this.curType)];
  this.aInd = 0;

  // Reset features
  this.fInd = 0;
  this.ftrs = [];
};

//////////////////////////////////////////////////////
// Data import / export

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

  this.ftrChanged();
};

// Attribute import - Depends on previous feature import
AttHelper.fn.importAtts = function(atts) {
  // Iterate features
  for (var i = 0; i < this.ftrs.length; i++) {
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

  // Recapture current feature/annotation
  this.atts = this.getFtr().atts;
  this.parent.showChange();
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


//////////////////////////////////////////////////////
// Feature selection

// Common to feature changes
AttHelper.fn.ftrChanged = function() {
  // Lock/unlock shape selection
  var lock = this.getFtr().shape !== "any";
  this.parent.lockSelect(this.getFtr().shape, lock);

  if (lock) {
    this.curType = this.getFtr().shape;
  }

  // Update annotations to match
  this.atts = this.getFtr().atts;
  this.aInd = 0;

  if (this.atts.length === 0) {
    this.atts.push(new Annotation(this.curType));
  }

  // Update UI
  this.parent.showChange();
};

// Select the next feature
AttHelper.fn.nextFtr = function() {
  this.fInd++;

  if (this.fInd >= this.ftrs.length) {
    this.fInd = this.ftrs.length - 1;
  }

  this.ftrChanged();
};

// Select the previous feature
AttHelper.fn.prevFtr = function() {
  this.fInd--;

  if (this.fInd < 0) {
    this.fInd = 0;
  }

  this.ftrChanged();
};


//////////////////////////////////////////////////////
// Annotation selection

// Invalidates the current annotation -
// it will be removed when the next switch
// occurs
AttHelper.fn.delAtt = function() {
  this.getAtt().reset();
};

// Select next annotation/start a new one
// Jumps to next att index, creates a new annotation
// if we hit the end of the list
AttHelper.fn.nextAtt = function() {
  this.aInd++;

  if (this.aInd === this.atts.length) {
    this.atts.push(new Annotation(this.curType));
  }

  this.clrInvalid();
  this.parent.showChange();
};

// Select previous annotation, if one exists
AttHelper.fn.prevAtt = function() {
  this.aInd--;

  if (this.aInd < 0) {
    this.aInd = 0;
  }

  this.clrInvalid();
  this.parent.showChange();
};


//////////////////////////////////////////////////////
// Annotation generation

AttHelper.fn.startAtt = function(pt) {
  this.getAtt().reset(this.curType);
  this.getAtt().valid = true;
  this.getAtt().pts[0] = pt;
  this.pInd = 1;
};

// Update the next point
AttHelper.fn.showPt = function(pt) {
  if (this.getAtt().type === "rect") {
    this.getAtt().pts[1] = pt;
  }
  else if (this.getAtt().type === "poly") {
    this.getAtt().pts[this.pInd] = pt;
  }
};

// Finalize the next point. Returns false
// if the drawing is complete.
AttHelper.fn.nextPt = function(pt) {
  var lastPt;

  if (this.getAtt().type === "rect") {
    lastPt = this.getAtt().pts[0];

    if (lastPt.x !== pt.x || lastPt.y !== pt.y) {
      this.getAtt().pts[1] = pt;
      return false;
    }
    else {
      return true;
    }
  }
  else if (this.getAtt().type === "poly") {
    lastPt = this.getAtt().pts[this.pInd-1];

    if (lastPt.x !== pt.x || lastPt.y !== pt.y) {
      this.getAtt().pts[this.pInd] = pt;
      this.pInd++;
    }

    return true;
  }

  return false;
};

// Ends an annotation - remove duplicate point
AttHelper.fn.endAtt = function() {
  if (this.getAtt().type === 'poly') {
    this.getAtt().pts.pop();
  }

  // Start next annotation
  
  this.nextAtt();
};

//////////////////////////////////////////////////////
// Misc functions

// Type selection
AttHelper.fn.changeType = function(type) {
  this.curType = type;
};

// Clears invalid annotations
AttHelper.fn.clrInvalid = function() {
  for (var i = 0; i < this.atts.length; i++) {
    if (i === this.aInd) {
      continue;
    }

    var att = this.atts[i];

    if (!att.valid) {
      this.atts.splice(i, 1);
      if (this.aInd > i) {
        this.aInd--;
      }
    }
  }
};
