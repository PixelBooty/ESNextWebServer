/**
 * Enable traceur compile for ECMA 6 script syntax.
 * This is only needed until ecma 6 becomes standard.
 */
var traceur = require( "traceur" );
traceur.require.makeDefault(function(filename) {
  // Change this to something more meaningful.
  return filename.endsWith('.es.js');
});
traceur.options.experimental = true;
traceur.options.blockBinding = true;
traceur.options.strictSemicolons = true;
traceur.options.privateNameSyntax = true;
traceur.options.privateNames = true;

/**
 * Require the server.js which will run the application.
 */

//Start app using traceur
traceur.require( "./start.es.js" );