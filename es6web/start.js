let init = require( "dynamicjs" ).initialize( {
  systemLoader : null
});
let ServerLibrary = dynamic( './ServerLibrary.js' ).ServerLibrary;

module.exports = {
  init : ( config, services ) => {
    init.systemLoader = init.systemLoader || new ServerLibrary( config, services );

    return init.systemLoader;
  },
  scaffolding : () => {
    superDynamic( "./Scaffolding.js" );
  }
};
