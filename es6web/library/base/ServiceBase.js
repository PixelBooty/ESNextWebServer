let fs = require( "fs" );
let path = require( "path" );
let SiteModule = dynamic( "../SiteModule" ).SiteModule;

exports.ServiceBase = class ServiceBase extends Object{
  constructor( serviceManager, server, servicePath ){
    super();
    this._isSharedService = false;
    this._envConfig = {
      "production" : {},
      "staging" : {},
      "development" : {},
    };
    this._config = {};
    this._serviceManager = serviceManager;
    this._server = server;
    this._serviceHostPath = servicePath + "/Hosts/";
    this._path = servicePath;

    //Site module defaults.
    this._defaultController = null;
    this._defaultAction = null;
    this._defaultView = null;
    this._defaultActionView = null;
    this._defaultEvent = null;
    this._defaultLayout = null;

    this._allowedHosts = this._allowedHosts || {};
    this._modules = this._modules || {};
    this._absolutePath = servicePath;
    this._siteModule = this._siteModule || null;
    if( !path.isAbsolute( servicePath ) ){
      this._absolutePath = path.normalize( process.cwd() + "/" + this._absolutePath );
    }
    this._databases = {};
    console.log( "Service added " + servicePath );
    this.InitalizeService();
  }

  AddLibrary( libraryName, moduleName = null ){
    let module = this.siteModule;
    if( moduleName !== null ){
      module = this.GetModule( moduleName.toLowerCase() );
    }
    if( module != null ){
      return module.AddLibrary( libraryName );
    }
  }

  GetLibrary( libraryName, moduleName = null ){
    let module = this.siteModule;
    if( moduleName !== null ){
      module = this.GetModule( moduleName.toLowerCase() );
    }
    if( module != null ){
      return module.GetLibrary( libraryName );
    }

    return null;
  }

  GetModule( moduleName ){
    return this._modules[moduleName] || null;
  }

  get path(){
    return this._path;
  }

  _AddAllowedHost( hostName, environment ){
    if( this._allowedHosts[hostName] === undefined ){
      this._allowedHosts[hostName] = environment;
      console.log( hostName + " is set for " + this._path + " during " + environment );
    }

    this._serviceManager.TrackHost( hostName, this );
  }

  get siteModule(){
    return this._siteModule;
  }

  async InitalizeService() {
    await this._SetupService();
    if( this._isSharedService ){
      console.log( this._path + " is set as a shared service." );
      this._serviceManager.SetSharedService( this );
    }
    this._siteModule = this._siteModule || new SiteModule( this, this._path );
    this._siteModule.SetDefaults( this._defaultController, this._defaultAction, this._defaultView, this._defaultActionView, this._defaultEvent, this._defaultLayout );
    this._modules["site-module"] = this._siteModule;
  }

  get manager() {
  return this._serviceManager;
  }

  get path(){
    return process.cwd() + "/" + this._path;
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

  HasModule( moduleName ){
    return this._modules[moduleName] !== undefined;
  }

  GenerateHostConfig( request ){
    let config = {};
    for( var setting in this._config ){
      config[setting] = this._config[setting];
    }

    //Env config
    for( var setting in this._envConfig[request.env] ){
      config[setting] = this._envConfig[request.env][setting];
    }
    return config;
  }

  GenerateConfig( host, request, serverConfig ){
    let config = {};
    let hostConfig = this.GenerateHostConfig( request );
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

  ConnectToHost( request, host ){
    request.env = this._allowedHosts[host];
    request.service = this;
  }


  async _SetupService(){}
}
