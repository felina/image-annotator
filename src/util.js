var RectAnn = require('./shapes/rect');
var PolyAnn = require('./shapes/poly');

/**
 * Creates an annotation of the specified type.
 * Note: Use {@link AnnHelper#newAnn} to add new annotations, NOT this method.
 * @param  {String} type
 * @method
 */
module.exports.createAnnotation = function createAnnotation(type) {
  switch (type) {
    case 'rect':
      return new RectAnn();
    case 'poly':
      return new PolyAnn();
  }
};
