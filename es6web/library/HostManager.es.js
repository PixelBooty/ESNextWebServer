/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let fs = require( "fs" );
import { DynamicLoader } from "./DynamicLoader.es.js";

export class HostManager{
  constructor( server ) {
    this.hasShared = false;
    this.hosts = {};
    this._hostLoader = null;
    this._server = server;
    this._InitHosts();
  }
  
  _InitHosts(){
    this._hostLoader = new DynamicLoader( "Hosts" );
    await this._server.coreLibrary.AddLib( "base/HostBase", ( lib ) => {
      this._ReloadHosts();
    });
  }
  
  _ReloadHosts(){
    fs.readdir( "Hosts", ( err, files ) => {
      this._CheckHost( files );
    } );
  }
  
  GetHost( request ){
    console.log( "ask for host" );
  }
  
  _AddHost( hostToAdd ){
    await this._hostLoader.AddLib( hostToAdd + "/Host", ( lib ) => {
      this.hosts[hostToAdd] = new lib.lib( this );
   }, true );
   console.log( "Hosts Initalized" );
  }
  
  _CheckHost( hostToCheck ){
    if( hostToCheck == "shared" ){
      this.hasShared = true;
    }
    else{
      fs.exists( "Hosts/" + hostToCheck + "/Host.es.js",  (exists ) => {
        if( exists ){
          this._AddHost( hostToCheck );
        }
        else{
          console.log( "Ignored host " + hostToCheck );
        }
      } );
    }
  }
}