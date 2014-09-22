/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

let uid = require( "node-uuid" );

export class Connection{
  constructor( request ){
    this._id = uid.v4();
  }
  
  get id(){
    return this._id;
  }
  
  SetHeader( header ){
    header.AddCookie( "es6coid", this._id );
  }
}