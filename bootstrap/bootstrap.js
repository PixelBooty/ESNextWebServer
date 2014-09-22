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
//Store pid
var fs = require( "fs" );
fs.writeFileSync( "process.pid", process.pid );

//Events
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

process.on('SIGINT', function() {
  console.log('Signal exit, closing.');
  fs.unlinkSync( "process.pid" );
  process.exit();
});

//Start app using traceur
traceur.require( "./start.es.js" );