let fs = require( "fs" );
let dir = require( "path" );
let readline = require('readline');

class ReadInput{
  constructor(){
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  _Question( question ){
    return new Promise( ( resolve, reject ) => {
      this.rl.question( question + "\n", ( answer ) => {
        resolve( answer );
      } );
    });
  }

  async Question( question ){
    let answer = "";
    while( answer === "" ){
      answer = await this._Question( question );
    }
    return answer;
  }

  async RequestQuestion( question, allowAnswers ){
    let answer = "";
    while( allowAnswers.indexOf( answer ) === -1 ){
      answer = await this.Question( question );
    }
    return answer;
  }

  async RegexQuestion( question, regex ){

  }

  _PrepFile( fileName, options ){
    return fs.readFileSync( fileName ).toString().replace( "//<!OPTIONS!>//", options );
  }

  _PrepDir( dirName ){
    if( !fs.existsSync( dirName ) ){
      fs.mkdirSync( dirName );
    }
  }

  _WriteEsJs( dirName, file, scaffoldingFile, options ){
    if( options.length > 0 ){
      options.push( '' );
      options.push( '' );
    }
    options = options.join( "\n    " );
    this._PrepDir( dirName );
    let scaffoldingContents = this._PrepFile( this._scaffoldingDir + "/" + scaffoldingFile + ".es.js", options );
    if( scaffoldingFile === "Controller" || scaffoldingFile === "Model" ){
      scaffoldingContents = scaffoldingContents.replace( "export class " + scaffoldingFile, "export class " + file );
    }
    fs.writeFileSync( dirName + "/" + file + ".es.js", scaffoldingContents );
  }

  async _HelloWorldScaffolding(){
    let path = await this.Question( "Enter path for hello world service relative to (" + process.cwd() + ")" );
    console.log( "Mocking hello world service in " + path );
    this._WriteEsJs( path, "Service", "Service", [] );
    this._PrepDir( path + "/Hosts" );
    this._WriteEsJs( path + "/Hosts/hello-world", "Host", "Host", [
      'this._defaultModule = "Hello";',
      'this._AddAllowedHost("localhost", "development" );',
      'this._AddAllowedHost("127.0.0.1", "development" );'
    ] );
    this._PrepDir( path + "/Hosts/hello-world/Modules" );
    this._PrepDir( path + "/Hosts/hello-world/public" );
    this._WriteEsJs( path + "/Hosts/hello-world/Modules/Hello", "Module", "Module", [
      'this._defaultController = "helloworld";',
      'this._defaultAction = "hello";',
      'this._defaultView = null;',
      'this._defaultActionView = null;',
      'this._defaultEvent = "";',
      'this._defaultLayout = "main";'
    ] );
    this._WriteEsJs( path + "/Hosts/hello-world/Modules/Hello/Controllers", "HelloWorld", "Controller", [
      'async HelloAction( content, helper ){ content.Write( "Hello World." ); }'
    ] );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Models" );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Views" );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Views/Layouts" );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Views/Actions" );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Views/Actions/HelloWorld" );
    this._PrepDir( path + "/Hosts/hello-world/Modules/Hello/Views/Patials" );
  }

  async _ServiceScaffolding(){
    let path = await this.Question( "Enter the path for your new service relative to (" + process.cwd() + ")" );
    let firstHost = await this.Question( "Enter name for first host on service" );
    let firstHostPath = await this.Question( "Enter host that will point to " + firstHost + " e.g. 'localhost'" );
    let firstModule = await this.Question( "Enter name of hosts default and first module e.g. 'Site'" );
    let firstController = await this.Question( "Enter name of the default and first controller for " + firstModule + " e.g. 'View'" );
    console.log( "Scaffolding new service in " + path );
    this._WriteEsJs( path, "Service", "Service", [] );
    this._WriteEsJs( path + "/" + firstHost, "Host", "Host", [
      'this._defaultModule = "' + firstModule + '";',
      'this._AddAllowedHost("' + firstHostPath + '", "development" );'
    ] );
  }

  async Run(){
    try{
      this._scaffoldingDir = dir.dirname( __dirname ) + "/ServiceScaffolding";
      let action = await this.RequestQuestion( "What would you like to add:\n(w)Hello World Example Service, (s)Service", [ //, (h)Host, (m)Module, (c)Controller, (o)Model, (v)View", [
        "w", "s"//, "h", "m", "c", "o", "v"
      ]);
      switch( action ){
        case "w":
          await this._HelloWorldScaffolding();
          break;
        case "s":
          await this._ServiceScaffolding();
          break;
        /*case "h":
          break;
        case "m":
          break;
        case "c":
          break;
        case "o":
          break;
        case "v":
          break;*/
      }

      console.log( "Done" );
      process.exit();
    }
    catch( ex ){
      console.error( "Error creating scaffolding" );
      console.log( ex );
      process.exit();
    }
  }
}

let read = new ReadInput();
console.log( "ESNEXTWebServer Scaffolding builder." );
read.Run();
