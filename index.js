(function( $ ) {
  $.fn.annotator = function(src) {
    return this.each(function() {
      var $zoomin = $('<button>Zoom In</button>');
      var $zoomout = $('<button>Zoom Out</button>');
      var $img = $('<img class="iggy" src="'+src+'"></img>');
      var $container = $('<div class="container"></div>');
      $(this).append($zoomin);
      $(this).append('<br></br>');
      $(this).append($zoomout);
      $(this).append($container);
      $container.append($img);
      $img.draggable();
      var originalHeight = $img.height();
      $zoomin.on("click", function (){
        console.log("zoomin"); zoom($img, originalHeight, 1.25);
      });
      $zoomout.on("click", function(){
        console.log("zoomout"); zoom($img, originalHeight, 0.8);
      });
    });
  };
}( jQuery ));

var zoom = function($img, originalHeight, adjustment){
  var offset = $img.offset();
  var width = $img.width();
  var height = $img.height();
  
  if(adjustment < 1 && originalHeight >= height)
      return;
  
  var newWidth = width * adjustment;
  var newHeight = height * adjustment;
  
  var diffWidth = newWidth - width;
  var diffHeight = newHeight - height;
  
  var hcenter = $('body').width() / 2;
  var vcenter = $('body').height() / 2;
  
  var leftPercent = (hcenter - offset.left) / width;
  var topPercent = (vcenter - offset.top) / height;

  $img.offset({top: offset.top - (diffHeight * topPercent), left: offset.left - (diffWidth * leftPercent)});

  $img.width(newWidth).height(newHeight);
};




  // function insertImage(a,src){
  //   $('#'+a).append('<a id="zoomin" href="#">Zoom In</a>');
  //   $('#'+a).append('<a id="zoomout" href="#">Zoom Out</a>');
  //   $('#'+a).append('<div id="container"><img id="iggy" src="'+src+'"></img></div>');
  // }
  // $("img").draggable();
  // var $container = $("#container");
  // var $img = $("#iggy");
  // console.log(originalHeight);
// $(document).ready(function(){
//   var $image;
//   $('#insert').on("click", function(){
//     insertImage("img","http://www.emperor-penguin.com/penguin-chick.jpg");
//     $("img").draggable();
//     $img = $("#iggy");
//   });
//   $("#zoomin").on("click", function (){console.log("zoomin"); zoom(1.25)});
//   $("#zoomout").on("click", function(){console.log("zoomin"); zoom(0.8)});

// });