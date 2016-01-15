let fs = require( "fs" );
let path = require( "path" );

export class ServiceManager{
  constructor( settings ){
    this._services = {};
    this._sharedService = null;
    this._serviceList = {};
    for( let i = 0; i < settings.services.length; i++ ){
      this._serviceList[settings.services[i]] = {};
    }
    this._server = settings.webServer;
    this._coreLibrary = settings.serverLibrary;
    this._InitServiceBase();
  }

  _InitServiceBase(){
    let serviceBase = this._coreLibrary.AddLib( "base/ServiceBase", null, "servicebase", this._RebuildBaseService.bind( this ) );
    if( this._hostManager !== null ){
      this._RebuildBaseService();
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

  _RebuildBaseService(){
    for( let service in this._serviceList ){
      this._BuildService( service );
    }
  }

  GetHost( request ){
    for( let service in this._services ){
      let host = this._services[service].GetHost( request );
      if( host !== null ){
        return host;
      }
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
