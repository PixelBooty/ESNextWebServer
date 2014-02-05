import { config } from "../config.es.js";
import { DynamicLoader } from "./library/DynamicLoader.es.js";

let httpServer = require("http");

export class WebServer{
  constructor() {
    this._loadedLibs = {};
    this._coreLibrary = null;
    
    process.__server = this;
    
    this._InitLibrary();
    httpServer.createServer( function ( request, response ){
      this._CompileRequest( request, response );
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end("hello world");
    }.bind( this ) ).listen(8088);
  }
  
  get coreLibrary(){
    return this._coreLibrary;
  }
  
  _InitLibrary(){
    this._coreLibrary = new DynamicLoader( __dirname + "/library" );
    
    await this._coreLibrary.AddLib( "HostManager", ( libObject ) => {
      libObject.clib = new libObject.lib( this );
    });
    /*await this._coreLibrary.AddLib( "ModualManager", function(){

    });
    await this._coreLibrary.AddLib( "Router" );
    await this._coreLibrary.AddLib( "ContentBuffer" );*/
    console.log( "Library initalized." );
  }
  
  get _router(){
    return this._coreLibrary.GetLib( "Router" ).lib;
  }
  
  get _hosts(){
    return this._coreLibrary.GetLib( "HostManager" ).clib;
  }
  
  get _contentBuffer(){
    return this._coreLibrary.GetLib( "ContentBuffer" ).lib;
  }
  
  get baseHost(){
    return this._coreLibrary.GetLib( "base/HostBase" ).lib;
  }
  
  _CompileRequest( request, response ){
    let host = this._hosts.GetHost( request );
    let router = new this._router( host, request );
    let moduals = new this._moduals( router );
    let contentBuffer = new this._contentBuffer( host, router, response );
  }
  
  
  
}