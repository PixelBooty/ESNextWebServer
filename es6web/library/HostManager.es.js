/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */ 

let fs = require( "fs" );
import { DynamicLoader } from "./DynamicLoader.es.js";

export class HostManager{
  constructor( settings ) {
    this.hasShared = false;
    this._service = settigns.service;
    this._hosts = {};
    this._server = settings.webServer;
    this._coreLibrary = settings.serverLibrary;
    this._InitHosts();
  }
  
  _InitHosts(){
    let hostBase = this._coreLibrary.AddLib( "base/HostBase", null, "hostbuild", this._RebuildBaseHost.bind( this ) );
    if( hostBase !== null ){
      this._RebuildBaseHost();
    }
  }
  
  _AddHostListener( path, libObject ){
    this._AddHost( libObject.path.replace( "/Host.es.js", "" ).replace( "Hosts/", "" ), new libObject.uncompiled( this, this._server, this._coreLibrary, libObject.path.replace( "/Host.es.js", "" ) ) );
  }
  
  _RebuildBaseHost( libObject ){
    let hostLib = this._coreLibrary.GetPathListener( this._service.path + "Hosts/" );
    this._coreLibrary.AddPathListener( this._service.path + "Hosts/", "Host", null, this._AddHostListener.bind( this ), 3 );
    if( hostLib !== null ){
      for( let host in hostLib.libs ){
        this._coreLibrary.ForceRecompile( this._service.path + "Hosts/", host );
      }
    }
  }
  
  PullHost( hostName ){
    return this._hosts[hostName] || null;
  }
  
  GetHost( request ){
    let requestedHost = request.headers.host.split( ":" )[0].replace( /www\./, "" );
    for( let host in this._hosts ){
      let hostObject = this._hosts[host].CheckHost( requestedHost );
      if( hostObject !== null ){
        return 	this._Connect( request, hostObject );
      }
    }
  }
  
  _Connect( request, hostObject ){
    request.env = hostObject.environment;
    request.host = hostObject.host;
    return hostObject.host;
  }
  
  _AddHost( path, hostObject ){
    this._hosts[path] = hostObject;
  }
}
