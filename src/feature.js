// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.anns = [];
  this.annC = 0;
}
Feature.fn = Feature.prototype;

// Returns formatted name
Feature.fn.fmtName = function() {
  var first = this.name.charAt(0).toUpperCase();
  return first.concat(this.name.substr(1));
};
