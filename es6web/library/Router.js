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
    this._fileData = null;
    this.params = null;
    this._routeError = [];
    this.headers = request.headers;
    this.method = request.method.toLowerCase();
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

    this.requestData = Object.assign( this.get, this.post );
    this._BuildRoute();
  }

  get request(){
    return this._request;
  }

  get file(){
    return this._fileData;
  }

  get module(){
    return this._module;
  }

  get controller(){
    return this._controller;
  }

  get api(){
    return this._api;
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
    if( this._url.startsWith( "/" ) ){
      urlRoute = urlRoute.substr( 1 );
    }

    let moduleArgument = urlRoute.split( ";" );
    if( moduleArgument.length > 1 ){
      if( this._service.HasModule( moduleArgument[1] ) ){
        this._module = this._service.GetModule( moduleArgument[1] );
        this._moduleName = moduleArgument[1];
        urlRoute = moduleArgument[0];
      }
      else{
        this._module = this._service.siteModule;
      }
    }
    else{
      this._module = this._service.siteModule;
    }

    if( this._module === null ){
      this._routeError.push( { code: 404, message: "Cannot find requested module " + this._moduleName + "." } );
      return;
    }

    let fileName = urlRoute;
    let realFile = this._module.GetFile( fileName );
    if( realFile === null && this._service.manager.GetSharedService() !== null ){
      realFile = this._service.manager.GetSharedService().GetModule( "site-module" ).GetFile( fileName );
    }
    if( realFile !== null ){
      this._isFile = true;
      this._fileData = realFile;
      return;
    }

    let controllerArgument = urlRoute.split( "/" );
    let controllerName = controllerArgument[0];
    if( controllerName === "api" ){
      let apiName = controllerArgument[1];
      controllerArgument.splice( 1, 1 );
      controllerArgument.splice( 0, 1 );
      let params = controllerArgument;
      if( params.length > 0 ){
        this.params = params;
      }
      this._api = this._module.GetApi( apiName );
      if( this._api === null ){
        this._routeError.push( { code : 404, message : "Cannot find requested api endpoint " + apiName + "." } );
        return;
      }
    }
    else{
      this._api === null;
      let defaults = this._module.defaultRoutes;
      this._controllerName = controllerName || defaults.controller;
      
      this._controller = this._module.GetController( this._controllerName );
      if( this._controller === null ){
        this._controllerName = defaults.controller;
        this._controller = this._module.GetController( this._controllerName );
        this._actionView = controllerArgument[0] || "";
        controllerArgument.splice( 0, 1 );
      }
      else{
        this._actionView = controllerArgument[1] || "";
        controllerArgument.splice( 1, 1 );
        controllerArgument.splice( 0, 1 );
      }

      let params = controllerArgument;
      if( params.length > 0 ){
        this.params = params;
      }
      if( this._controller === null ){
        this._routeError.push( { code : 404, message : "Cannot find requested controller " + this._controllerName + "." } );
        return;
      }
    }
    

    // module/actionView;controller@event
    
    // controller/actionView;module
    /*let controller = "";
    let module = "";
    let actionView = "";
    let fileName = "";

    let controllerArgument = urlRoute.split( "/" );
    if( controllerArgument.length > 1 ){
      controller = controllerArgument[0];
      urlRoute = controllerArgument[0];
    }

    console.log( controller );

    

    if( controller === "" ){
      fileName = urlRoute;
    }

    if( urlRoute !== "" ){
      actionView = urlRoute;
    }

    this._moduleName = module;

    this._actionView = actionView;
    this._controllerName = controller;
    let realFile = this._module.GetFile( fileName );
    if( realFile === null && this._service.manager.GetSharedService() !== null ){
      realFile = this._service.manager.GetSharedService().GetModule( "site-module" ).GetFile( fileName );
    }
    if( fileName !== "" && realFile !== null ){
      this._isFile = true;
      this._fileData = realFile;
    }
    else{
      if( this._module === null ){
        this._routeError.push( { code: 404, message: "Cannot find requested module " + this._moduleName + "." } );
      }
      else{
        let defaults = this._module.defaultRoutes;
        if( this._controllerName === "" ){
          this._controllerName = defaults.controller;
        }
        //if( this._actionView === "" ){
        //  this._actionView = defaults.actionView;
        //}
      }

      if( urlRoute.startsWith( "api/" ) ){
        this._controller = null;

        console.log( this._controllerName );
        //this._api = this._module.GetApi( this. );
      }
      else{
        this._api = null;
        this._controller = this._module.GetController( this._controllerName );
        if( this._controller === null ){
          this._routeError.push( { code : 404, message : "Cannot find requested controller " + this._controllerName + "." } );
        }
      }

      
    }

    if( this._routeError.length > 0 ){
      //Set view to error view if one is present.
      console.error( "Route has error!" );
    }*/

    //return this._service.CreateRouting( modual, view, controller, event );
  }

}
