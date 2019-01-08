exports.ApiBase = class ControllerBase extends Object{
  constructor( module, router, contentBuffer ){
    super();
    this._module = module;
    this._router = router;
    this._content = contentBuffer;
  }

  _Error404( method ){
    return {
      error : "Route method '" + method + "' not found",
      code : 404
    };
  }

  InitApi( content ){

  }

  Get( content ){
    return this._Error404( "GET" );
  }

  Post( content ){
    return this._Error404( "POST" );
  }

  Patch( content ){
    return this._Error404( "PATCH" );
  }

  Put( content ){
    return this._Error404( "PUT" );
  }

  Delete( content ){
    return this._Error404( "DELETE" );
  }

}