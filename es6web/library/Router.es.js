/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let qs = require('querystring');

export class Router{
  constructor( request ) {
    this._request = request;
    this._url = request.url;
    let queryPoint = this._url.indexOf( "?" );
    if( queryPoint !== -1 ){
      this._url = requestObject.url.substring( 0, queryPoint ).replace( /\/\//gi, "/" );
      this._get = qs.parse( requestObject.url.substring( queryPoint + 1 ) );
    }
    else{
      this.get = {};
    }
    
    this._BuildRoute();
  }
  
  _BuildRoute(){
    let urlRoute = this._url;
    if( this._url.substr( 0, 1 ) == "/" ){
      urlRoute = this._url.substr( 1 );
    }
    console.log( urlRoute );
  }
  
}