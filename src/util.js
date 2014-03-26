var RectAnn = require('./shapes/rect');
var PolyAnn = require('./shapes/poly');

// Annotations - as distinct on the canvas
module.exports.createAnnotation = function createAnnotation(type) {
  switch (type) {
    case 'rect':
      return new RectAnn();
    case 'poly':
      return new PolyAnn();
  }
};
