/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let uid = require( "uuid" );

exports.Connection = class Connection extends Object{
  constructor( request ){
    super();
    this._sentCookie = false;
    if( request.cookies.es6coid ) {
      if( request.cookies.es6coid.push ) {
        this._id = request.cookies.es6coid[0];
      }
      else {
        this._id = request.cookies.es6coid;
      }
      this._sentCookie = true;
    }
    else {
      this._id = uid.v4();
    }
  }

  get id(){
    return this._id;
  }

  SetHeader( header ){
    if( !this._sentCookie ) {
      header.AddCookie( "es6coid", this._id + "; expires=Session; path=/"  );
      this._sentCookie = true;
    }

  }
}
