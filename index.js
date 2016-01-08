//require("babel-core/register");
//require("babel-polyfill");

//Check if babel has been included...

//If not then include our version to allow polyfill on source files.

var serverLibrary = require( "./es6web-es5/start.js" );
module.exports = {
  init : serverLibrary.init
};

//Compile
//./node_modules/.bin/babel --presets es2015,stage-0 -d lib/ src/
