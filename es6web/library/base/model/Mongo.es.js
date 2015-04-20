let ObjectId = require('mongodb').ObjectID;

export class Mongo{
  constructor( database, module ){
    this._db = database;
    this._module = module;
    this._indexMaps = [ "_id" ];
    this._forceTypes = [];
    this._sort = {};
    this._SetupModel();
    if( this._collectionName ){
      this._collection = this._db.collection( this._collectionName );
    }
    this.CreateDBIndex();
  }
  
  _SetupModel(){}
  _PostIndex(){ }
  
  CreateDBIndex( callback = null ){
    this._data = [];
    this._indexes = {};
    if( this._collectionName ){
      this._collection.find( {} ).sort( this._sort ).toArray( ( error, items ) => {
        this._data = items;
        this._GenerateIndexes();
        if( callback != null ){
          callback();
        }
      });
    }
  }
  
  _GenerateIndexes(){
    for( let imap = 0; imap < this._indexMaps.length; imap++ ){
      var indexName = this._indexMaps[imap];
      if( indexName[0] === "~" ){
        indexName = indexName.substring( 1 );
      }
      this._indexes[indexName] = {};
      for( let cdata = 0; cdata < this._data.length; cdata++ ){
        this._indexes[indexName][this._data[cdata][indexName]] = this._data[cdata];
      }
    }
    this._PostIndex();
  }
  
  GetIndex( indexType, indexValue ){
    return this._indexes[indexType][indexValue] || null;
  }
  
  Insert( insertData, callback ){
    for( let i = 0; i < this._indexMaps.length; i++ ){
      if( this._indexMaps[i][0] !== "~" &&  insertData[this._indexMaps[i]] ){
        insertData[this._indexMaps[i]] = this._ChangeDataType( "index", insertData[this._indexMaps[i]] );
      }
    }
    
    for( let type in this._forceTypes ){
      if( insertData[type] !== undefined ){
        if( this._forceTypes[type].StartsWith( "array" ) ){
          var preData = insertData[type];
          if( typeof( preData )  === "string" ){
            preData = [ preData ];
          }
          var dataSet = [];
          for( let di = 0; di < preData.length; di++ ){
            dataSet.push( this._ChangeDataType( this._forceTypes[type].split( ":" )[1], preData[di] ) );
          }
          insertData[type] = dataSet;
        }
        else{
          insertData[type] = this._ChangeDataType( this._forceTypes[type], insertData[type] );
        }
      }
    }
    
    this._collection.insert( insertData, ( error, doc ) => {
      this.CreateDBIndex( () => {
        callback( doc[0]._id, error );
      });
    });
  }
  
  Remove( whereClause, callback ){
    if( whereClause["_id"] ){
      whereClause["_id"] = ObjectId( whereClause["_id"] );
    }
    this._collection.remove( whereClause, {}, ( error ) => {
      this.CreateDBIndex( () => {
        callback( error );
      } );
    });
  }
  
  get data(){
    return this._data;
  }
  
  Update( whereClause, data, callback ){
    if( whereClause["_id"] ){
      whereClause["_id"] = this._ChangeDataType( "index", whereClause["_id"] );
    }
    
    if( data["_id"] ){
      delete data["_id"];
    }
    for( let i = 0; i < this._indexMaps.length; i++ ){
      if( this._indexMaps[i][0] !== "~" && data['$set'] !== undefined && data['$set'][this._indexMaps[i]] ){
        data['$set'][this._indexMaps[i]] = this._ChangeDataType( "index", data['$set'][this._indexMaps[i]] );
      }
    }
    for( let type in this._forceTypes ){
      if( data['$set'] !== undefined && data['$set'][type] !== undefined ){
        if( this._forceTypes[type].StartsWith( "array" ) ){
          var preData = data['$set'][type];
          if( typeof( preData )  === "string" ){
            preData = [ preData ];
          }
          var dataSet = [];
          for( let di = 0; di < preData.length; di++ ){
            dataSet.push( this._ChangeDataType( this._forceTypes[type].split( ":" )[1], preData[di] ) );
          }
          data['$set'][type] = dataSet;
        }
        else{
          data['$set'][type] = this._ChangeDataType( this._forceTypes[type], data['$set'][type] );
        }
      }
    }
    this._collection.update( whereClause, data, ( error ) => {
      this.CreateDBIndex( () => {
        callback( error );
      } );
    });
  }
  
  _ChangeDataType( newType, data ){
    switch( newType ){
      case "index":
        return ObjectId( data );
        break;
      case "number":
        return parseInt( data );
        break;
    }
  }
  
  GenerateSelectIndex( valueIndex, textIndex = null ){
    let data = this.data;
    if( textIndex === null ){
      textIndex = valueIndex;
    }
    let selectIndex = {};
    for( let i = 0; i < data.length; i++ ){
      selectIndex[data[i][textIndex]] = data[i][valueIndex];
    }

    let indexKeys = [];
    for( let key in selectIndex ){
      indexKeys.push( key );
    }
    indexKeys.sort();
    var sortedSelectIndex = {};
    for( let i = 0; i < indexKeys.length; i++ ){
      sortedSelectIndex[selectIndex[indexKeys[i]]] = indexKeys[i];
    }
    
    return sortedSelectIndex;
  }
  
}
