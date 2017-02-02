exports.MassiveEntity = class MassiveEntity extends Object{
  constructor( database, module) {
    super();
    this._db = database;
    this._AssureCollection();
  }

  get _document() {
    return this._collection.toLowerCase();
  }

  get type() {
    return "json";
  }

  async _AssureCollection() {
    if (this._db[this._document] === undefined) {
      if (this.type == "json") {
        this._db.saveDoc(this._document, { temp : "temp" }, (err, document) => {
          this._db.run("DELETE FROM " + this._document + " WHERE id=$1", [document.id], (error, result) => {
          } );
        } );
      }
      else if( this.type == "sql" ) {
        let creationMap = [];
        for( let field in this.sqlStructure ) {
          creationMap.push( field + " " + this.sqlStructure[field] );
        }
        this._db.run( "CREATE TABLE " + this._document + " ( id SERIAL PRIMARY KEY, " + creationMap.join( "," ) + " );" );
      }
    }
  }

  get sqlStructure() { return {} };

  get _collection(){ }

  Find(selector = {}) {
    return new Promise((resolve, reject) => {
      if (this.type == "json") {
        if (Object.keys(selector).length == 0) {

        }
        else {
          this._db[this._document].findDoc(selector, options).toArray((err, results) => {
            if (!err) {
              resolve(results);
            }
            else {
              reject(err);
            }
          } );
        }
      }
      else if( this.type == "sql" ) {

      }
    });
  }
}
