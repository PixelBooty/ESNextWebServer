/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


export class ControllerBase{
  constructor( module, router, contentBuffer ){
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

  SetViewTemplate( viewTemplate ){
    this._viewTemplate = viewTemplate;
  }

  SetLayoutTemplate( layoutTemplate ){
    this._layoutTemplate = layoutTemplate;
  }

  get view(){
    return this._viewTemplate;
  }

  get layout(){
    return this._layoutTemplate;
  }

  Write( writeString ){
    this.output += writeString;
  }

  WriteJson( jsonObject ){
    this.output += JSON.stringify( jsonObject ) + "\n";
  }

}
