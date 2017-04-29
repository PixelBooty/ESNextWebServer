/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


exports.ControllerBase = class ControllerBase extends Object{
  constructor( module, router, contentBuffer ){
    super();
    this._module = module;
    this._router = router;
    this._content = contentBuffer;
    this._viewName = "";
    this._viewTemplate = null;
    this._layoutName = "";
    this._layoutTemplate = null;
    this.viewBag = {};
    this.output = "";
    this._SetupController();
  }

  CanBind(){

  }

  GetLibrary( libraryName ){
    return this._module.GetLibrary( libraryName );
  }

  _SetupController(){}

  InitControl(){}

  SetViewTemplate( viewTemplate, viewType = "views" ){
    this._viewTemplate = this.module.GetViewByType( viewTemplate, viewType );
  }

  SetActionTemplate( actionTemplate ){
    this.SetViewTemplate( actionTemplate, "actions" );
  }

  SetLayoutTemplate( layoutTemplate ){
    this._layoutTemplate = this.module.GetLayout( layoutTemplate );
  }

  get view(){
    return this._viewTemplate;
  }

  get layout(){
    return this._layoutTemplate;
  }

  get host(){
    return this._module.host;
  }

  get module(){
    return this._module;
  }

  get service(){
    return this._module.service;
  }

  GetModel( modelName ){
    return this._module.GetModel( modelName );
  }

  Write( writeString ){
    this.output += writeString;
  }

  WriteJson( jsonObject ){
    this.output += JSON.stringify( jsonObject ) + "\n";
  }

}
