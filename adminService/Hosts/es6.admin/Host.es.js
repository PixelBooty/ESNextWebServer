export class Host extends wsinclude( "base/HostBase" ){
  SetupHost( ) {
    this._defaultModule = "admin";
    if( process.config.adminHost ){
      this._AddAllowedHost( process.config.adminHost, "production", this );
    }
  }
  
}
