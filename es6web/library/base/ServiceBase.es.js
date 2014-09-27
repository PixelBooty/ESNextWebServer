import { DynamicLoader } from "../DynamicLoader.es.js";

let fs = require( "fs" );

export class ServiceBase{
  constructor( serviceManager, server, coreLibrary, path ){
    this._serviceManager = serviceManager;
    this._server = server;
    this._coreLibrary = coreLibrary;
    this._serviceHostPath = path + "/Hosts/";
    this._path = path;
    this._hosts = {};
    this._InitHosts();
    console.log( "Service added " + path );
  }

  _InitHosts(){
    let hostBase = this._coreLibrary.AddLib( "base/HostBase", null, "hostbuild", this._RebuildBaseHost.bind( this ) );
    if( hostBase !== null ){
      this._RebuildBaseHost();
    }
  }

  _RebuildBaseHost( libObject ){
    let hostLib = this._coreLibrary.GetPathListener( this._serviceHostPath );
    this._coreLibrary.AddPathListener( this._serviceHostPath, "Host", null, this._AddHostListener.bind( this ), 1 );
    if( hostLib !== null ){
      for( let host in hostLib.libs ){
        this._coreLibrary.ForceRecompile( this._serviceHostPath, host );
      }
    }
  }

  _AddHostListener( path, libObject ){
    this._AddHost( libObject.path.replace( "/Host.es.js", "" ).replace( "Hosts/", "" ), new libObject.uncompiled( this, this._server, this._coreLibrary, libObject.path.replace( "/Host.es.js", "" ) ) );
  }

  PullHost( hostName ){
    return this._hosts[hostName] || null;
  }

  GetHost( request ){
    let requestedHost = request.headers.host.split( ":" )[0].replace( /www\./, "" );
    for( let host in this._hosts ){
      let hostObject = this._hosts[host].CheckHost( requestedHost );
      if( hostObject !== null ){
        return  this._Connect( request, hostObject );
      }
    }
  }

  _Connect( request, hostObject ){
    request.env = hostObject.environment;
    request.host = hostObject.host;
    return hostObject.host;
  }

  _AddHost( path, hostObject ){
    console.log( "Added host " + path );
    this._hosts[path] = hostObject;
  }


  SetupService(){}
}
