/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

import { Header } from "./Header.es.js";
import { ViewHelper } from "./ViewHelper.es.js";

let fs = require( "fs" );
let less = require( "less" );

export class ContentBuffer{
  constructor( webserver, service, host, router, response, serviceConfig ) {
    this._server = webserver;
    this.host = host;
    this.router = router;
    this.service = service;
    this.response = response;
    this.header = new Header( 200, "text/html" );
    this._controller = null;
    this.connection = null;
    this.get = router.get;
    this.post = router.post;
    this._content = "";
    
    if( this.router.isFile ){
      let extType = this.router.file.substr( this.router.file.lastIndexOf( "." ) + 1 ).toLowerCase();
      this.header.SetMimeType( extType, this.router.file );
      //Load and send file.
      fs.readFile( this.router.file, {}, ( error, data ) => {
        if( !error ){
          if( extType === "less" ){
            data = data.toString();
            less.render(data, (e, css) => {
              this._content = css;
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
    else{
      this.connection = this._server.connection.GetConnection( router.request );
      //Modual
      this.module = router.module;

      //Controller events/view/action
      
      this.module.BindEvents( this );
      this._controller = new this.router.controller( this.module, this.router, this );
      this._viewHelper = new ViewHelper( this.module, this._controller, this, serviceConfig );
      let timeout = this.module.timeout || 1000;
      this._viewControlTimeout = setTimeout( this._ViewControlTimeoutMethod.bind( this ), timeout );
      this._controller.InitControl( this, this._viewHelper );
      if( !this.response.finished ){
        this.module.DoAction( this, this._viewHelper );
      }
    }
  }
  
  get controller(){
    return this._controller;
  }
  
  Redirect( location ){
    clearTimeout( this._viewControlTimeout );
    this.header.Redirect( location );
    this.header.Write( this.response );
    this.response.end();
  }
  
  Render(){
    clearTimeout( this._viewControlTimeout );
    if( this._content === "" ){
      this._content = this._viewHelper.Render();
    }
    this._ShowContent();
  }
  
  Write( writeString ){
    this._content += writeString;
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
