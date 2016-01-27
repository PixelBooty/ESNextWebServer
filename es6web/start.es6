import { ServerLibrary } from './ServerLibrary.es.js';

//let serverLibrary = new ServerLibrary();

module.exports = {
  init : ( config, services ) => {
    return new ServerLibrary( config, services );
  },
  scaffolding : () => {
    require( "./Scaffolding.es.js" );
  }
};
