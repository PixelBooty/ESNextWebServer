/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let qs = require('querystring');
let multiparty = require( 'multiparty' );
let httpServer = require( "http" );
let ServiceManager = dynamic( "./ServiceManager" ).ServiceManager;
let Router = dynamic( "./Router" ).Router;
let ConnectionManager = dynamic( "./ConnectionManager" ).ConnectionManager;
let ContentBuffer = dynamic( "./ContentBuffer" ).ContentBuffer;
let PostFile = dynamic( "./PostFile" ).PostFile;

exports.WebServer = class WebServer extends Object{
  constructor( config, services ) {
    super();
    this._services = services;
    this.serviceManager = this.serviceManager || null;
    this.connectionManager = this.connectionManager || null;
    this._config = config;
    this._webServer = this._webServer || this._InitWebServer();
    this._hosts = null;
    process.__server = this;
    this._StartServer();
  }

  _InitWebServer(){
    let webServer = httpServer.createServer( );
    webServer.listen( this._config.port, this._config.host, null, () => {
      //TODO user change to config rather then just 1000//
      if( this._config.gid && process.setgid !== undefined ){
        process.setgid( 1000 );
      }

      if( this._config.uid && process.setuid !== undefined ){
        process.setuid( 1000 );
      }

      console.log( "Web server started on port " + this._config.port );
    });

    //TODO Stop and start new server?
    return webServer;
  }

  _StartServer(){
    this._webServer.on( "request",  this._CompileRequest.bind( this ) );

    if( this.serviceManager == null ){
      this.serviceManager = new ServiceManager( this, this._services );
    }
    if( this.connectionManager == null ){
      this.connectionManager = new ConnectionManager( this );
    }
  }

  get database(){
    return this._db;
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
              requestFieldDepth[fieldName] = new PostFile( files[file][0] );
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
    let service = this.serviceManager.GetHostService( request );
    if( service !== null ){
      let router = new Router( service, request );
      let config = service.GenerateConfig( service, request, this._config );
      let contentBuffer = new ContentBuffer( this, service, router, response, config );
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
