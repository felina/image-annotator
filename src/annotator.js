// Other core components
var AnnHelper     = require('./annHelper');
var CanvasHelper  = require('./canvasHelper');

// Tools
var PanTool       = require('./tools/pan');
var AnnTool       = require('./tools/annotate');
var EditTool      = require('./tools/edit');

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

/**
 * Manages an annotator, which must be bound to a DOM object.
 * @param {Image} img Image to annotate. Can be null - a placeholder is displayed.
 * @param {Number} w Width of annotation area
 * @param {Number} h Height of annotation area
 * @constructor
 */
function Annotator(img, w, h) {
  // Parameters

  /** @type {Image} The image being annotated. */
  this.img = img;
  this.originalW = w;
  this.originalH = h;
  this.w = w;
  this.h = h;

  // Controls
  this.divRight = null;
  this.divLeft = null;
  this.zoomin = null;
  this.zoomout = null;
  this.pan = null;
  this.annotate = null;
  this.edit = null;
  this.annType = null;
  this.ftrSel = null;
  this.delAnn = null;
  this.tip = null;
  this.gofull = null;

  this.title = null;

  // Components
  this.parent = null;
  this.container = null;
  this.canvas = null;

  /** @type {SuperTool} The tool currently in use. */
  this.curTool = new PanTool(this);

  /** @type {AnnHelper} The attached annotation helper. */
  this.annHelper = new AnnHelper(this);

  /** @type {CanvasHelper} The attached canvas helper. */
  this.cHelper = null;
}
Annotator.fn = Annotator.prototype;


//////////////////////////////////////////////////////
// Data import / export

/**
 * Applies feature data import - calls {@link AnnHelper#importFeatures}.
 * @param  {Object} data
 * @memberOf Annotator#
 * @method   featuresIn
 */
Annotator.fn.featuresIn = function(data) {
  if (typeof data.features === 'undefined') {
    console.log('Not a valid object:', data);
    return; // No input provided
  }

  this.annHelper.importFeatures(data.features);
  this.showChange();
};

/**
 * Applies annotation data import - calls {@link AnnHelper#importAnns}.
 * @param  {Object} data
 * @memberOf Annotator#
 * @method   annsIn
 */
Annotator.fn.annsIn = function(data) {
  if (typeof data.annotations === 'undefined') {
    console.log('Not a valid object:', data);
    return; // No input provided
  }

  this.annHelper.importAnns(data.annotations);
  this.showChange();
};

/**
 * Applies css styling provided by the client application.
 * @param  {Css} data
 * @memberOf Annotator#
 * @method   cssin
 */
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

/**
 * Gets the annotation data describing the annotations the user has made.
 * @return {Object}
 * @memberOf Annotator#
 * @method   getExport
 */
Annotator.fn.getExport = function() {
  return this.annHelper.exportAnns();
};

/**
 * Gets the features being annotated.
 * @return {Object}
 * @memberOf Annotator#
 * @method   getFeatures
 */
Annotator.fn.getFeatures = function() {
  return this.annHelper.ftrs;
};

//////////////////////////////////////////////////////
// Full-screen

/**
 * Toggle full-screen mode.
 * @param    {Annotator} Reference to the annotator
 * @param    {Boolean} Clicked toggle-button
 * @memberOf Annotator#
 * @method   toggleFullscreen
 */
Annotator.fn.toggleFullscreen = function(annotator, clickedToggleButton) {
  console.log('toggleFullscreen', annotator);
  
  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    annotator.stopFullscreen(annotator, clickedToggleButton);
  } else {
    // Update dimensions
    annotator.w = screen.width;
    annotator.h = screen.height -
      $("#annotator-top-controls").height() -
      $("#annotator-bottom-controls").height() -
      parseInt($("body").css("margin-top").replace("px", "")) * 2 -
      parseInt($("body").css("margin-bottom").replace("px", "")) * 2;
    // Reloading & resizing
    annotator.container.width(annotator.w).height(annotator.h);
    // Reset pan/zoom
    annotator.cHelper.reset(annotator.w, annotator.h);
    annotator.showChange();

    element = $(".annotator")[0];
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }
};

/**
 * Stop full-screen mode.
 * @param    {Annotator} Reference to the annotator
 * @param    {Boolean} Clicked toggle-button
 * @memberOf Annotator#
 * @method   stopFullscreen
 */
Annotator.fn.stopFullscreen = function(annotator, clickedToggleButton) {
  console.log('stopFullscreen', annotator);

  // Update dimensions
  annotator.w = annotator.originalW;
  annotator.h = annotator.originalH;
  // Reloading & resizing
  annotator.container.width(annotator.w).height(annotator.h);
  // Reset pan/zoom
  annotator.cHelper.reset(annotator.w, annotator.h);
  annotator.showChange();

  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

//////////////////////////////////////////////////////
// Update / build functionality

/**
 * Updates an existing annotator with a new image.
 * This also resets the pan/zoom and annotations,
 * @param  {Image} img New Image to use
 * @param  {Number} w New width of annotator
 * @param  {Number} h New height of annotator
 * @memberOf Annotator#
 * @method   update
 */
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

/**
 * Instantiates an annotator inside a DOM object. This creates the annotation canvas and all the HTML controls, and sets up user interaction events for all components.
 * @param  {JQuery} $parent
 * @memberOf Annotator#
 * @method   build
 */
Annotator.fn.build = function($parent) {
  // Register and generate annotator components
  $parent.addClass("annotator");
  $parent.data("Annotator", this);

  var annotator = this;
  console.log("Annotator", this);

  // Top controls
  this.divTop   = $('<divid="annotator-top-controls"></div>').appendTo($parent).css("width", "100%");
  this.divRight  = $('<div></div>').appendTo(this.divTop).css("float", "right");
  this.divLeft   = $('<div></div>').appendTo(this.divTop);
  this.divClear   = $('<div></div>').appendTo(this.divTop).css("clear", "both");

  // Controls
  this.zoomin    = $('<button id="zoomin">+</button>').appendTo(this.divLeft);
  this.zoomout   = $('<button id="zoomout">-</button>').appendTo(this.divLeft);
  this.pan       = $('<button id="pan">Pan</button>').appendTo(this.divLeft)
                      .css("margin-right", "20px");

  this.annotate  = $('<button id="annot">Annotate</button>').appendTo(this.divLeft);
  this.annType   = $('<select id="typesel"></select>')
                      .html('<option>Box</option><option>Line</option><option>Point</option><option>Polygon</option>')
                      .appendTo(this.divLeft);
  this.edit      = $('<button id="edit">Edit</button>').appendTo(this.divLeft)
                      .css("margin-right", "20px");

  this.title     = $('<label>Annotating:</label>').appendTo(this.divLeft)
                      .css("margin-right", "10px")

  this.ftrSel    = $('<select id="ftrsel"></select>')
                      .html('<option>Image</option>')
                      .prop('disabled', true)
                      .appendTo(this.divLeft);

  this.tip       = $('<span>Tip: Double-click the last point to complete a line or a polygon.</span>')
                      .appendTo(this.divRight)
                      .addClass("text-muted");

  this.gofull    = $('<button id="toggle_fullscreen">Toggle fullscreen</button>')
                      .appendTo(this.divRight)
                      .css("margin-left", "10px")
                      .click(function () {
                        annotator.toggleFullscreen(annotator, true);
                      });

  if (document.addEventListener)
  {
      document.addEventListener('webkitfullscreenchange', exitHandler, false);
      document.addEventListener('mozfullscreenchange', exitHandler, false);
      document.addEventListener('fullscreenchange', exitHandler, false);
      document.addEventListener('MSFullscreenChange', exitHandler, false);
  }

  function exitHandler()
  {
      if (document.webkitIsFullScreen === false)
      {
          annotator.stopFullscreen(annotator, false);
      }
      else if (document.mozFullScreen === false)
      {
          annotator.stopFullscreen(annotator, false);
      }
      else if (document.msFullscreenElement === false)
      {
          annotator.stopFullscreen(annotator, false);
      }
  }

  // Canvas container
  this.container = $('<div tabindex=0></div>')
                      .css(containercss)
                      .width(this.w)
                      .height(this.h)
                      .appendTo($parent);

  // The drawing canvas
  this.canvas =    $('<canvas>Unsupported browser.</canvas>')
                      .css(canvascss)
                      .appendTo(this.container);

  // Bottom controls
  this.divBottom   = $('<div id="annotator-bottom-controls"></div>').appendTo($parent);
  this.delAnn    = $('<button id="nextAnn">Delete Annotation</button>').appendTo(this.divBottom);

  // Disable some of the normal page interaction in the canvas area
  this.canvas[0].onselectstart = function(){return false;};
  this.canvas[0].oncontextmenu = function(){return false;};

  // Generate the canvas helper
  this.cHelper = new CanvasHelper(this);

  var a = this; // loss of context when defining callbacks

  // Zoom control
  this.zoomin.click(function(){a.cHelper.zoom(1.25);});
  this.zoomout.click(function(){a.cHelper.zoom(0.8);});

  // Switching annotation modes
  this.annType.change(function() {
    var str = $(this).val();

    switch (str) {
      case "Box":
        a.annHelper.changeType("rect");
        a.switchOp("annotate");
        break;
      case "Polygon":
        a.annHelper.changeType("poly");
        a.switchOp("annotate");
        break;
      case "Line":
        a.annHelper.changeType("line");
        a.switchOp("annotate");
        break;
      case "Point":
        a.annHelper.changeType("point");
        a.switchOp("annotate");
        break;
    }
  });

  // Switching features
  this.ftrSel.change(function() {
    var str = $(this).val();
    var ftrs = a.annHelper.getFtrs();

    for (var f = 0; f < ftrs.length; f++) {
      var ftr = ftrs[f];

      if (str === ftr.fmtName()) {
        a.annHelper.setFtr(ftr);
        return;
      }
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

  // Mouse operations - call the tool handlers
  this.canvas.mousedown(function(e){ 
    if (a.img) {
      switch (e.which) {
        case 1:
          a.curTool.lbDown(e.pageX, e.pageY);
          break;
        case 3:
          e.preventDefault();
          a.curTool.rbDown(e.pageX, e.pageY);
          break;
      }
    }
  });

  this.canvas.mousemove(function(e){ a.curTool.mMove(e.pageX, e.pageY); });

  this.canvas.mouseup(function(e){
    if (a.img) {
      switch (e.which) {
        case 1:
          a.curTool.lbUp(e.pageX, e.pageY);
          break;
        case 3:
          e.preventDefault();
          a.curTool.rbUp(e.pageX, e.pageY);
          break;
      }
    }
  });

  this.canvas.dblclick(function(e){
    a.curTool.lbDbl(e.pageX, e.pageY);
    e.preventDefault();
    return false;
  });

  this.container.keydown(function(e) {
    if (a.img) {
      var key = e.keyCode;
      console.log("Key " + key);
      a.curTool.keyDown(key);
    }
  });

  // Call the normal update
  this.update(this.img, this.w, this.h);
};


//////////////////////////////////////////////////////
// Annotation UI

/**
 * Shows a state change in the canvas and UI elements.
 * @memberOf Annotator#
 * @method   showChange
 */
Annotator.fn.showChange = function() {
  this.cHelper.repaint();
  this.updateControls();
};

/**
 * Select annotation type to use with a lock, or disables the lock.
 * However, the "annotation type" control will stay disabled if the image is null.
 * @param  {String} type Type to switch to (with lock=false)
 * @param  {Boolean} lock Whether to lock the "annotation type" control
 * @memberOf Annotator#
 * @method   lockSelect
 */
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
      else if (type === "poly") {
        this.annType.val('Polygon');
      }
      else if (type === "line") {
        this.annType.val('Line');
      }
      else {
        this.annType.val('Point');
      }
    }
  }
};

/**
 * Selects a feature to display in the "selected feature" control.
 * @param  {Feature} ftr
 * @memberOf Annotator#
 * @method   dispFtr
 */
Annotator.fn.dispFtr = function(ftr) {
  this.ftrSel.val(ftr.fmtName());
};

/**
 * Show the feature list in the "selected feature" control.
 * @param  {Array.<Feature>} ftrs
 * @memberOf Annotator#
 * @method   updateFtrs
 */
Annotator.fn.updateFtrs = function(ftrs) {
  var options = "";
  this.ftrSel.prop('disabled', false);

  for (var f = 0; f < ftrs.length; f++) {
    var ftr = ftrs[f];
    options = options.concat("<option>" + ftr.fmtName() + "</option>");
  }

  this.ftrSel.empty().html(options);
};

/**
 * Updates the state of various controls, disabling or enabling them as appropriate to the Annotator's state.
 * @memberOf Annotator#
 * @method   updateControls
 */
Annotator.fn.updateControls = function() {
  var ath = this.annHelper;

  this.delAnn.prop('disabled', !ath.getAnn().valid || !this.img);
  this.zoomin.prop('disabled', !this.img);
  this.zoomout.prop('disabled', !this.img);
  this.pan.prop('disabled', !this.img);
  this.annotate.prop('disabled', !this.img);
  this.edit.prop('disabled', !this.img);
};

//////////////////////////////////////////////////////
// Tool switching

/**
 * Switches between the main annotation tools: 'annotate' for Annotation, 'pan' for Panning and 'edit' for Annotation Editing.
 * @param  {String} op
 * @memberOf Annotator#
 * @method   switchOp
 */
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

module.exports = Annotator;