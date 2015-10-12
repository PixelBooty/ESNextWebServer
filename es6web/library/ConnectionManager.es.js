import { Connection } from "./Connection.es.js";

export class ConnectionManager{
  constructor( webserver ){
    this._server = webserver;
    this._connectionsIndex = {};
  }
  
  GetConnection( request ){
    let connection = null;
    if( !request.cookies.es6coid ){
      connection = new Connection( request );
      this._connectionsIndex[connection.id] = connection;
    }
    else{
      //|| 
      if( request.cookies.es6coid.push ) {
        //TODO check why spoof attempt.... TODOSECURE
        //TODO PRELAUNCH
        for( let i = 0; i < request.cookies.es6coid.length; i++ ) {
          if(this._connectionsIndex[request.cookies.es6coid[i]] ) {
            connection = this._connectionsIndex[request.cookies.es6coid[i]];
          }
        }
        if( connection == null ){
          connection = new Connection(request);
          this._connectionsIndex[connection.id] = connection;
        }
      }
      else if( this._connectionsIndex[request.cookies.es6coid] ) {
        connection = this._connectionsIndex[request.cookies.es6coid];
      }
      else {
        connection = new Connection(request);
        this._connectionsIndex[connection.id] = connection;
      }
      
    }
    return connection;
  }
}