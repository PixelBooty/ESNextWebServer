/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

export class Header{
  constructor( defaultCode, defaultContentType ){
    this.code = defaultCode;
    this.contentType = defaultContentType;
    this.contentLength = null;
    this.headerAddons = {};
    this._cookies = {};
    this._redirect = "";
  }
  
  Write( response ){
    let headerObject = {};
    if( this._redirect === "" ){
      headerObject['Content-Type'] = this.contentType;
      if( this.contentLength !== null ){
        headerObject['Content-Length'] = this.contentLength;
      }
      for( let headerParam in this.headerAddons ){
        headerObject[headerParam] = this.headerAddons[headerParam];
      }

      //This needs to be more secure.
      headerObject["Access-Control-Allow-Origin"] = "*";
      let cookieOutput = [];
      for( let cookieName in this._cookies ){
        cookieOutput.push( cookieName + "=" + this._cookies[cookieName] ); 
      }
      if( cookieOutput.length > 0 ){
        headerObject["Set-Cookie"] = cookieOutput.join( ";" );
      }
    }
    else{
      headerObject["Location"] = this._redirect;
    }
    response.writeHead( this.code, headerObject );
  }
  
  SetContentLength( length ){
    this.contentLength = length + "";
  }
  
  Redirect( location ){
    this._isRedirect = true;
    this.code = 302;
    this._redirect = location;
  }
  
  AddCookie( cookieName, cookieValue ){
    this._cookies[cookieName] = cookieValue;
  }
  
  SetMimeType( fileType, fileName ){
    switch( fileType ){
      case "png":
        this.contentType = "image/png";
        this.headerAddons["Cache-Control"] = "public, max-age=31536000";
        break;
      case "js":
        this.contentType = "text/javascript";
        this.headerAddons["Cache-Control"] = "public, max-age=31536000";
        break;
      case "less":
      case "css":
        this.contentType = "text/css";
        this.headerAddons["Cache-Control"] = "public, max-age=31536000";
        break;
      case "jpg":
      case "jpeg":
        this.contentType = "image/jpg";
        this.headerAddons["Cache-Control"] = "public, max-age=31536000";
        break;
      default:
        this.contentType = "application/octet-stream";
        this.headerAddons['Content-Description'] = "File Transfer";
        this.headerAddons['Content-Disposition'] = "attachment; filename=" + fileName.split( "/" )[fileName.split( "/" ).length - 1];
        this.headerAddons['Content-Transfer-Encoding'] = "binary";
        this.headerAddons['Connection'] = "Keep-Alive";
        this.headerAddons['Expires'] = "0";
        this.headerAddons['Cache-Control'] = "must-revalidate, post-check=0, pre-check=0";
        this.headerAddons['Pragma'] = "public";
        break;
    }
  }
}
