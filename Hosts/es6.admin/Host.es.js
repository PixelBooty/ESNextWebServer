/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

let BaseHost = process.__server.baseHost;

export class Host extends BaseHost{
  constructor( ) {
    this._defaultModule = "admin";
	if( process.config.adminHost ){
      this._AddAllowedHost( process.config.adminHost, "production", this );
	}
  }
  
}
