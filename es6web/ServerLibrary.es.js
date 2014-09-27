import { DynamicLoader } from "./library/DynamicLoader.es.js";

require( "./ProtoTypes.js" );
let httpServer = require( "http" );

export class ServerLibrary{
  constructor() {
    this._serverLibrary = null;
    this._server = null;
    this._webServer = null;
    this._config = process.config;
    this._DefaultConfigs();
    this._InitWebServer();
    this._InitLibrary();
  }
  
  get library(){
    return this._serverLibrary;
  }

  _DefaultConfigs(){
    this._config.host = this._config.host || null;
    this._config.port = this._config.port || 8088;
    this._config.uid = this._config.uid || null;
    this._config.gid = this._config.gid || null;
  }

  _InitWebServer(){
    this._webServer = httpServer.createServer( );
    this._webServer.listen( this._config.port, this._config.host, null, () => {
      if( this._config.gid ){
        process.setgid( 1000 );
      }

      if( this._config.uid ){
        process.setuid( 1000 );
      }
    });
  }
  /**
   * Initalizes the library systems for the web server, and the attachs them to the dynamic loaders.
   */
  _InitLibrary(){
    this._serverLibrary = new DynamicLoader( __dirname + "/library/" );
    console.log( "Library initalized." );
    this._serverLibrary.AddLib(
      "WebServer",
      { serverLibrary : this._serverLibrary, config : this._config, webServer : this._webServer },
      "library",
      ( libObject ) => {
        this._server = libObject;
        console.log( "Server Loaded." );
      }
    );
    GLOBAL.wsinclude = function( objectLibPath ){
      return library.GetObject( objectLibPath );
    }
    GLOBAL.library = this._serverLibrary;
  }
  
}
