import { Connection } from "./Connection.es.js";

export class ConnectionManager{
  constructor( webserver ){
    this._server = webserver;
    this._connectionsIndex = {};
  }
  
  GetConnection( request ){
    let connection = null;
    if( !request.cookies.es6coid || !this._connectionsIndex[request.cookies.es6coid] ){
      connection = new Connection( request );
      this._connectionsIndex[connection.id] = connection;
    }
    else{
      connection = this._connectionsIndex[request.cookies.es6coid];
    }
    return connection;
  }
}