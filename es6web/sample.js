let fs = require( "fs" );

//export class ModuleBase{
exports.ModuleBase = class ModuleBase extends Object{

  constructor( name, moduleManager, service, path ){
    super();
    this._name = name;
    this._manager = moduleManager;
    this._service = service;
    this._modulePath = path;
    this._additionalFiles = {
      "Rest" : [],
      "Models" : [],
      "Net" : []
    };
    this._moduleLoaded = false;
    this._libraries = {};
    this._lib = {
      "lib" : {},
      "Rest" : {},
      "Models" : {},
      "Net" : {}
    };
    this._MapModule();
  }

  _MapModule(){
    let methodMap = {
      "InjectServicePreload" : "injectors.Service.preload",
      "InjectServicePostload" : "injectors.Service.postload",
      "InjectRestPreload" : "injectors.Rest.preload",
      "InjectRestPostload" : "injectors.Rest.postload",
      "InjectRestAuthOr" : "injectors.Rest.author",
      "InjectRestAuthAnd" : "injectors.Rest.authand",
      "RestGeneratorDelete" : "injectors.Rest.generator.del",
      "RestGeneratorPost" : "injectors.Rest.generator.post",
      "RestGeneratorPut" : "injectors.Rest.generators.put",
      "RestGeneratorGet" : "injectors.Rest.generators.get",
      "InjectNetPreload" : "injectors.Net.preload",
      "InjectNetPostload" : "injectors.Net.postload",
      "InjectUnknown" : "injectors.Net.unknown",
      "InjectNetAuth" : "injectors.Net.auth"
    };

    for( let method in methodMap ){
      if( this[method] ){
        this._manager.SetModuleProperties( this._name, methodMap[method], this[method].bind( this ) );
      }
      else{
        this._manager.SetModuleProperties( this._name, methodMap[method], null );
      }
    }

    this._MapDirectories();
  }

  GetAdditionalFiles( injectPath, postPath = "" ){
    let buildList = [];
    for( let file in this._lib[injectPath] ){
      if( postPath === "" || ( postPath != "" && file.startsWith( postPath + "/" ) ) ){
        buildList.push( this._GetAdditionalFileBuild( injectPath, file ) );
      }
    }
    return buildList;
  }

  _GetAdditionalFileBuild( injectPath, libraryName ){
    if( this._additionalFiles[injectPath] !== undefined && this._additionalFiles[injectPath][libraryName] !== undefined ){
      return this._additionalFiles[injectPath][libraryName];
    }
    let libObject = dynamic( this._modulePath + "/" + this._lib[injectPath][libraryName] );
    this._additionalFiles[injectPath][libraryName] = { path : this._lib[injectPath][libraryName], name : libraryName, uncompiled : libObject[libraryName.split( "/" )[libraryName.split( "/" ).length - 1]] };
    return this._additionalFiles[injectPath][libraryName];
  }

  WaitForLoad(){
    let timeout = 5000;
    return new Promise( ( resolve, reject ) => {
      if( this._moduleLoaded ){
        resolve();
      }
      else{
        setInterval( () => {
          timeout -= 25;
          if( this._moduleLoaded ){
            resolve();
          }
          else if( !this._moduleLoaded && timeout < 0 ){
            console.error( "Unable to load module " + this._name );
            this._moduleLoaded = true;
          }
        }, 25 );
      }
    });
  }

  _LoadAdditionalFiles( filePath ){
    //@todo this needs to be done with the updates to the dynamic loader.
    var walk = function(dir, done) {
      var results = [];
      fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
          var file = list[i++];
          if (!file) return done(null, results);
          file = dir + '/' + file;
          fs.stat(file, function(err, stat) {
            if (stat && stat.isDirectory()) {
              walk(file, function(err, res) {
                results = results.concat(res);
                next();
              });
            } else {
              results.push(file);
              next();
            }
          });
        })();
      });
    };
    return new Promise( ( resolve, reject ) => {
      walk( this._modulePath + "/" + filePath, ( err, files ) => {
        if( !err ){
          for( let i = 0; i < files.length; i++ ){
            this._lib[filePath][files[i].replace( this._modulePath + "/" + filePath + "/", "" ).replace( ".es", "" ).replace( ".js", "" )] = files[i].replace( this._modulePath + "/", "" );
          }
          resolve();
        }
        else{
          reject( err );
        }
      });
    } );
  }

  async _MapDirectories(){
    let dirMap = [
      "lib",
      "Models",
      "Rest",
      "Net"
    ];

    for( let i = 0; i < dirMap.length; i++ ){
      if( await this._CheckForDirectory( this._modulePath + "/" + dirMap[i] ) ){
        await this._LoadAdditionalFiles( dirMap[i] );
        this._manager.SetModuleProperties( this._name, dirMap[i], true );
      }
      else{
        this._manager.SetModuleProperties( this._name, dirMap[i], null );
      }
    }

    this._moduleLoaded = true;
  }

  _CheckForDirectory( dirName ){
    return new Promise( ( resolve, reject ) => {
      fs.stat( dirName, ( err, stats ) => {
        if( err ){
          resolve( false );
        }
        else{
          resolve( stats.isDirectory() );
        }
      } );
    } );
  }

  GetLibrary( libraryName ){
    if( this._libraries[libraryName] !== undefined ){
      return this._libraries[libraryName];
    }
    else if( this._lib["lib"][libraryName] !== undefined ){
      let libObject = dynamic( this._modulePath + "/" + this._lib["lib"][libraryName] );
      this._libraries[libraryName] = libObject[libraryName.split( "/" )[libraryName.split( "/" ).length - 1]];
      return this._libraries[libraryName];
    }

    return null;
  }

}
