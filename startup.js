// print process.argv
var fs = require( "fs" );
var serviceConfigPath = "config.json";
var config = JSON.parse( fs.readFileSync( serviceConfigPath ).toString() );
for( var configSetting in config ){
  process.config[configSetting] = config[configSetting];
}

//Events
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

process.on('SIGINT', function() {
  console.log('Signal exit, closing.');
  process.exit();
});

require( "./bootstrap.js" );