let fs = require( "fs" );

export class ServiceManager{
  constructor( settings ){
    this._services = {};
    this._server = settings.webServer;
    this._coreLibrary = settings.serverLibrary;
    //this._PreLoadServices();
    this._InitServiceBase();
  }

  /*_PreLoadServices(){
    //Check for service links//
    let services = fs.readdirSync( "Services" );
    for( let i = 0; i < services.length; i++ ){
      if( services[i].indexOf( ".service" ) !== -1 ){
        let serviceName = services[i].substring( 0, services[i].indexOf( ".service" ) );
        let linkTo = fs.readFileSync( "Services/" + services[i] ).toString();
        if( fs.existsSync( "Services/" + serviceName ) ){
          fs.unlinkSync( "Services/" + serviceName );
        }
        console.log( linkTo );
        fs.linkSync( linkTo, "Services/" + serviceName );
      }
    }
  }*/
  
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
