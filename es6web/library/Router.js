/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let qs = require('querystring');
let multiparty = require( 'multiparty' );

exports.Router = class Router extends Object{
  constructor( service, request ) {
    super();
    this._service = service;
    this._request = request;
    this._url = request.url;
    this._isFile = false;
    this._fileName = "";
    this._routeError = [];
    let queryPoint = this._url.indexOf( "?" );
    if( queryPoint !== -1 ){
      this._url = request.url.substring( 0, queryPoint ).replace( /\/\//gi, "/" );
      let queryString = request.url.substring( queryPoint + 1 ).trim();
      if( decodeURI( queryString ).startsWith( "{" ) ){
        try{
          this.get = JSON.parse( decodeURI( queryString ) );
        }
        catch( ex ){
          this.get = {};
        }
      }
      else{
        this.get = qs.parse( queryString );
      }

    }
    else{
      this.get = {};
    }

    this.post = request.post;
    this._BuildRoute();
  }

  get request(){
    return this._request;
  }

  get file(){
    return this._fileName;
  }

  get module(){
    return this._module;
  }

  get controller(){
    return this._controller;
  }

  get event(){
    return this._eventName;
  }

  get actionView(){
    return this._actionView;
  }

  get controllerName(){
    return this._controllerName;
  }

  get isFile(){
    return this._isFile;
  }

  get errors(){
    if( this._routeError.length > 0 ){
      return this._routeError;
    }
    else{
      return null;
    }
  }

  _BuildRoute(){
    let urlRoute = this._url.toLowerCase();
    if( this._url.substr( 0, 1 ) == "/" ){
      urlRoute = urlRoute.substr( 1 );
    }

    // module/actionView;controller@event
    let controller = "";
    let event = "";
    let module = "";
    let actionView = "";
    let fileName = "";

    let eventArgument = urlRoute.split( "@" );
    if( eventArgument.length > 1 ){
      event = eventArgument[1];
      urlRoute = eventArgument[0];
    }

    let controllerArgument = urlRoute.split( ";" );
    if( controllerArgument.length > 1 ){
      controller = controllerArgument[1];
      urlRoute = controllerArgument[0];
    }

    if( event === "" && controller === "" ){
      fileName = urlRoute;
    }

    let moduleArgument = urlRoute.split( "/" );
    let moduleName = "site";
    if( moduleArgument.length > 0 ){
      if( this._service.HasModule( moduleArgument[0] ) ){
        this._module = this._service.GetModule( moduleArgument[0] );
        moduleArgument.splice( 0, 1 );
        moduleName = moduleArgument[0];
        urlRoute = moduleArgument.join( "/" );
      }
      else{
        this._module = this._service.siteModule;
      }

      actionView = urlRoute;
    }
    else{
      this._module = this._service.siteModule;
    }

    if( urlRoute !== "" ){
      actionView = urlRoute;
    }

    this._moduleName = module;

    this._actionView = actionView;
    this._controllerName = controller;
    this._eventName = event;
    let relFilePath = this._module.GetFile( fileName );
    if( relFilePath === null && this._service.manager.GetSharedService() !== null ){
      relFilePath = this._service.manager.GetSharedService().GetModule( "site-module" ).GetFile( fileName );
    }
    if( fileName !== "" && relFilePath !== null ){
      this._isFile = true;
      this._fileName = relFilePath;
    }
    else{
      if( this._module === null ){
        this._routeError.push( { code: 404, message: "Cannot find requested module " + this._moduleName + "." } );
      }
      else{
        let defaults = this._module.defaultRoutes;
        if( this._eventName === "" ){
          this._eventName = defaults.event;
        }
        if( this._controllerName === "" ){
          this._controllerName = defaults.controller;
        }
        //if( this._actionView === "" ){
        //  this._actionView = defaults.actionView;
        //}
      }

      this._controller = this._module.GetController( this._controllerName );
      if( this._controller === null ){
        this._routeError.push( { code : 404, message : "Cannot find requested controller " + this._controllerName + "." } );
      }
    }

    if( this._routeError.length > 0 ){
      //Set view to error view if one is present.
      console.error( "Route has error!" );
    }

    //return this._service.CreateRouting( modual, view, controller, event );
  }

}
