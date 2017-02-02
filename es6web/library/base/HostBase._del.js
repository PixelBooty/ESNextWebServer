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

  SetupHost(){}

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



  



}
