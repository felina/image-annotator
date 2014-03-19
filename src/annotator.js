// Annotator class definition //

var containercss = {
  position : "relative",
  overflow : "hidden"
};

var canvascss = {
  position : "absolute",
  left : 0,
  top : 0,
  "z-index" : 100,
  cursor : "move"
};

// Creates a new annotator (to be bound to a DOM object)
function Annotator(img, w, h) {
  // Parameters
  this.img = img;
  this.w = w;
  this.h = h;
  this.imgW = img ? img[0].width : w;
  this.imgH = img ? img[0].height : h;

  // Controls
  this.zoomin = null;
  this.zoomout = null;
  this.pan = null;
  this.annotate = null;
  this.attType = null;
  this.nextAtt = null;
  this.prevAtt = null;
  this.delAtt = null;

  this.nextFtr = null;
  this.prevFtr = null;

  this.title = null;

  // Components
  this.parent = null;
  this.container = null;
  this.canvas = null;

  // Tools
  this.curTool = new PanTool(this);

  // Annotations
  this.attHelper = new AttHelper(this);

  // Canvas ops
  this.cHelper = null;
}
Annotator.fn = Annotator.prototype;


//////////////////////////////////////////////////////
// Data import / export

// Apply feature data import
Annotator.fn.featuresIn = function(data) {
  if (typeof data.features === 'undefined') {
    return; // No input provided
  }

  this.attHelper.importFeatures(data.features);
  this.showChange();
};

// Apply annotation data import
Annotator.fn.attsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    return; // No input provided
  }

  this.attHelper.importAtts(data.annotations);
  this.showChange();
};

// Apply css styling
Annotator.fn.cssIn = function(data) {
  if (typeof data.style === 'undefined') {
    return; // No input provided
  }

  var style = data.style;
  var btns  = this.parent.find('button');

  if (typeof style.classes !== 'undefined') {
    btns.addClass(style.classes);
  }

  if (typeof style.css !== 'undefined') {
    btns.css(style.css);
  }
};

// Annotation export
Annotator.fn.getExport = function() {
  return this.attHelper.exportAtts();
};

// Feature retrieval
Annotator.fn.getFeatures = function() {
  return this.attHelper.ftrs;
};

//////////////////////////////////////////////////////
// Update / build functionality

// Updates an existing annotator with a new image
// (Also resets the pan/zoom and annotations)
Annotator.fn.update = function(img, w, h) {
  if (this.img !== img) {
    var a = this;
    this.img = img;

    if (this.img !== null) {
      this.img.load(function(){
        a.cHelper.imgLoaded(a.img);
      });
    }
  }
  this.w = w;
  this.h = h;

  // Reloading & resizing
  this.container.width(w).height(h);

  // Reset pan/zoom
  this.cHelper.reset(w, h);

  // Reset annotations
  this.attHelper.reset();
};

// Instantiates an annotator inside a DOM object
Annotator.fn.build = function($parent) {
  // Register and generate annotator components
  $parent.addClass("annotator");
  $parent.data("Annotator", this);

  // Controls
  this.zoomin    = $('<button id="zoomin">+</button>').appendTo($parent);
  this.zoomout   = $('<button id="zoomout">-</button>').appendTo($parent);
  this.pan       = $('<button id="pan">Pan</button>').appendTo($parent);
  this.annotate  = $('<button id="annot">Annotate</button>').appendTo($parent)
                    .css("margin-right", "20px");

  this.prevFtr   = $('<button id="prevFtr">&lt&lt</button>').appendTo($parent);
  this.prevAtt   = $('<button id="prevAtt">&lt</button>').appendTo($parent);

  this.attType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option>')
                      .appendTo($parent);

  this.delAtt    = $('<button id="nextAtt">X</button>').appendTo($parent);
  this.nextAtt   = $('<button id="nextAtt">&gt</button>').appendTo($parent);
  this.nextFtr   = $('<button id="nextAtt">&gt&gt</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.title     = $('<label>Annotating:</label>').appendTo($parent)
                      .css("font-family", "sans-serif")
                      .css("font-size", "12px");

  // Canvas container
  this.container = $('<div></div>')
                      .css(containercss)
                      .width(this.w)
                      .height(this.h)
                      .appendTo($parent);

  // The drawing canvas
  this.canvas = $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo(this.container);
  this.canvas[0].onselectstart = function(){return false;};

  // Generate the canvas helper
  this.cHelper = new CanvasHelper(this);

  var a = this; // loss of context when defining callbacks

  // Zoom control
  this.zoomin.click(function(){a.cHelper.zoom(1.25);});
  this.zoomout.click(function(){a.cHelper.zoom(0.8);});

  // Switching annotation modes
  this.attType.change(function() {
    var str = $(this).val();

    if (str === "Box") {
      a.attHelper.changeType("rect");
      a.switchOp("annotate");
    }
    else if (str === "Polygon") {
      a.attHelper.changeType("poly");
      a.switchOp("annotate");
    }
  });

  // Operation selection
  this.pan.click(function(){ a.switchOp("pan"); });
  this.annotate.click(function(){ a.switchOp("annotate"); });

  // Annotation deletion
  this.delAtt.click(function() {
    a.attHelper.delAtt();
    a.updateControls();
    a.cHelper.repaint();
  });

  // Annotations - next/prev
  this.prevAtt.click(function() { a.attHelper.prevAtt(); });
  this.nextAtt.click(function() { a.attHelper.nextAtt(); });

  // Features next/prev
  this.prevFtr.click(function() { a.attHelper.prevFtr(); });
  this.nextFtr.click(function() { a.attHelper.nextFtr(); });

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ a.curTool.lbDown(e.pageX, e.pageY); });
  this.canvas.mousemove(function(e){ a.curTool.mMove(e.pageX, e.pageY); });
  this.canvas.mouseup(function(e){ a.curTool.lbUp(e.pageX, e.pageY); });

  this.canvas.dblclick(function(e){
    a.curTool.lbDbl(e.pageX, e.pageY);
    e.preventDefault();
    return false;
  });

  // We have to wait for the image to load before we can use it
  if (this.img !== null) {
    this.img.load(function(){
      a.cHelper.imgLoaded(a.img);
    });
  }
};


//////////////////////////////////////////////////////
// Annotation UI

Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
  this.updateTitle();
};

Annotator.fn.lockSelect = function(type, lock) {
  this.attType.prop('disabled', lock);

  if (lock) {
    if (type === "rect") {
      this.attType.val('Box');
    }
    else {
      this.attType.val('Polygon');
    }
  }
};

Annotator.fn.updateControls = function() {
  var ath = this.attHelper;
  this.prevFtr.prop('disabled', ath.fInd === 0);
  this.nextFtr.prop('disabled', ath.fInd === ath.ftrs.length - 1);

  this.prevAtt.prop('disabled', ath.aInd === 0);

  // Logic for enabling the 'next attribute' button
  var ind = ath.atts.indexOf(ath.getAtt())+1;
  var nextValid = false;

  if (ind < ath.atts.length) {
    nextValid = ath.atts[ind].valid;
  }

  this.nextAtt.prop('disabled', !ath.getAtt().valid && !nextValid);
  this.delAtt.prop('disabled', !ath.getAtt().valid);
};

Annotator.fn.updateTitle = function() {
  var name = this.attHelper.getFtr().name;
  var ind  = this.attHelper.fInd;
  var len  = this.attHelper.ftrs.length;
  this.title.text("Annotating: " + name + " (" + (ind+1) + "/" + len + ")");
};

//////////////////////////////////////////////////////
// Tool switching

Annotator.fn.switchOp = function(op) {
  if (op === "annotate") {
    this.curTool = new AttTool(this);
    this.canvas.css("cursor", "crosshair");
  }
  else if (op === "pan") {
    this.curTool = new PanTool(this);
    this.canvas.css("cursor", "move");
  }
};
