/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let fs = require( "fs" );
let crypto = require('crypto');
let traceur = require( "traceur" );

/**
 * Works to allow libraries and other script sources to load and reload when they are updated.
 */
export class DynamicLoader{
  constructor( path, useES6 = true ) {
    this._path = path;
    this._loadedLibs = {};
    this._useES6 = useES6;
    this._scriptExt = ".js";
    if( this._useES6 ){
      this._scriptExt = ".es.js";
    }
  }
  
  _CheckLib( libName, resolvePromise, onUpdate, ignoreHashCheck ){
    let libpath = this._path + "/" + libName + this._scriptExt;
    fs.exists( libpath, ( exists ) => {
      if( exists ){
        this._loadedLibs[libName] = {
          resolvePromise,
          onUpdate
        };
        this._LibReload( libName, ignoreHashCheck );
        fs.watch( libpath, () => {
          this._LibReload( libName );
        } );
      }
      else{
        console.log( "Error 404: Unable to load library '" + libpath + "'" );
      }
    });
  }
  
  AddLib( libName, onUpdate = null, ignoreHashCheck = false ){
    return new Promise( ( resolvePromise ) => {
      this._CheckLib( libName, resolvePromise, onUpdate, ignoreHashCheck );
    });
  }
  
  GetLib( libName ){
    if( this._loadedLibs[libName] !== undefined ){
      return this._loadedLibs[libName];
    }
  }
  
  /*
   * Get a hash for a lib so later checks can make sure the files has changed.
   * @param string libName - Name of the library to check the hash of.
   * @param function callback - ( hash ) callback, can't be async or traceur.require will fail silently.
   */
  _GetLibHash( libName, callback ){
    let fd = fs.createReadStream( this._path + "/" + libName + this._scriptExt );
    let hash = crypto.createHash('sha1');
    hash.setEncoding('hex');

    fd.on('end', function() {
        hash.end();
        callback( hash.read() );
    });

    fd.pipe( hash );
  }
  
  _LibReload( libName, ignoreHashCheck ){
    if( this._loadedLibs[libName].hash === undefined || ignoreHashCheck ){
      this._SetupLib( libName, null, ignoreHashCheck );
    }
    else{
      this._GetLibHash( libName, ( hash ) => {
        if( hash != this._loadedLibs[libName].hash ){
          this._SetupLib( libName, hash );
        }
      } );
    }
  }
  
  _SetupLibHash( libName ){
    this._GetLibHash( libName, ( hash ) => {
      if( hash != this._loadedLibs[libName].hash ){
        this._SetupLib( libName, hash );
      }
    } );
  }
  
  _SetupLib( libName, hash = null, ignoreHashCheck ){
    if( hash === null && !ignoreHashCheck ){
      this._SetupLibHash( libName );
    }
    else{
      let libname = libName.split( "/" ).reverse()[0];
      let libL = this._loadedLibs[libName];
      let lib = null;
      try{
        let libExports = traceur.require( this._path + "/" + libName + this._scriptExt );
        lib = libExports[libname];
      }
      catch( ex ){
        console.log( "Caught parse error with library, revering to old one." );
        console.log( ex );
      }
      if( lib !== null && lib !== undefined ){
        libL.lib = lib;
        libL.hash = hash;
        if( libL.onUpdate !== null ){
          libL.onUpdate( libL );
        }
      }
      else{
        console.log( "Error 500: Unable to load library '" + libName + "'" );
      }
      if( libL.resolvePromise !== null ){
        libL.resolvePromise( libL );
        libL.resolvePromise = null;
      }
    }
  }
  
}