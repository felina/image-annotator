// Features to be annotated
function Feature(name, required, shape) {
  this.name = name;
  this.req = required;
  this.shape = shape;
  this.anns = [];
  this.annC = 0;
}
