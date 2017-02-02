require( "./ProtoTypes.js" );
let WebServer = dynamic( "./library/WebServer.js" ).WebServer;
let path = require( "path" );

exports.ServerLibrary = class ServerLibrary extends Object{
  constructor( config, services ) {
    super();
    this._services = services;
    this._config = config;
    this._DefaultConfigs();
    this._server = this._server || this._InitServer();
  }

  get library(){
    return this._serverLibrary;
  }

  _DefaultConfigs(){
    this._config.host = this._config.host || null;
    this._config.port = this._config.port || 8088;
    this._config.uid = this._config.uid || null;
    this._config.gid = this._config.gid || null;

    global.wsinclude = function( objectLibPath, returnObject = true ){
      let caller = dynamicCaller();
      let libPath = path.normalize( path.dirname( __filename ) + "/library/" + objectLibPath + ".js" );
      if( returnObject ){
        let libName = objectLibPath.split( "/" )[objectLibPath.split( "/" ).length - 1];
        return superDynamic( libPath, caller )[libName];
      }

      return superDynamic( libPath, caller );
    }
  }

  /**
   * Initalizes the library systems for the web server, and the attachs them to the dynamic loaders.
   */
  _InitServer(){
    return new WebServer( this._config, this._services );
  }

}
