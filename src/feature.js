/**
 * Describes a feature to be annotated.
 * @param {String} name
 * @param {Boolean} required
 * @param {String} shape Allowed type(s) of annotation. Can be "any".
 * @constructor
 */
function Feature(name, required, shape) {
  /** @type {String} The feature's name */
  this.name = name;
  /** @type {Boolean} Whether the feature is required (currently unused!) */
  this.req = required;
  /** @type {String} Allowed type(s) of annotation. Can be "any". */
  this.shape = shape;
  /** @type {Array.<SuperShape>} The stored annotations for the feature */
  this.anns = [];
  this.annC = 0;
}
Feature.fn = Feature.prototype;

/**
 * Returns a formatted name, with the first letter capitalized.
 * @return {String}
 * @memberOf Feature#
 * @method fmtName
 */
Feature.fn.fmtName = function() {
  var first = this.name.charAt(0).toUpperCase();
  return first.concat(this.name.substr(1));
};

module.exports = Feature;