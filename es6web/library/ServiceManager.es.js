export class ServiceManager{
  constructor( settings ){
    this._services = {};
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

  _AddServiceListener( path, libObject ){
    this._AddService( libObject.path.replace( "/Service.es.js", "" ).replace( "Services/", "" ), new libObject.uncompiled( this, this._server, this._coreLibrary, libObject.path.replace( "/Service.es.js", "" ) ) );
  }

  _RebuildBaseService(){
    var serviceLib = this._coreLibrary.GetPathListener( "Services/" );
    this._coreLibrary.AddPathListener( "Services/", "Service", null, this._AddServiceListener.bind( this ), 1 );
    if( serviceLib !== null ){
      for( let service in serviceLib.libs ){
        this._coreLibrary.ForceRecompile( "Services/", service );
      }
    }
  }

  GetHost( request ){
    for( var service in this._services ){
      var host = this._services[service].GetHost( request );
      if( host !== null ){
        return host;
      }
    }

    return null;
  }

  _AddService( path, serviceObject ){
    this._services[path] = serviceObject;
  }
}
