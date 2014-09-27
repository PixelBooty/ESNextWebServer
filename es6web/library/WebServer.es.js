/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let qs = require('querystring');
let qs = require('querystring');
let multiparty = require( 'multiparty' );

export class WebServer{
  constructor( settings ) {
    this._serverLibrary = settings.serverLibrary;
    this._webServer = settings.webServer;
    this._config = settings.config;
    this._hosts = null;
    process.__server = this;
    this._StartServer();
  }
  
  _StartServer(){
    this._webServer.on( "request",  this._CompileRequest.bind( this ) );
    
    let serviceManager = this._serverLibrary.AddLib(
      "ServiceManager",
      { webServer : this, serverLibrary : this._serverLibrary },
      "webserver",
      ( libObject ) => {
        this._hosts = libObject;
        console.log( "Service manager loaded." );
      }
    );
    if( serviceManager !== null ){
      this._services = hostManager;
    }
    
    let routeObject = this._serverLibrary.AddLib( 
      "Router",
      null,
      "webserver",
      ( libObject ) => {
        this._router = libObject;
      }
    );
    if( routeObject !== null ){
      this._router = routeObject;
    }
    
    let connectionObject = this._serverLibrary.AddLib( 
      "ConnectionManager",
      { webServer : this },
      "webserver",
      ( libObject ) => {
        this._connection = libObject;
      }
    );
    if( routeObject !== null ){
      this._router = routeObject;
    }
    
    let contentBuffer = this._serverLibrary.AddLib( 
      "ContentBuffer",
      null,
      "webserver",
      ( libObject ) => {
        this._contentBuffer = libObject;
      }
    );
    if( contentBuffer !== null ){
      this._contentBuffer = contentBuffer;
    }
    
    this._serverLibrary.AddLib( "ViewHelper", null, "webserver", ( ) => {
      this._serverLibrary.ForceRecompile( "ContentBuffer", __dirname + "/ContentBuffer" );
    });
    
    this._serverLibrary.AddLib( "Connection", null, "webserver", ( ) => {
      this._serverLibrary.ForceRecompile( "ConnectionManager", __dirname + "/ConnectionManager" );
    });
    
    this._serverLibrary.AddLib( "Header", null, "webserver", ( ) => {
      this._serverLibrary.ForceRecompile( "ContentBuffer", __dirname + "/ContentBuffer" );
    } );
  }
  
  get database(){
    return this._db;
  }
  
  get connection(){
    return this._connection.compiled;
  }
  
  get router(){
    return this._router.uncompiled;
  }
  
  get services(){
    return this._services.compiled;
  }
  
  get contentBuffer(){
    return this._contentBuffer.uncompiled;
  }
  
  _CompileRequest( request, response ){
    request.ssl = false;
    request.post = {};
    if( request.method === "POST") {
      request.postBody = "";
      request.on( 'data', ( data ) => {
        //Check to make sure they are not 6 gigs in post.
        request.postBody += data;
      });
      request.on( 'end', () => {
        request.post = {};
      });
      
      let form = new multiparty.Form();
      form.parse( request, ( error, fields, files ) => {
        if( error ){
          request.post = qs.parse( request.postBody );
        }
        else{
          request.post = {};
          for( let field in fields ){
            request.post[field] = fields[field][0];
          }
          for( let file in files ){
            if( files[file][0].size > 0 ){
              request.post[file] = files[file][0]; 
            }
          }
        }
        
        this._DoRequest( request, response );
      } );
    }
    else{
      this._DoRequest( request, response );
    }
    
  }
  
  _DoRequest( request, response ){
    this._GenerateCookies( request );
    let host = this.services.GetHost( request );
    let router = new this.router( host, request );
    let contentBuffer = new this.contentBuffer( this, host, router, response, this._config );
  }
  
  _GenerateCookies( request ){
    if( request.headers.cookie ){
      request.cookies = qs.parse( request.headers.cookie.replace( "; ", "&" ).replace( ";", "&" ) );
    }
    else{
      request.cookies = {};
    }
  }
}
