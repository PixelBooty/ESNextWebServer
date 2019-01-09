/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let Header = dynamic( "./Header" ).Header;
let ViewHelper = dynamic( "./ViewHelper" ).ViewHelper;

let fs = require( "fs" );
let less = require( "less" );
let htmlMinify = require('html-minifier').minify;

exports.ContentBuffer = class ContentBuffer extends Object{
  constructor( webserver, service, router, response, serviceConfig ) {
    super();
    this._server = webserver;
    this.router = router;
    this.service = service;
    this.response = response;
    this.header = new Header( 200, "text/html" );
    this._controller = null;
    this._api = null;
    this.connection = null;
    this.get = router.get;
    this.post = router.post;
    this.requestData = router.requestData;
    this.params = router.params;
    this._content = "";
    this.actionMethod = "";
    this.method = router.method;
    this.uri = router.request.url;
    this.requestHeader = router.request.headers;

    if( this.router.isFile ){
      let extType = this.router.file.fileName.substr( this.router.file.fileName.lastIndexOf( "." ) + 1 ).toLowerCase();
      this.header.SetMimeType( extType, this.router.file.fileName );
      if( this.router.request.headers["if-none-match"] === this.router.file.eTag ){
        this.header.code = 304;
        this._ShowContent();
      }
      else{
        //Load and send file.
        fs.readFile( this.router.file.fileName, {}, ( error, data ) => {
          if( !error ){
            this.header.SetETag( this.router.file.eTag );
            if( extType === "less" ){
              data = data.toString();
              less.render(data, (e, css) => {
                this._content = css.css;
                this._ShowContent();
              } );
            }
            else{
              this._content = data;
              this._ShowContent();
            }
          }
          else{
            this._content = "500 file error " + error;
            this._ShowContent();
          }
        } );
      }
    }
    else{

      if( !router.errors ){
        this.connection = this._server.connectionManager.GetConnection( router.request );
        //Modual
        this.module = router.module;

        //Controller events/view/action

        this.module.BindEvents( this );

        if( this.router.controller ){
          this._controller = new this.router.controller( this.module, this.router, this );
          this._viewHelper = new ViewHelper( this.module, this._controller, this, serviceConfig );
          let timeout = this.module.timeout || 1000;
          this._viewControlTimeout = setTimeout(this._ViewControlTimeoutMethod.bind(this), timeout);
          this.RunPage();
        }
        else if( this.router.api ){
          this._api = new this.router.api( this.module, this.router, this );
          let timeout = this.module.timeout || 1000;
          this._viewControlTimeout = setTimeout(this._ViewControlTimeoutMethod.bind(this), timeout);
          this.RunApi();
        }
        
      }
      else{
        this._content = "504 route error, this has been recorded in the log."
        console.error( router.errors );
        this._ShowContent();
      }
    }
  }

  ParamList( paramNames ){
    let object = {};
    paramNames.forEach( ( x, index ) => object[x] = this.params[index] );
    return object;
  }

  async RunApi(){
    let method = this.router.method;
    this.header.contentType = "application/json";
    let executionMethod = null;
    const initContent = await this._api.InitApi(this);
    if( initContent && initContent instanceof Object ){
      this.WriteJson( initContent );
    }
    switch( method ){
      case "get":
        executionMethod = "Get";
        break;
      case "post":
        executionMethod = "Post";
        break;
      case "patch":
        executionMethod = "Patch";
        break;
      case "put":
        executionMethod = "Put";
        break;
      case "delete":
        executionMethod = "Delete";
        break;
      break;
      default:
        this.header.code = 404;
        this.WriteJson( { "error" : "Method '" + method.toUpperCase() + "' not found" } );
      break;
    }

    if( executionMethod !== null && this._content === "" ){
      let content = await this._api[executionMethod](this);
      if( !(content instanceof Object ) && !(content instanceof Array) ){
        this.WriteJson( { warning : "Content type unexpected", content } );
      }
      else{
        if( content instanceof Object && content.code ){
          this.header.code = content.code;
        }

        this.WriteJson( content );
      }
    }

    this.Render();
  }

  async RunPage() {
    this.viewActionMethod = this.module.GetAction(this);
    if( typeof( this.viewActionMethod ) === "object" && this.viewActionMethod.error !== undefined ){
      this.header.code = 500;
      if (this.connection) {
        this.connection.SetHeader(this.header);
      }
      this.header.Write(this.response);
      this.response.end( "500 Error with page '" + JSON.stringify( this.viewActionMethod.error ) + "'" );
    }
    else{
      this.isAction = this.viewActionMethod.endsWith( "Action" );
      let continueRunning = await this._controller.InitControl(this, this._viewHelper);
      if( continueRunning !== false && !this.response.finished ) {
        try {
          await this._controller[this.viewActionMethod]( this, this._viewHelper );
          if (!this.response.finished) {
            this.Render();
          }
        }
        catch( ex ) {
          this.header.code = 500;
          if (this.connection) {
            this.connection.SetHeader(this.header);
          }
          this.header.Write(this.response);
          this.response.end( "500 Error with page '" + ex.message + "'" );
        }

      }
    }

  }

  get controller(){
    return this._controller;
  }

  get output(){
    return this._content;
  }

  Redirect( location ){
    clearTimeout( this._viewControlTimeout );
    this.header.Redirect( location );
    this.header.Write( this.response );
    this.response.end();
  }

  Render( renderTemplate = false ){
    clearTimeout( this._viewControlTimeout );

    if( this._viewHelper && ( this._content === "" || renderTemplate === true ) ){
      this._content = htmlMinify(this._viewHelper.Render(), {
        minifyJS : false,
        removeComments : true,
        removeCommentsFromCDATA : true,
        collapseWhitespace : true
      });
    }
    this._ShowContent();
  }

  Write( writeString ){
    this._content += writeString;
  }

  SetContent( contentBuffer ){
    this._content = contentBuffer;
  }

  WriteJson( jsonObject ){
    this.Write( JSON.stringify( jsonObject ) );
  }

  _ViewControlTimeoutMethod(){
    this._content = "Controller method timed out.";
    this._ShowContent();
  }

  _ShowContent(){
    if( this.connection ){
      this.connection.SetHeader( this.header );
    }
    this.header.Write( this.response );
    this.response.end(this._content);
  }
}
