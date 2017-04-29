let fs = require( "fs" );
let path = require( "path" );

exports.ServiceManager = class ServiceManager extends Object{
  constructor( webServer, services ){
    super();
    this._services = {};
    this._sharedService = null;
    this._serviceList = {};
    for( let i = 0; i < services.length; i++ ){
      this._serviceList[services[i]] = null;
    }
    this._server = webServer;
    this._hosts = this._hosts || {};
    this._InitServiceBase();
  }

  _InitServiceBase(){
    for( let service in this._serviceList ){
      this.AddService( service );
    }

    global.wsmservice = ( caller = null ) => {
      caller = caller || dynamicCaller();
      for( let serviceName in this._services ){
        if( caller.indexOf( path.resolve( serviceName ) ) == 0 ){
          return this._services[serviceName];
        }
      }
    };

    global.wsmmodule = ( caller = null ) => {
      caller = caller || dynamicCaller();
      let service = wsmservice( caller );
      for( let moduleName in service.modules ){
        if( caller.indexOf( path.resolve( service.modules[moduleName].path ) ) == 0 ){
          return service.modules[moduleName];
        }
      }
    };

    global.wsmlibrary = ( libraryName, caller = null ) => {
      caller = caller || dynamicCaller();
      let module = wsmmodule( caller );
      return module.GetLibrary( libraryName );
    };
  }

  TrackHost( hostName, service ){
    if( this._hosts[hostName] === undefined ){
      this._hosts[hostName] = service;
    }
    else{
      console.warn( "Host " + hostName + " is already tracked to " + this._hosts[hostName] + " and cannot be added to tracking for " + servicePath.path );
    }
  }

  _AddServiceListener( pathObject, libObject ){
    this._AddService( libObject.path.replace( "/Service.es.js", "" ).replace( "Services/", "" ), new libObject.uncompiled( this, this._server, this._coreLibrary, libObject.path.replace( "/Service.es.js", "" ) ) );
  }

  _BuildService( service ){
    let servicePath = service;
    this._serviceList[service].servicePath = servicePath;
    this._serviceList[service].listener = this._coreLibrary.GetPathListener( servicePath );
    this._coreLibrary.AddPathListener( servicePath, "Service", null, this._AddServiceListener.bind( this ), 0 );
    if( this._serviceList[service].listener !== null ){
      this._coreLibrary.ForceRecompile( servicePath + "Service.es.js", service );
    }
  }

  AddService( servicePath ){
    let realPath = servicePath;
    if( !path.isAbsolute( realPath ) ){
      realPath = path.normalize( path.resolve( realPath ) );
    }
    if( this._services[servicePath] === undefined ){
      let serviceObject = dynamic( realPath + "/Service" ).Service;
      this._services[servicePath] = new serviceObject( this, this._server, servicePath );
    }
  }

  RemoveService( service ){
    delete this._services[service];
  }

  GetHostService( request ){
    let requestedHost = request.headers.host.split( ":" )[0].replace( /www\./, "" );
    if( this._hosts[requestedHost] !== undefined ){
      this._hosts[requestedHost].ConnectToHost( request, requestedHost );
      return this._hosts[requestedHost];
    }

    return null;
  }

  SetSharedService( service ){
    this._sharedService = service;
  }

  GetSharedService() {
    return this._sharedService;
  }

  _AddService( servicePath, serviceObject ){
    this._services[servicePath] = serviceObject;
  }
}
