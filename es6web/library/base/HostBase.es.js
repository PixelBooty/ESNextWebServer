/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

import { DynamicLoader } from "../DynamicLoader.es.js";

let fs = require( "fs" );

export class HostBase{
  constructor( service, server, coreLibrary, hostDirectory ) {
    this._config = {};
    this._envConfig = {
      "production" : {},
      "staging" : {},
      "development" : {}
    };
    this._server = server;
    this._service = service;
    this._allowedHosts = [];
    this._modules = {};
    this._fileIndex = {
      files : {},
      directories : {}
    }
    this._modualDirectory = "";
    this._sharedHost = false;
    if( hostDirectory.indexOf( "shared" ) !== -1 ){
      this._sharedHost = true;
    }
    this._hostDirectory = hostDirectory;
    this._coreLibrary = coreLibrary;
    this.SetupHost();
    this._InitModules();
    this._InitFileIndex();
    console.log( "Added host " + hostDirectory );
  }

  get service(){
    return this._service;
  }

  get pub(){
    let files = [];
    let directories = [];
    for( let file in this._fileIndex.files ){
      files.push( this._fileIndex.files[file].replace( this._assetDirectory, "" ) );
    }
    for( let dir in this._fileIndex.directories ){
      directories.push( this._fileIndex.directories[dir].replace( this._assetDirectory, "" ) );
    }

    return { files, directories };
  }

  get assetDirectory(){
    return this._assetDirectory;
  }

  SetupHost(){}

  GenerateConfig( request ){
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

  _InitModules(){
    this._modualDirectory = this._hostDirectory + "/Modules/";
    let moduleBase = this._coreLibrary.AddLib( "base/ModuleBase", null, this._modualDirectory, this._RebuildModuleBase.bind( this ) );
    if( moduleBase !== null ){
      this._RebuildModuleBase();
    }
  }

  _AddModuleListener( path, libObject ){
    this._AddModule( libObject.path, new libObject.uncompiled( this, this._service, this._coreLibrary, libObject.path.replace( "/Module.es.js", "" ) ) );
  }

  _RebuildModuleBase( libObject ){
    let moduleLib = this._coreLibrary.GetPathListener( this._modualDirectory );
    this._coreLibrary.AddPathListener( this._modualDirectory, "Module", null, this._AddModuleListener.bind( this ), 1 );
    if( moduleLib !== null ){
      for( let module in moduleLib.libs ){
        this._coreLibrary.ForceRecompile( this._modualDirectory, module );
      }
    }
  }

  _AddAllowedHost( hostName, environment, host = null ){
    host = host || this;
    this._allowedHosts.push( { hostName, environment, host } );
  }

  CheckHost( requestedHost ){
    for( let host of this._allowedHosts ){
      if( typeof( host.hostName ) === "string" ){
        if( host.hostName === requestedHost ){
          return host;
        }
      }
      else{
        // Regex
      }
    }

    return null;
  }

  CreateRouting( modual, view, controller, event ){
    console.log( "test" );
  }

  HasModule( moduleName ){
    return this._modules[moduleName] !== undefined;
  }

  get defaultModule(){
    return this._defaultModule;
  }

  GetModule( moduleName ){
    if( this._modules[moduleName.toLowerCase()] !== undefined ){
      return this._modules[moduleName.toLowerCase()];
    }

    return null;
  }

  _AddModule( modulePath, moduleObject ){
    let path = modulePath.replace( this._modualDirectory, "" ).replace( "/Module.es.js", "" ).toLowerCase();
    this._modules[path] = moduleObject;
  }

  _InitFileIndex(){
    this._assetDirectory = this._hostDirectory + "/public/";
    let watcherlib = this._coreLibrary.AddIndexWatcher( this._assetDirectory, this._OnIndexChange.bind( this ) );
    if( watcherlib !== null ){
      this._RebuildFileIndex( watcherlib.indexTree );
    }
  }

  _RebuildFileIndex( pathIndex ){
    this._fileIndex.files = {};
    this._fileIndex.directories = {};
    for( let file in pathIndex.files ){
      this._fileIndex.files[file.toLowerCase()] = file;
    }
    for( let dir in pathIndex.directories ){
      this._fileIndex.directories[dir.toLowerCase()] = dir;
    }
  }

  _OnIndexChange( indexWatchObject, type, event, path, dirPath, hash ){
    if( event === "add" ){
      if( type === "file" ){
        this._fileIndex.files[( dirPath + path ).toLowerCase()] = dirPath + path;
      }
      else{
        this._fileIndex.directories[path.toLowerCase()] = path;
      }

    }
    else if( event === "change" ){
      if( type === "file" ){
        this._fileIndex.files[( dirPath + path ).toLowerCase()] = dirPath + path;
      }
    }
    else if ( event === "remove" ){
      if( type === "file" ){
        console.log( "remove file from index" );
      }
      else{
        console.log( "remove directory from index" );
      }
    }
  }

  GetFile( fileName ){
    if( fileName == "" ) {
      return null;
    }
    if( this._fileIndex.files[this._assetDirectory.toLowerCase() + fileName] !== undefined ) {
      return this._fileIndex.files[this._assetDirectory.toLowerCase() + fileName] || null;
    }
    else {
      if (!this._sharedHost) {
        let sharedHost = this._service.PullHost("shared");
        if (sharedHost) {
          let sharedFile = this._service.PullHost("shared").GetFile(fileName);
          if (sharedFile !== null) {
            return sharedFile;
          }
          else {
            let sharedService = this._service.manager.GetSharedService();
            if( sharedService != null ) {
              let sharedServiceHost = sharedService.PullHost("shared");
              if( sharedServiceHost ) {
                sharedFile = sharedServiceHost.GetFile(fileName);
              }
              if (sharedFile !== null) {
                return sharedFile;
              }
            }
          }
        }
      }
    }

    return null;
  }

}
