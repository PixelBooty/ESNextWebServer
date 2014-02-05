/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let BaseHost = process.__server.baseHost;

export class Host extends BaseHost{
  constructor( ) {
    this._AddAllowHost( "example.dev", "development" );
    this.allowedHosts = {
      
    };
    console.log( "host");
  }
  
}
