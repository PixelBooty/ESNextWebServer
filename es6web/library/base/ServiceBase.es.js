import { DynamicLoader } from "../DynamicLoader.es.js";

let fs = require( "fs" );
let path = require( "path" );

export class ServiceBase{
  constructor( serviceManager, server, coreLibrary, servicePath ){
    this._envConfig = {
      "production" : {},
      "staging" : {},
      "development" : {},
    };
    this._serviceLibrary = coreLibrary.SpawnNewLoader( process.cwd() + "/" + servicePath + "/Library/" );
    this._config = {};
    this._serviceManager = serviceManager;
    this._server = server;
    this._coreLibrary = coreLibrary;
    this._serviceHostPath = servicePath + "/Hosts/";
    this._path = servicePath;
    this._hosts = {};
    this._databases = {};
    console.log( "Service added " + servicePath );
    this.InitalizeService();
  }

  async InitalizeService() {
    await this._SetupService();
    this._InitHosts();
  }

  get manager() {
  return this._serviceManager;
  }

  get path(){
    return process.cwd() + "/" + this._path;
  }

  _ReloadService(){
    //this._serviceManager._RebuildBaseService();
    this._coreLibrary.ForceRecompile( "Services/", this._path + "/Service.es.js" );
  }

  _InitHosts(){
    let hostBase = this._coreLibrary.AddLib( "base/HostBase", null, "hostbuild-" + this._path, this._RebuildBaseHost.bind( this ) );
    if( hostBase !== null ){
      this._RebuildBaseHost();
    }
  }

  _RebuildBaseHost( libObject ){
    console.log( "rebuilding host for " + this._serviceHostPath );
    let hostLib = this._coreLibrary.GetPathListener( this._serviceHostPath );
    this._coreLibrary.AddPathListener( this._serviceHostPath, "Host", null, this._AddHostListener.bind( this ), 1 );
    if( hostLib !== null ){
      for( let host in hostLib.libs ){
        console.log( this._serviceHostPath );
        console.log( host );
        console.log( this._path );
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

    return null;
  }

  Setting( name, val = null, env = null ){
    if( val === "development" || val === "staging" || val === "production" ){
      env = val;
      val = null;
    }
    if( val !== null ){
      if( env === null ){
        this._config[name] = val;
      }
      else{
        this._envConfig[env][name] = val;
      }
    }

    if( env === null ){
      return this._config[name];
    }
    else{
      return this._envConfig[env][name];
    }

  }

  GenerateConfig( host, request, serverConfig ){
    let config = {};
    let hostConfig = host.GenerateConfig( request );
    for( var setting in serverConfig ){
      config[setting] = serverConfig[setting];
    }
    for( var setting in hostConfig ){
      config[setting] = hostConfig[setting];
    }
    for( var setting in this._config ){
      config[setting] = this._config[setting];
    }

    //Env config
    for( var setting in this._envConfig[request.env] ){
      config[setting] = this._envConfig[request.env][setting];
    }
    return config;
  }

  _Connect( request, hostObject ){
    request.env = hostObject.environment;
    request.host = hostObject.host;
    return hostObject.host;
  }

  _AddHost( path, hostObject ){
    var name = path.split( "/" ).pop();
    console.log( "Added host " + name );
    this._hosts[name] = hostObject;
  }


  async _SetupService(){}
}
