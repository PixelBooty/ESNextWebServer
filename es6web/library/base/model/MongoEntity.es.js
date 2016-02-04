export class MongoEntity{
  constructor(database, module) {
    this._db = database;
  }

  get _collection(){ }

  Find( selector = {}, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).find( selector, options ).toArray( ( err, results ) => {
        if( !err ) {
          resolve( results );
        }
        else {
          reject( err );
        }
      } );
    });
  }

  Count( selector = {}, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).count( selector, options, ( err, count ) => {
        if( !err ) {
          resolve( count );
        }
        else {
          reject( err );
        }
      } );
    } );
  }

  FindOne( selector = null, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).findOne( selector, options, ( err, result ) => {
        if( !err ) {
          resolve( result );
        }
        else {
          reject( err );
        }
      });
    });
  }

  Insert( document, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).insert( document, options, ( err, result ) => {
        if( !err ) {
          resolve( result[0] );
        }
        else {
          reject( err );
        }
      });
    });
  }

  Remove( selector, justone = true ){
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).remove( selector, justone, ( err, numberOfRemovedDocs ) => {
        if( !err ){
          resolve( numberOfRemovedDocs );
        }
        else{
          reject( err );
        }
      } );
    });
  }

  Drop( errorOnNotFound = false ){
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).drop( ( err, reply ) => {
        if( !err || ( err.message === "ns not found" && !errorOnNotFound ) ){
          resolve( reply );
        }
        else{
          reject( err );
        }
      });
    });
  }

  /**
   * Updates a the mongo collection, awaitable.
   * @param object selector - The mongo selector.
   * @param object document - The mongo document.
   * @param object options - The mongo options for the update query.
   */
  Update( selector, document, options = {} ) {
    return new Promise( ( resolve, reject ) => {
      this._db.collection( this._collection ).update( selector, document, options, ( err, result ) => {
        if( !err ) {
          resolve( result );
        }
        else {
          reject(err);
        }
      });
    } );
  }
}
