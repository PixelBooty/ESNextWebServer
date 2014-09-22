let fs = require( "fs" );
let crypto = require('crypto');
let traceur = require( "traceur" );

/**
 * Works to allow libraries and other script sources to load and reload when they are updated. In other words this is a JIT compiler and cacher for nodejs.
 */
export class DynamicLoader{
  /**
   * Constructor for DynamicLoader.
   * @param string path - Path of the loader libs.
   * @param object settings - Settings for loader.
   */
  constructor( path, settings = {} ) {
    //Default settings
    settings.useES6 = settings.useES6 || true;
    //settings.preloadHooks = settings.preloadHooks || [];
    //settings.requiredPath = settings.requiredPath || "";
    
    this._path = path;
    this._loadedLibs = {};
    this._useES6 = settings.useES6;
    this._scriptExt = ".js";
    this._watchedPaths = {};
    this._watchDirectories = {};
    this._pathListeners = {};
    this._pathHashs = {};
    this._pathWatchers = {};
    this._indexWatchers = {};
    if( this._useES6 ){
      this._scriptExt = ".es.js";
    }
    this._AddWatchPath( this._path, this._LibPathWatch.bind( this ), -1 );
  }
  
  /**
   * Adds a lib watcher into the current library path for the loader.
   * @param string libPath - Path of the lib relitive to this._path.
   * @param object rebuildSettings - What params should be passed to lib when compiled.
   * @param function postBuildMethod - Method to call once lib is rebuilt.
   * @returns object - The lib if it was added before, or null.
   */
  AddLib( libPath, rebuildSettings, postBuildEventName, postBuildMethod ){
    let preDefined = true;
    if( this._loadedLibs[libPath] === undefined ){
      this._loadedLibs[libPath] = {
        rebuildSettings,
        postBuildMethod : { },
        compile : true,
        ext : this._scriptExt
      };
      this._pathHashs[libPath] = "unknown";
      preDefined = false;
      this._loadedLibs[libPath].postBuildMethod[postBuildEventName] = postBuildMethod;
    }
    else{
      this._loadedLibs[libPath].rebuildSettings = rebuildSettings;
      this._loadedLibs[libPath].postBuildMethod[postBuildEventName] = postBuildMethod;
    }
    if( this._watchedPaths[libPath] === undefined ){
      this._watchedPaths[libPath] = true;
    }
    //Compile Lib
    this._RecompileLib( libPath );
    
    if( preDefined ){
      return this._loadedLibs[libPath];
    }
    
    return null;
  }
  /**
   * Adds a watcher index for path.
   * @param string path - Path to generate an index for.
   * @param function onMofifed - Callback on a index change event.
   */
  AddIndexWatcher( path, onModified ){
    let preDefined = true;
    if( this._indexWatchers[path] === undefined ){
      this._indexWatchers[path] = {
        indexChangeEvent : onModified,
        indexTree : {
          directories : {},
          files : {}
        }
      };
      preDefined = false;
    }
    else{
      this._indexWatchers[path].indexChangeEvent = onModified;
    }
    
    this._AddWatchPath( 
      path,
      ( event, fileName, libPath, passedDepthDir, fileext, dirPath ) => {
        if( event === "change" ){
          this._GetHash( process.cwd() + "/" + libPath, ( hash ) => {
            if( hash !== this._indexWatchers[path].indexTree.files[dirPath+fileName] ){
              this._indexWatchers[path].indexTree.files[dirPath+fileName] = hash;
              this._indexWatchers[path].indexChangeEvent( this._indexWatchers[path], "file", "change", fileName, dirPath, hash );
            }
          } );
        }
        else{
          
        }
      },
      -1,
      ( directoryPath, depth, added ) => {
        if( added ){
          this._indexWatchers[path].indexTree.directories[directoryPath] = true;
          this._indexWatchers[path].indexChangeEvent( this._indexWatchers[path], "dir", "add", directoryPath, "", null );
        }
        else{
          this._indexWatchers[path].indexTree.directories[directoryPath] = false;
          this._indexWatchers[path].indexChangeEvent( this._indexWatchers[path], "dir", "remove", directoryPath, "", null );
        }
      },
      true,
      "*"
    );
    
    if( preDefined ){
      return this._indexWatchers[path];
    }
    else{
      this._CompileFileIndex( path, path );
    }
    
    return null;
  }
  /**
   * Compiles the index in non watch so it starts with one before there are files changed/added/removed.
   * @param string orgPath - Original path for lookup.
   * @param string path - Current executing path.
   */
  _CompileFileIndex( orgPath, path ){
    fs.readdir( path, ( error, files ) => {
      for( let fspfItr = 0; fspfItr < files.length; fspfItr++ ){
        fs.stat( path + files[fspfItr], ( error, stats ) => {
          if( stats.isDirectory() ){
            this._CompileFileIndex( orgPath, path + files[fspfItr] + "/" );
          }
          else{
            this._indexWatchers[orgPath].indexTree.files[path + files[fspfItr]] = "unknown";
            this._indexWatchers[orgPath].indexChangeEvent( this._indexWatchers[orgPath], "file", "add", path + files[fspfItr], "", "unknown" );
          }
        } );
      }
    } );
  }
  /**
   * Adds a path listener to the loader.
   * @param string path - Path to be listened to.
   * @param array compatiableObjects - What objects types can be compiled and stored.
   * @param object rebuildSettings - If compile what params should be passed.
   * @param function postBuildMethod - Method to call once files are rebuilt.
   * @param int depth - How deep in the directoies are the files being checked for. -1 for all.
   * @param bool compile - Should the files be compiled?
   * @param string ext - Extention of files to rebuild.
   */
  AddPathListener( path, compatiableObjects, rebuildSettings, postBuildMethod, depth, compile = true, ext = null ){
    if( ext === null ){
      ext = this._scriptExt;
    }
    
    if( this._pathListeners[path] === undefined ){
      if( compatiableObjects === "*" ){
        compatiableObjects = [];
      }
      else{
        compatiableObjects = compatiableObjects.split( "," );
      }
      this._pathListeners[path] = {
        rebuildSettings,
        compatiableObjects,
        postBuildMethod : { "postbuild" : postBuildMethod },
        compile,
        ext,
        libs : {}
      };
    }
    else{
      this._pathListeners[path].rebuildSettings = rebuildSettings;
      this._pathListeners[path].postBuildMethod["postbuild"] = postBuildMethod;
    }
    
    if( this._watchedPaths[path] === undefined ){
      this._watchedPaths[path] = true;
    }

    this._AddWatchPath( 
      path,
      ( event, fileName, libPath, passedDepthDir, fileext ) => {
        if( passedDepthDir === 0 || passedDepthDir === -1 ){
          libPath = libPath.split( "/" );
          libPath.pop();
          libPath = libPath.join( "/" ) + "/";
          this._LibPathWatch( event, libPath + fileName, path, passedDepthDir, fileext );
        }
      },
      depth,
      ( directoryPath, depth, added ) => {
        if( depth === 0 || depth === -1 ){
          if( this._pathListeners[path].compatiableObjects.length > 0 ){
            for( let coitr = 0; coitr < this._pathListeners[path].compatiableObjects.length; coitr++ ){
              if( added ){
                this._watchedPaths[directoryPath + this._pathListeners[path].compatiableObjects[coitr]] = true;
              }
              else{
                this._watchedPaths[directoryPath + this._pathListeners[path].compatiableObjects[coitr]] = false;
              }
            }
          }
        }
      }, this._pathListeners[path].compatiableObjects.length === 0, ext
    );
    
    this._CompilePathListener( path, path, depth, ext );
    
  }
  /**
   * Compiles the path for the path listener initally to make sure all files without changes are also notified.
   * @param string orgPath - Original path for lookup.
   * @param string path - Current executing path.
   * @param int depth - Current depth at 0 it will stop recurisive search.
   * @param string ext - Extention of files to be notified for.
   */
  _CompilePathListener( orgPath, path, depth, ext ){
    fs.readdir( path, ( error, files ) => {
      for( let fspfItr = 0; fspfItr < files.length; fspfItr++ ){
        fs.stat( path + files[fspfItr], ( error, stats ) => {
          if( stats.isDirectory() ){
            if( depth == -1 || depth > 0 ){
              let postDepth = depth;
              if( postDepth !== -1 ){
                postDepth--;
              }
              this._CompilePathListener( orgPath, path + files[fspfItr] + "/", postDepth, ext );
            }
          }
          else{
            let objectName = files[fspfItr].replace( ext, "" );
            if( files[fspfItr].EndsWith( ext ) && this._pathListeners[orgPath].compatiableObjects.length > 0 && this._pathListeners[orgPath].compatiableObjects.indexOf( objectName ) !== -1 ){
              this._LibPathWatch( "added", path + files[fspfItr], orgPath, depth, ext );
            }
            else if( files[fspfItr].EndsWith( ext ) && this._pathListeners[orgPath].compatiableObjects.length === 0 ){
              this._LibPathWatch( "added", path + files[fspfItr], orgPath, depth, ext );
            }
          }
          
        } );
      }
      
    } );
    
  }
  
  /**
   * Checks to see if the loader has a library.
   * @retruns bool - Do the lib exist?
   */
  HasLib( libPath ){
    return this._loadedLibs[libPath] !== undefined;
  }
  /**
   * Gets a path listener for path.
   * @param string path - Path of the path listener to get.
   * @retruns object - Path listener for pass or null if none.
   */
  GetPathListener( path ){
    if( this._pathListeners[path] !== undefined ){
      return this._pathListeners[path];
    }
    return null;
  }
  /**
   * Gets a library for libPath.
   * @param string libPath - Path of lib to get.
   * @return object - Lib object from path or null if none.
   */
  GetLib( libPath ){
    if( this._loadedLibs[libPath] !== undefined ){
      return this._loadedLibs[libPath];
    }
    
    return null;
  }
  /**
   * Adds a path to be watched and reported on.
   * @param string path - Path to be watched.
   * @param function watchMethod - Callback for file events.
   * @param string subDirDepth - How deep does the search have to go to find files of requested ext.
   * @param function directoryChange - Callback for directory events.
   * @param bool allPaths - this._watchedPaths only or all paths?
   * @param string ext - What should file file ext be, * for all ext.
   */
  _AddWatchPath( path, watchMethod, subDirDepth, directoryChange = null, allPaths = false, ext = null ){
    if( ext === null ){
      ext = this._scriptExt;
    }
    let pathMethod = this._pathWatchers[path];
    this._pathWatchers[path] = watchMethod;
    if( !pathMethod ){
      this._DoWatchPath( path, path, subDirDepth, directoryChange, allPaths, ext );
    }
  }
  /**
   * Same as _AddWatchPath but can go into subdirectories.
   * @param string orgPath - Orginal path for lookup.
   * @param string path - Path to be watched.
   * @param string subDirDepth - How deep does the search have to go to find files of requested ext.
   * @param function directoryChange - Callback for directory events.
   * @param bool allPaths - this._watchedPaths only or all paths?
   * @param string ext - What should file file ext be, * for all ext.
   */
  _DoWatchPath( orgPath, path, subDirDepth, directoryChange, allPaths, ext ){
    fs.watch( path, ( event, fileName ) => {
      let libPath = path.replace( this._path, "" ) + fileName.replace( ext, "" );
      fs.exists( path + fileName, ( exists ) => {
        let passedDepthDir = subDirDepth;
        if( passedDepthDir !== -1 ){
          passedDepthDir--;
        }
        if( exists ){
          fs.stat( path + fileName, ( error, stats ) => {
            if( error !== null && error.errno === 34 ){
              if( this._watchDirectories[path + fileName + "/"] ){
                this._watchDirectories[path + fileName + "/"] = false;
                if( directoryChange !== null ){
                  directoryChange( path + fileName + "/", passedDepthDir, false );
                }
              }
            }
            else{
              if( stats.isDirectory() ){
                this._watchDirectories[path + fileName + "/"] = true;
                if( directoryChange !== null ){
                  this._DoWatchPath( orgPath, path + fileName + "/", passedDepthDir, directoryChange, allPaths, ext );
                  directoryChange( path + fileName + "/", passedDepthDir, true );
                }
              }
              else{
                
                if( ( allPaths && ext === "*" ) || ( allPaths && fileName.EndsWith( ext ) ) || this._watchedPaths[ libPath ] ){
                  this._pathWatchers[orgPath]( event, fileName, libPath, passedDepthDir, ext, path );
                }
                else{
                  if( this._watchedPaths[ libPath ] ){
                    console.log( "Remove file." );
                  }
                }
              }
            }
          } );
        }
        else{
          if( this._watchDirectories[path + fileName + "/"] ){
            this._watchDirectories[path + fileName + "/"] = false;
            if( directoryChange !== null ){
              directoryChange( path + fileName + "/", passedDepthDir, false );
            }
          }
          else{
            if( this._watchedPaths[ libPath ] ){
              console.log( "Remove file." );
            }
          }
        }
      });
      
    } );
    if( subDirDepth == -1 || subDirDepth > 0 ){
      fs.readdir( path, ( error, files ) => {
        for( let fi = 0; fi < files.length; fi++ ){
          fs.stat( path + files[fi], ( error, stats ) => {
            if( stats.isDirectory() ){
              let passedDepth = subDirDepth;
              if( passedDepth !== -1 ){
                passedDepth--;
              }
              this._DoWatchPath( orgPath, path + files[fi] + "/", passedDepth, directoryChange, allPaths, ext );
              this._watchDirectories[path + files[fi] + "/"] = true;
              if( directoryChange !== null ){
                directoryChange( path + files[fi] + "/", passedDepth, true );
              }
            }
          } );
        }
        
      });
    }
  }
  /**
   * Base watch callback method that allows for compile or file data store.
   * @param string event - File event.
   * @param string fileName - Name of file that fired an event.
   * @param string path - Full path of file.
   * @param int depth - Unused and only here for path listen system.
   * @param string ext - Extention of files to compile at path, if null uses default.
   */
  _LibPathWatch( event, fileName, path, depth, ext = null ){
    if( ext === null ){
      ext = this._scriptExt;
    }
    if( fileName.EndsWith( ext ) ){
      //Hex check on file if it is one that is watched.//
      this._RecompileLib( path, fileName );
    }
  }
  /**
   * Gets a hash and calls back with ( hash ) => { } for hash comperisons.
   * @param string path - Path of the file to get the hash for.
   * @param function callback - 
   */
  _GetHash( path, callback ){
    let fd = fs.createReadStream( path );
    let hash = crypto.createHash('sha1');
    hash.setEncoding('hex');

    fd.on('end', function() {
      hash.end();
      callback( hash.read() );
    });

    fd.pipe( hash );
  }
  
  /**
   * Forces a file or library to recompile.
   * @param string libPath - Path of the file in the this._loadedLibs or this._pathListeners.
   * @param string fullFileName - Full filename of library file.
   */
  ForceRecompile( libPath, fullFileName ){
    this._RecompileLib( libPath, fullFileName, true );
  }
  /**
   * Recompiles the path or library file.
   * @param string libPath - Path of the file in the this._loadedLibs or this._pathListeners.
   * @param string fullFileName - Full filename of the file.
   * @param bool forcedRecompile - Should a recompile of code be forced regardless of the hash?
   */
  _RecompileLib( libPath, fullFileName, forcedRecompile = false ){
    let libPathObject = null;
    let filePath = "";
    let libBuildObject = null;
    let libPathObjectName = "";
    if( this._loadedLibs[libPath] ){
      libPathObject = this._loadedLibs[libPath];
      libBuildObject = this._loadedLibs[libPath];
      filePath = this._path + libPath + libPathObject.ext;
      libPathObjectName = libPath.split( "/" )[libPath.split( "/" ).length - 1];
    }
    else{
      libPathObject = this._pathListeners[libPath];
      if( this._pathListeners[libPath].libs[fullFileName] === undefined ){
        this._pathListeners[libPath].libs[fullFileName] = {
          path : fullFileName
        };
      }
      libBuildObject = this._pathListeners[libPath].libs[fullFileName];
      filePath = process.cwd() + "/" + fullFileName;
      libPathObjectName = fullFileName.split( "/" )[fullFileName.split( "/" ).length - 1].replace( libPathObject.ext, "" );
    }
    this._GetHash( filePath, ( hash ) => {
      if( forcedRecompile || this._pathHashs[libPath] != hash ){
        //Reload the library.
        if( libPathObject.rebuildSettings !== null ){
          let libCompiledObject = null;
          if( libBuildObject.compiled !== undefined && libBuildObject.compiled["Destroy"] !== undefined ){
            libBuildObject.compiled.Destroy( ( ) => {
              libCompiledObject = this._ReloadCompile( filePath, libPathObject, libPathObjectName, true );
              if( libCompiledObject !== null ){
                libBuildObject.compiled = libCompiledObject;
                this._PostBuildMethod( libPathObject, libBuildObject, libPath );
              }
            });
          }
          else{
            libCompiledObject = this._ReloadCompile( filePath, libPathObject, libPathObjectName, true );
            if( libCompiledObject !== null ){
              libBuildObject.compiled = libCompiledObject;
              this._PostBuildMethod( libPathObject, libBuildObject, libPath );
            }
          }
        }
        else{
          if( libPathObject.compile ){
            libBuildObject.uncompiled = this._ReloadCompile( filePath, libPathObject, libPathObjectName, false );
            this._PostBuildMethod( libPathObject, libBuildObject, libPath );
          }
          else{
            fs.readFile( filePath, { "encoding" : "utf8" }, ( error, data ) => {
              if( error === null ){
                libBuildObject.data = data;
                this._PostBuildMethod( libPathObject, libBuildObject, libPath );
              }
              else{
                console.log( "Error reading file" );
                console.log( error );
              }
            });
          }
        }
        this._pathHashs[libPath] = hash;
      }
    });
    //;
  }
  /**
   * Fire post build event.
   * @param object libPathObject - Path infomation object.
   * @param object libBuildObject - Build infomation object.
   */
  _PostBuildMethod( libPathObject, libBuildObject, path ){
    if( libPathObject.postBuildMethod !== null ){
      for( let eventName in libPathObject.postBuildMethod ){
        libPathObject.postBuildMethod[eventName]( libPathObject, libBuildObject );
      }
    }
  }
  /**
   * Attempts to load a script.
   * @param string filePath - Path of the script to attempt to load.
   * @param object libPathObject - Path infomation object.
   * @param object libPathObjectName - Name of object if there is one to compile.
   * @param bool compile - Should it compile?
   * @returns mixed - Compiled library, or uncompiled object, or null if parse error.
   */
  _ReloadCompile( filePath, libPathObject, libPathObjectName, compile ){
    let oldCache = require.cache[filePath];
    try{
      let libExports = traceur.require( filePath );
      delete require.cache[filePath];
      //let loadedModuals = Object.keys(require('module')._cache );
      let lib = libExports[libPathObjectName];
      if( compile ){
        return new lib( libPathObject.rebuildSettings );
      }
      else{
        return lib;
      }
      
    }
    catch( ex ){
      console.log( "Caught parse error with library, revering to old one." );
      console.log( ex );
      require.cache[filePath] = oldCache;
      return null;
    }
  }
  
  //_RemoveWatchPath( path ){
    
  //}
  
}