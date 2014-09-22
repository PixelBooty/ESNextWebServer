/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let fs = require( "fs" );
let ejs = require( "ejs" );
import { DynamicLoader } from "../DynamicLoader.es.js";

export class ModuleBase{
  constructor( host, server, coreLibrary, moduleDirectory ){
    this._server = server;
    this._host = host;
    this._hostManager = this._host.manager;
    this._coreLibrary = coreLibrary;
    this._controllers = {};
    this._models = {};
    this._views = {
      "views" : {},
      "actions" : {},
      "layouts" : {},
      "partials" : {}
    };
    this._methodMap = {};
    this._moduleName = moduleDirectory.split( "/" )[moduleDirectory.split( "/" ).length - 1];
    this._controllerBase = this._controllerBase || "base/ControllerBase";
    this._modelBase = this._modelBase || "base/ModelBase";
    this._moduleDirectory = moduleDirectory;
    this.SetupModule();
    this._InitControllers();
    this._InitModels();
    this._InitViews();
  }
  
  get hostManager(){
    return this._hostManager;
  }
  
  get host(){
    return this._host;
  }
  
  SetupModule() { }
  
  _InitControllers(){
    this._controllerDirectory = this._moduleDirectory + "/Controllers/";
    let controllerBase = this._coreLibrary.GetLib( "base/ControllerBase" );
    this._coreLibrary.AddLib( "base/ControllerBase", null, this._controllerDirectory, this._RebuildControllerBase.bind( this ) );
    if( controllerBase !== null ){
      this._RebuildControllerBase();
    }
  }
  
  _RebuildControllerBase( libObject ){
    let controllerLib = this._coreLibrary.GetPathListener( this._controllerDirectory );
    this._coreLibrary.AddPathListener( this._controllerDirectory, "*", null, this._AddControllerListener.bind( this ), -1 );
    if( controllerLib !== null ){
      for( let controller in controllerLib.libs ){
        this._coreLibrary.ForceRecompile( this._controllerDirectory, controller );
      }
    }
  }
  
  _AddControllerListener( pathObject, libObject ){
    let controllerPath = libObject.path.replace( this._controllerDirectory, "" ).replace( ".es.js", "" ).toLowerCase();
    this._controllers[controllerPath] = libObject.uncompiled;
    this._FlushActionViews( controllerPath, libObject.uncompiled );
  }
  
  _FlushActionViews( controllerName, controllerClass ){
    this._methodMap[controllerName] = {};
    let mockController = new controllerClass( this, null, null );
    for( let methodName in mockController ){
      if( methodName[0] !== "_" && methodName.EndsWith( "Action" ) || methodName.EndsWith( "View" ) ){
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
  
  GetMethod( controllerName, actionName ){
    
    let methodMap = this._methodMap[controllerName];
    if( methodMap[actionName + "view"] ){
      return methodMap[actionName + "view"];
    }
    if( methodMap[actionName + "action"] ){
      return methodMap[actionName + "action"];
    }
    
    return null;
  }
  
  
  
  /**
   * Does the action requested, and fills the content buffer.
   */
  DoAction( contentBuffer, viewHelper ){
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
      controller.SetLayoutTemplate( this.GetLayout( controller.defaultLayout || this._defaultLayout ) );
      if( methodName.EndsWith( "View" ) ){
        //Must load a view//
        if( this._views["actions"][controllerName + "/" + actionView] ){
          //Controller action view.
          controller.SetViewTemplate( this._views["actions"][controllerName + "/" + actionView] );
        }
        else if( this._views["views"][actionView] ){
          //Just a view.
          controller.SetViewTemplate( this._views["views"][actionView] );
        }
        else{
          if( actionView === "" && defaultActionView && this._views["actions"][controllerName + "/" + defaultActionView] ){
            controller.SetViewTemplate( this._views["actions"][controllerName + "/" + defaultActionView] );
          }
          else if( actionView === "" && defaultView && this._views["views"][defaultView] ){
            //Just a view.
            controller.SetViewTemplate( this._views["views"][defaultView] );
          }
          else{
            error = { code : "404" };
          }
        }
      }
      else{
        //Must not have a view//
      }
    }
    else{
      //Method not found 404//
      error = { code : "404" };
    }
    
    if( error === null ){
      return controller[methodName]( contentBuffer, viewHelper );
    }
    else{
      console.log( "Error: " );
      console.log( error );
      
      return false;
    }
    
    return false;
    
  }
  
  GetLayout( layoutName ){
    return this.GetViewByType( layoutName, "layouts" );
  }
  
  GetPartial( partialName, searchSharedHost = true, searchHostSharedModule = true, searchLocalModule = true ){
    return this.GetViewByType( partialName.toLowerCase(), "partials", searchSharedHost, searchHostSharedModule, searchLocalModule );
  }
  
  GetView( viewName ){
    let view = null;
    view = this._views["views"][viewName] || null;
    return view;
  }
  
  GetViewByType( viewName, viewType, searchSharedHost = true, searchHostSharedModule = true, searchLocalModule = true ){
    //try to get layout for this module.
    let view = null;
    if( searchLocalModule ){
      view = this._views[viewType][viewName] || null;
    }
    //Try to get module shared
    if( searchHostSharedModule && view === null && this._moduleName !== "Shared" && this._host.GetModule( "shared" ) !== null ){
      view = this._host.GetModule( "shared" ).GetViewByType( viewName, viewType );
    }
    //Try to get from shared/shared/views
    if( searchSharedHost && view === null && this._moduleName !== "Shared" && this._host.manager.PullHost( "shared" ) !== null && this._host.manager.PullHost( "shared" ).GetModule( "shared" ) !== null ){
      view = this._host.manager.PullHost( "shared" ).GetModule( "shared" ).GetViewByType( viewName, viewType );
    }
    
    return view;
  }
  
  BindEvents( ){
    
  }
  
  _InitModels(){
    this._modelDirectory = this._moduleDirectory + "/Models/";
    let modelBase = this._coreLibrary.AddLib( "base/model/Mongo", null, this._modelDirectory, this._RebuildModelBase.bind( this ) );
    if( modelBase !== null ){
      this._RebuildModelBase();
    }
  }
  
  _RebuildModelBase( libObject ){
    let modelLib = this._coreLibrary.GetPathListener( this._modelDirectory );
    this._coreLibrary.AddPathListener( this._modelDirectory, "*", null, this._AddModelListener.bind( this ), -1 );
    if( modelLib !== null ){
      for( let model in modelLib.libs ){
        this._coreLibrary.ForceRecompile( this._modelDirectory, model );
      }
    }
  }
  
  _AddModelListener( pathObject, libObject ){
    let modelPath = libObject.path.replace( this._modelDirectory, "" ).replace( ".es.js", "" ).toLowerCase();
    this._models[modelPath] = new libObject.uncompiled( this._server.database, this );
  }
  
  _InitViews(){
    this._viewDirectory = this._moduleDirectory + "/Views/";
    let viewLib = this._coreLibrary.GetPathListener( this._viewDirectory );
    this._coreLibrary.AddPathListener( this._viewDirectory, "*", null, this._AddViewListener.bind( this ), -1, false, ".js.html" );
    if( viewLib !== null ){
      for( let view in viewLib.libs ){
        this._coreLibrary.ForceRecompile( this._viewDirectory, view );
      }
    }
  }
  
  _AddViewListener( pathObject, libObject ){
    let viewName = libObject.path.replace( this._viewDirectory, "" ).replace( ".js.html", "" ).toLowerCase();
    let viewChain = viewName.substr( 0, viewName.indexOf( "/" ) );
    viewName = viewName.replace( viewChain + "/", "" );
    this._views[viewChain][viewName] = ejs.compile( libObject.data );
  }
  
  get defaultRoutes(){
    return {
      controller : this._defaultController,
      actionView : this._defaultActionView,
      event : this._defaultEvent
    }
  }
  
}