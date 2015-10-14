let fs = require("fs");
let imageSize = require("imagesize");

/**
 * Helper class in dealing with post request files.
 */
export class PostFile{
  /**
   * Constructor of PostFile
   * @param object fileData - The file data from the post request.
   */
  constructor( fileData ) {
    this.type = fileData.headers['content-type'];
    this.rawData = fileData;
  }

  /**
   * Checks to see if the file is an image.
   * @returns bool - Is the file an image based on the mime type?
   */
  IsImage() {
    if (this.type === "image/png" || this.type === "image/jpg" || this.type === "image/jpeg" || this.type === "image/gif") {
      return true;
    }
    return false;
  }

  /**
   * Gets the image size stats of the file using imageSize npm.
   * @returns object - awaitable image size object { type, width, height }
   */
  async GetImageSize() {
    return new Promise( ( resolve, reject ) => {
      if ( this.IsImage() ) {
        var rd = fs.createReadStream(this.rawData.path);
        imageSize( rd, ( err, result ) => {
          if( err ) {
            reject( err );
          }
          else {
            resolve( result );
          }
        } );
      }
      else {
        reject( { "message" : "Not an image" } );
      }
    } );
  }

  /**
   * Checks a path piece by piece to see if it needs to be created.
   * @param string directoryPath - Path to check if any part needs to be created and creates it.
   */
  async ValidateDirectory( directoryPath ) {
    let directoryStructure = directoryPath.split("/");
    let testPath = directoryStructure[0];
    for (let i = 1; i < directoryStructure.length; i++) {
      await this._TestAndCreateDirectory(testPath);
      testPath += "/" + directoryStructure[i];
    }
  }

  /**
   * Awaitable testing to see if a directory exists, if not it is created.
   * @param string dirPath - Path to see if it is a directory and exists.
   */
  _TestAndCreateDirectory( dirPath ) {
    return new Promise((resolve, reject) => {
      fs.exists( dirPath, ( exists ) => {
        if( exists ) {
          fs.stat( dirPath, ( err, stats ) => {
            if( stats.isDirectory() ) {
              resolve();
            }
            else {
              reject( { "message" : "Not a directory" } );
            }
          });
        }
        else {
          fs.mkdir(dirPath, (err) => {
            if( err ) {
              reject( err );
            }
            else {
              resolve();
            }
          } );;
        }
      } );
    });
  }

  /*
   * Gets the extention from the mime type.
   * @returns string - Extention based on the mime type.
   */
  GetExtention( ) {
    switch( this.type ) {
      case "image/png":
        return "png";
        break;
      case "image/jpeg":
      case "image/jpg":
        return "jpg";
        break;
      case "image/gif":
        return "gif";
        break;
      default:
        return "file";
        break;
    }
  }

  /**
   * Awaitable copy of the temp file.
   * @param string copyToPath - Path that will be used for the new file.
   * @param string fileName[optional] - The name of the file to be created. Defaults to the name of the file that was uploaded.
   * @param string extention[optional] - The extention of the file to be created. Defaults to mime type translation.
   */
  _CopyTempFile(copyToPath, fileName = null, extention = null ) {
    return new Promise((resolve, reject) => {
      extention = extention || this.GetExtention();
      var cbCalled = false;
    
      if (fileName === null) {
        fileName = this.rawData.originalFilename;
      }
      var rd = fs.createReadStream(this.rawData.path);
      rd.on("error", function (err) {
        done(err);
      });
      var wr = fs.createWriteStream(copyToPath + "/" + fileName + "." + extention );
      wr.on("error", function (err) {
        done(err);
      });
      wr.on("close", function (ex) {
        done();
      });
      rd.pipe(wr);
    
      function done(err) {
        if (!cbCalled) {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
          cbCalled = true;
        }
      }
    } );
  }

  /**
   * Async method to copy the file from the temp path to a new path.
   * @param string copyToPath - Path that will be used for the new file.
   * @param string fileName[optional] - The name of the file to be created. Defaults to the name of the file that was uploaded.
   * @param string extention[optional] - The extention of the file to be created. Defaults to mime type translation.
   */
  async CopyTemp( copyToPath, fileName = null, extention = null ) {
    await this.ValidateDirectory( copyToPath + "/" + fileName );
    await this._CopyTempFile( copyToPath, fileName );
  }
}