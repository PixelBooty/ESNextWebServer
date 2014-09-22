/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let BaseHost = process.__server.baseHost;

export class Host extends BaseHost{
  constructor( ) {
    this._defaultModule = "site";
    this._AddAllowedHost( "example.dev", "development", this );
  }
  
}
