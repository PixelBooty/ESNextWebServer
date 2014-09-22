//Boot prototypes.
String.prototype.EndsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.StartsWith = function(suffix) {
  return this.indexOf(suffix) === 0;
};