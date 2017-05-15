/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let fs = require( "fs" );
let ejs = require( "ejs" );
let path = require( "path" );

exports.ModuleBase = class ModuleBase extends Object{
  constructor( service, moduleDirectory ){
    super();
    this._service = service;
    this._controllers = this._controllers || {};
    this._path = moduleDirectory;
    this._absolutePath = this._path;
    if( !path.isAbsolute( moduleDirectory ) ){
      this._absolutePath = path.normalize( process.cwd() + "/" + this._absolutePath );
    }
    this._libraries = this._libraries || {};
    this._models = {};
    this._views = {
      "views" : {},
      "actions" : {},
      "layouts" : {},
      "partials" : {}
    };
    this._fileIndex = this._fileIndex || {
      files : {},
      directories : {}
    }
    this._methodMap = {};
    this._moduleName = moduleDirectory.split( "/" )[moduleDirectory.split( "/" ).length - 1];
    this._controllerBase = this._controllerBase || "base/ControllerBase";
    this._modelBase = this._modelBase || "base/ModelBase";
    this._moduleDirectory = moduleDirectory;
    this._InitFileIndex();
    this.SetupModule();
    this._InitControllers();
    this._InitModels();
    this._InitViews();
  }

  get path(){
    return this._path;
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
      //@todo use access ratjer then exists.
      fs.exists( filePath, ( exists ) => {
        if( exists ){
          walk( filePath, ( err, files ) => {
            let fileOutput = [];
            if( !err ){
              for( let i = 0; i < files.length; i++ ){
                fileOutput.push( files[i].replace( filePath + "/", "" ) );
              }
              resolve( fileOutput );
            }
            else{
              reject( err );
            }
          });
        }
        else{
          resolve( [] );
        }
      });

    } );
  }

  async _InitFileIndex(){
    this.assetDirectory = path.normalize( this._absolutePath + "/public" );
    let staticFiles = await this._LoadAdditionalFiles( this.assetDirectory );
    this._RebuildFileIndex( staticFiles );
  }

  _RebuildFileIndex( fileArray ){
    this._fileIndex.files = {};
    this._fileIndex.directories = {};
    for( let i = 0; i < fileArray.length; i++ ){
      this._fileIndex.files[fileArray[i].toLowerCase()] = fileArray[i];
    }
    //@TODO add a default view for public file directory reads when allowed by config.
    //for( let dir in pathIndex.directories ){
    //  this._fileIndex.directories[dir.toLowerCase()] = dir;
    //}
  }

  //@TODO once folder watching system is in place.
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

  async _InitModels(){
    this._modelDirectory = this._moduleDirectory + "/Models/";
    let models = await this._LoadAdditionalFiles( this._modelDirectory );
    for( let i = 0; i < models.length; i++ ){
      let dbType = models[i].split( "/" )[0];
      let modelName = models[i].replace( dbType + "/", "" ).replace( ".js", "" );
      if( this._service.databases[dbType] ){
        let modelObject = dynamic( path.normalize( path.resolve( this._modelDirectory + models[i] ) ) )[modelName];
        this._models[modelName.toLowerCase()] = new modelObject( this._service.databases[dbType].db, this, this._service.databases[dbType].masterDb );
      }
    }
  }


  async _InitControllers(){
    this._controllerDirectory = path.normalize( path.resolve( this._moduleDirectory + "/Controllers/" ) );
    let controllers = await this._LoadAdditionalFiles( this._controllerDirectory );
    for( let i = 0; i < controllers.length; i++ ){
      let controllerName = controllers[i].split( "/" )[controllers[i].split( "/" ).length - 1].replace( ".js", "" );
      let controllerObject = dynamic( this._controllerDirectory + "/" + controllers[i] )[controllerName];
      let controllerPath = controllers[i].replace( ".js", "" ).toLowerCase();
      this._controllers[controllerPath] = controllerObject;
      this._FlushActionViews( controllerPath, controllerObject );
    }
  }

  async _InitViews(){
    this._viewDirectory = path.normalize( path.resolve( this._moduleDirectory + "/Views/" ) );
    let views = await this._LoadAdditionalFiles( this._viewDirectory ); //Replace with dynamic watch//
    for( let i = 0; i < views.length; i++ ){
      let viewName = views[i].replace( ".js.html", "" ).toLowerCase();
      let viewType = viewName.substr( 0, viewName.indexOf( "/" ) );
      viewName = viewName.replace(viewType + "/", "");
      dynamicFile( path.normalize( path.resolve( this._viewDirectory + "/" + views[i] ) ), ( viewData => {
        this._views[viewType][viewName] = ejs.compile( viewData.toString() );
      } ) );
    }

  }

  GetFile( fileName ){
    if( fileName == "" ) {
      return null;
    }
    if( this._fileIndex.files[fileName.toLowerCase()] !== undefined ) {
      return this.assetDirectory + "/" + this._fileIndex.files[fileName] || null;
    }

    return null;
  }

  GetLibrary( libraryName ){
    let lib = null;
    if( this._libraries[libraryName] !== undefined ){
      lib = this._libraries[libraryName];
    }

    if( lib === null ){
      this.AddLibrary( libraryName );
      if( this._libraries[libraryName] !== undefined ){
        lib = this._libraries[libraryName];
      }
    }

    return lib;

  }

  AddLibrary( libraryName, compiledSettings = null ){
    return new Promise( ( resolve, reject ) => {
      let libPath = path.resolve( this._path + "/Library/" + libraryName );
      try{
        this._libraries[libraryName] = dynamic( libPath )[libraryName];
      }
      catch( ex ){
        try{
          this._libraries[libraryName] = superDynamic( libPath + "Super" )[libraryName + "Super"];
        }
        catch( ex ){
          console.error( "Could not find library " + libraryName + " or " + libraryName + "Super" );
          console.log( ex );
        }
      }

    });
  }

  get service(){
    return this._service;
  }

  SetupModule() { }

  _FlushActionViews( controllerName, controllerClass ){
    this._methodMap[controllerName] = {};
    let methods = Object.getOwnPropertyNames( controllerClass.prototype.__original.prototype );
    for ( let i = 0; i < methods.length; i++ ) {
      let methodName = methods[i];
      if( methodName[0] !== "_" && methodName.endsWith( "Action" ) || methodName.endsWith( "View" ) || methodName.endsWith( "Deepview" ) || methodName.endsWith( "Deepaction") ){
        this._methodMap[controllerName][methodName.toLowerCase()] = methodName;
      }
    }
  }

  GetController( controllerPath ){
    if( this._controllers[controllerPath] !== undefined ){
      return this._controllers[controllerPath];
    }

    return null;
  }

  GetModel( modelName ){
    return this._models[modelName.toLowerCase()] || null;
  }

  GetMethod(controllerName, actionName) {
    let methodMap = this._methodMap[controllerName];
    if( actionName === null ) {
      if( methodMap["globaldeepview"] || methodMap["globaldeepaction"] ){
        return methodMap["globaldeepview"] || methodMap["globaldeepaction"];
      }
      return null;
    }
    actionName = actionName.toLowerCase().replace( /-/g, "" );
    if( actionName.indexOf( "/" ) === -1 ){
      if( methodMap[actionName + "view"] ){
        return methodMap[actionName + "view"];
      }
      if( methodMap[actionName + "action"] ){
        return methodMap[actionName + "action"];
      }
    }
    else{
      if( methodMap[actionName.split("/")[0] + "deepview"] ){
        return methodMap[actionName.split("/")[0] + "deepview"];
      }
      if( methodMap[actionName.split("/")[0] + "deepaction"] ){
        return methodMap[actionName.split("/")[0] + "deepaction"];
      }
      if( methodMap["globaldeepview"] ){
        return methodMap["globaldeepview"];
      }
    }

    return null;
  }



  /**
   * Does the action requested, and fills the content buffer.
   */
  GetAction( contentBuffer ){
    let router = contentBuffer.router;
    let controller = contentBuffer.controller;
    let methodName = "";
    let actionView = "";
    let controllerName = router.controllerName;
    actionView = router.actionView;
    let defaultActionView = controller.defaultActionView || this._defaultActionView || null;
    let defaultAction = controller.defaultAction || this._defaultAction || null;
    let defaultView = controller.defaultView || this._defaultView || null;
    if( methodName = this.GetMethod( router.controllerName, router.actionView ) ){

    }
    else{
      if( defaultActionView !== null && ( methodName = this.GetMethod( controllerName, defaultActionView ) ) ){
      }
      else if( methodName = this.GetMethod( controllerName, defaultAction ) ){
      }
      else if( methodName = this.GetMethod( controllerName, defaultView ) ){
      }
      else{
        console.log( "No action found for controller." );
      }
    }
    let error = null;
    if( methodName !== null ){
      if( methodName.endsWith( "View" ) || methodName.endsWith( "Deepview" ) ){
        controller.SetLayoutTemplate( controller.defaultLayout || this._defaultLayout );
        //Must load a view//
        if( methodName.endsWith( "GlobalDeepView" ) ){
          actionView = "global";
        }
        if( methodName.endsWith( "Deepview" ) ){
          actionView = actionView.split( "/" )[0];
        }
        if( this._views["actions"][controllerName + "/" + actionView] ){
          //Controller action view.
          controller.SetViewTemplate( controllerName + "/" + actionView, "actions" );
        }
        else if( this._views["views"][actionView] ){
          //Just a view.
          controller.SetViewTemplate( actionView, "views" );
        }
        else{
          if( actionView === "" && defaultActionView && this._views["actions"][controllerName + "/" + defaultActionView] ){
            controller.SetViewTemplate( controllerName + "/" + defaultActionView, "actions" );
          }
          else if( actionView === "" && defaultView && this._views["views"][defaultView] ){
            //Just a view.
            controller.SetViewTemplate( defaultView, "views" );
          }
          else{
            if( controller.errorAction !== undefined ){
              methodName = this.GetMethod( controllerName, controller.errorAction );
            }
            else{
              error = { code : "404", "message" : "View page not found." };
            }
          }
        }
      }
      else{
        //Must not have a view//
      }
    }
    else{
      //Method not found 404//
      error = { code : "404", requestUri : router };
    }

    if( error === null ){
      return methodName;
    }
    else{
      return { error : error };
    }

  }

  GetLayout( layoutName ){
    return this.GetViewByType( layoutName, "layouts" );
  }

  GetPartial( partialName, searchSharedService = true, searchLocalModule = true, moduleRef = {} ){
    return this.GetViewByType( partialName.toLowerCase(), "partials", searchSharedService, searchLocalModule, moduleRef );
  }

  GetView( viewName ){
    let view = null;
    view = this._views["views"][viewName] || null;
    return view;
  }

  GetViewByType( viewName, viewType, searchSharedService = true, searchLocalModule = true, moduleRef = {} ){
    //try to get layout for this module.
    let view = null;
    if( searchLocalModule ){
      view = this._views[viewType][viewName] || null;
      if( view !== null ) {
        moduleRef.ref = this;
      }
    }

    if( searchSharedService && view === null && this._service.manager.GetSharedService() !== null
     && this._service !== this._service.manager.GetSharedService()
     && this._service.manager.GetSharedService().GetModule("site-module") !== null) {
      view = this._service.manager.GetSharedService().GetModule("site-module").GetViewByType(viewName, viewType);
      if( view !== null ) {
        moduleRef.ref = this._service.manager.GetSharedService().GetModule("site-module");
      }
    }

    return view;
  }

  BindEvents( ){

  }

  get defaultRoutes(){
    return {
      controller : this._defaultController,
      actionView : this._defaultActionView,
      event : this._defaultEvent
    }
  }

}
