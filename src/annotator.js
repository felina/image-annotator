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

  // Controls
  this.zoomin = null;
  this.zoomout = null;
  this.pan = null;
  this.annotate = null;
  this.edit = null;
  this.annType = null;
  this.delAnn = null;

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
  this.annHelper = new AnnHelper(this);

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

  this.annHelper.importFeatures(data.features);
  this.showChange();
};

// Apply annotation data import
Annotator.fn.annsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    return; // No input provided
  }

  this.annHelper.importAnns(data.annotations);
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
  return this.annHelper.exportAnns();
};

// Feature retrieval
Annotator.fn.getFeatures = function() {
  return this.annHelper.ftrs;
};

//////////////////////////////////////////////////////
// Update / build functionality

// Updates an existing annotator with a new image
// (Also resets the pan/zoom and annotations)
Annotator.fn.update = function(img, w, h) {
  var a = this;
  this.img = img;

  if (this.img !== null) {
    this.img.load(function(){
      a.cHelper.imgLoaded(a.img);
    });
  }
  
  this.w = w;
  this.h = h;

  // Reloading & resizing
  this.container.width(w).height(h);

  // Reset pan/zoom
  this.cHelper.reset(w, h);

  // Reset annotations
  this.annHelper.reset();
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
  this.annotate  = $('<button id="annot">Annotate</button>').appendTo($parent);
  this.edit      = $('<button id="edit">Edit</button>').appendTo($parent)
                      .css("margin-right", "20px");

  this.prevFtr   = $('<button id="prevFtr">&lt&lt</button>').appendTo($parent);
  this.annType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Polygon</option>')
                      .appendTo($parent);

  this.delAnn    = $('<button id="nextAnn">X</button>').appendTo($parent);
  this.nextFtr   = $('<button id="nextAnn">&gt&gt</button>').appendTo($parent)
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
  this.annType.change(function() {
    var str = $(this).val();

    if (str === "Box") {
      a.annHelper.changeType("rect");
      a.switchOp("annotate");
    }
    else if (str === "Polygon") {
      a.annHelper.changeType("poly");
      a.switchOp("annotate");
    }
  });

  // Operation selection
  this.pan.click(function(){ a.switchOp("pan"); });
  this.annotate.click(function(){ a.switchOp("annotate"); });
  this.edit.click(function(){ a.switchOp("edit"); });

  // Annotation deletion
  this.delAnn.click(function() {
    a.annHelper.delAnn();
    a.updateControls();
    a.cHelper.repaint();
  });

  // Features next/prev
  this.prevFtr.click(function() { a.annHelper.prevFtr(); });
  this.nextFtr.click(function() { a.annHelper.nextFtr(); });

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ 
    if (a.img) {
      a.curTool.lbDown(e.pageX, e.pageY);
    }
  });
  this.canvas.mousemove(function(e){ a.curTool.mMove(e.pageX, e.pageY); });
  this.canvas.mouseup(function(e){ a.curTool.lbUp(e.pageX, e.pageY); });

  this.canvas.dblclick(function(e){
    a.curTool.lbDbl(e.pageX, e.pageY);
    e.preventDefault();
    return false;
  });

  // Call the normal update
  this.update(this.img, this.w, this.h);
};


//////////////////////////////////////////////////////
// Annotation UI

// Shows a sate change in the canvas and UI elements
Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
  this.updateTitle();
};

// Select annotation type with lock/disable lock
Annotator.fn.lockSelect = function(type, lock) {
  if (!this.img) {
    this.annType.prop('disabled', true);
  }
  else {
    this.annType.prop('disabled', lock);

    if (lock) {
      if (type === "rect") {
        this.annType.val('Box');
      }
      else {
        this.annType.val('Polygon');
      }
    }
  }
};

Annotator.fn.updateControls = function() {
  var ath = this.annHelper;

  this.prevFtr.prop('disabled', ath.fInd === 0 || !this.img);
  this.nextFtr.prop('disabled', ath.fInd === ath.ftrs.length - 1 || !this.img);
  this.delAnn.prop('disabled', !ath.getAnn().valid || !this.img);

  this.zoomin.prop('disabled', !this.img);
  this.zoomout.prop('disabled', !this.img);
  this.pan.prop('disabled', !this.img);
  this.annotate.prop('disabled', !this.img);
};

Annotator.fn.updateTitle = function() {
  var name = this.annHelper.getFtr().name;
  var ind  = this.annHelper.fInd;
  var len  = this.annHelper.ftrs.length;
  this.title.text("Annotating: " + name + " (" + (ind+1) + "/" + len + ")");
};

//////////////////////////////////////////////////////
// Tool switching

// Switches between the main annotation tools:
// Annotation ('annotate')
// Panning ('pan')
Annotator.fn.switchOp = function(op) {
  switch (op) {
    case "annotate":
      this.curTool = new AnnTool(this);
      this.canvas.css("cursor", "crosshair");
      break;
    case "pan":
      this.curTool = new PanTool(this);
      this.canvas.css("cursor", "move");
      break;
    case "edit":
      this.curTool = new EditTool(this);
      this.canvas.css("cursor", "select");
      break;
  }
};
