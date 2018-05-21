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
    this._modulesDirectory = this._modulesDirectory || null;
    this._absolutePath = servicePath;
    this._siteModule = this._siteModule || null;
    this._registeredClassTypes = this._registeredClassTypes || {};
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

  RegisterClassType( name, classRef ){
    this._registeredClassTypes[name.toLowerCase()] = classRef;
  }

  GetClassType( name ){
    return this._registeredClassTypes[name.toLowerCase()] || null;
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

  _PostLoadSetup(){

  }

  async InitalizeService() {
    await this._SetupService();
    if( this._isSharedService ){
      console.info( this._path + " is set as a shared service." );
      this._serviceManager.SetSharedService( this );
    }
    this._siteModule = this._siteModule || new SiteModule( this, this._path );
    this._siteModule.SetDefaults( this._defaultController, this._defaultAction, this._defaultView, this._defaultActionView, this._defaultLayout );
    this._modules["site-module"] = this._siteModule;

    //Initalize other modules//
    this._modulesDirectory = path.normalize( path.resolve( path.join( this._path, "/Modules/" ) ) );
    let modules = await this._GetModules();
    modules.map( x => {
      let module = dynamic( path.join( this._modulesDirectory, x, "Module.js" ) ).Module;
      this.modules[x.toLowerCase()] = new module( this, path.join( this._modulesDirectory, x ) );
    } );

    await this._PostLoadSetup();
  }

  _IsModule( modulePath ){
    return new Promise( ( resolve, reject ) => {
      console.log( path.join( this._modulesDirectory, modulePath, "Module.js" ) );
      fs.exists( path.join( this._modulesDirectory, modulePath, "Module.js" ), ( exists ) => {
        if( !exists ){
          resolve( false );
        }
        else{ 
          resolve( true );
        }
      } );
    });
  }

  async _GetModules(){
    let potenalModuleFolders = await this._GetModuleFiles();
    let moduleFolders = [];
    for( let i = 0; i < potenalModuleFolders.length; i++ ){
      if( await this._IsModule( potenalModuleFolders[i] ) ){
        moduleFolders.push( potenalModuleFolders[i] );
      }
    }

    return moduleFolders;
  }

  _GetModuleFiles(){
    return new Promise( ( resolve, reject ) => {
      fs.readdir( this._modulesDirectory, ( err, files ) => {
        if( err ){
          reject( err );
        }
        else{
          resolve( files );
        }
      } );
    } );
  }

  get manager() {
    return this._serviceManager;
  }

  get modules(){
    return this._modules;
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
