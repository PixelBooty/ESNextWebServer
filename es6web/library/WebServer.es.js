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
        this._services = libObject;
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
  
    let postFile = this._serverLibrary.AddLib( 
      "PostFile",
      null,
      "webserver",
      ( libObject ) => {
        this._postFile = libObject;
      }
    );
    if( postFile !== null ){
      this._postFile = postFile;
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
          if( request.postBody.startsWith( "{" ) || request.postBody.startsWith( "[" ) ){
            try{
              request.post = JSON.parse( request.postBody );
            }
            catch( ex ){
              //This is bad json but we will just ignore the input for now.
              request.post = qs.parse( request.postBody );
            }
          }
          else{
            request.post = qs.parse( request.postBody );
          }
        }
        else{
          request.post = {};
          for( let field in fields ){
            let fieldName = field;
            let requestFieldDepth = request.post;
            if( field.indexOf( '.' ) !== -1 ){
              while( fieldName.indexOf( '.') !== -1 ){
                let depthAddition = fieldName.substring( 0, fieldName.indexOf( '.' ) );
                if( requestFieldDepth[depthAddition] === undefined ){
                  requestFieldDepth[depthAddition] = {};  
                }
                requestFieldDepth = requestFieldDepth[depthAddition];
                fieldName = fieldName.substring( depthAddition.length + 1 );
              }
            }
            if( fields[field].length === 1 ){
              requestFieldDepth[fieldName] = fields[field][0];
            }
            else {
              requestFieldDepth[fieldName] = fields[field];
            }
          }
          for( let file in files ){
            let requestFieldDepth = request.post;
            if( files[file][0].size > 0 ){
              let fieldName = file;
              while( fieldName.indexOf( '.') !== -1 ){
                let depthAddition = fieldName.substring( 0, fieldName.indexOf( '.' ) );
                if( requestFieldDepth[depthAddition] === undefined ){
                  requestFieldDepth[depthAddition] = {};  
                }
                requestFieldDepth = requestFieldDepth[depthAddition];
                fieldName = fieldName.substring( depthAddition.length + 1 );
              }
              requestFieldDepth[fieldName] = new this._postFile.uncompiled( files[file][0] ); 
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
    if( host !== null ){
      let service = host.service;
      let router = new this.router( host, request );
      let config = service.GenerateConfig( host, request, this._config );
      let contentBuffer = new this.contentBuffer( this, service, host, router, response, config );
    }
    else{
      response.end( "Requested host does not exist on this server, Error: 504." );
    }
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
