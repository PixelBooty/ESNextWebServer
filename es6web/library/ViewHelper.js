
exports.ViewHelper = class ViewHelper extends Object{
  constructor( module, controller, contentBuffer, serverConfig ){
    super();
    this.module = module;
    this.controller = controller;
    this.buffer = contentBuffer;
    this._pageTitle = "Webpage";
    this._scripts = [];
    this._metaData = [];
    this._viewBag = this.controller.viewBag;
    this._breadCrumbs = { "Home" : "/" };
    this._viewContent = "";
    this._viewBag.meta = this._GenerateMetaData.bind( this );
    this._viewBag.script = this._GenerateScriptData.bind( this );
    this._viewBag.title = this._GenerateTitle.bind( this );
    this._viewBag.breadcrumbs = this._GenerateBreadCrumbs.bind( this );
    this._viewBag.encode = encodeURIComponent;
    this._viewBag.errors = [];
    let request = this.buffer.router.request;
    this._viewBag.server = {
      host : request.headers.host,
      uri : request.url,
      request : ( ( request.ssl ) ? "https://" : "http://" ) + request.headers.host + request.url,
      config : serverConfig,
      env : request.env
    };
    this._viewBag.require = this._RenderPartial.bind( this );
    this._viewBag.controller = this.controller;
    this._viewBag.buffer = this.contentBuffer;
    this._viewBag.module = this.module;
    this._viewBag.get = this.buffer.router.get;
    this._viewBag.post = this.buffer.router.post;
    this._viewBag.connection = this.buffer.connection;
    this._viewBag.isset = this._ViewBagHas.bind( this );

    //Other dule bindings
    this.require = this._RenderPartial.bind( this );
    this.meta = this._GenerateMetaData.bind( this );
    this.script = this._GenerateScriptData.bind( this );
    this.title = this._GenerateTitle.bind( this );
    this.server = this._viewBag.server;
    this.isset = this._ViewBagHas.bind( this );
    this.lib = this._viewBag.module.GetLibrary;
  }

  Render( ){
    if( this.controller.view ){
      let view = this.controller.view;
      this._viewContent = view( this._viewBag );
      if( this.controller.layout !== null ){
        this._viewBag.content = this._ShowViewContent.bind( this );
        return this.controller.layout( this._viewBag );
      }

      return this._viewContent;
    }
    else{

      if( this.controller.layout ){
         this._viewBag.content = this._ViewRenderOutputBuffer.bind( this );
         return this.controller.layout( this._viewBag );
      }
      return this.controller.output;
    }
  }

  _ViewRenderOutputBuffer(){
    return this.buffer.output;
  }


  _ViewBagHas( variableName ){
    if( this._viewBag[variableName] ){
      return true;
    }

    return false;
  }

  _RenderPartial( partialName, viewItems = null, searchLocalModule = true, searchSharedService = true ){
    let viewModuleRef = {};
    let partial = this.module.GetPartial( partialName, searchSharedService, searchLocalModule, viewModuleRef );
    if( partial !== null ){
      let localModule = this.module;
      this.module = viewModuleRef.ref;
      this._viewBag.module = viewModuleRef.ref;
      var viewBackup = {};
      if( viewItems !== null ) {
        for( let item in viewItems ) {
          if( this._viewBag[item] !== undefined ) {
            viewBackup[item] = this._viewBag[item];
          }
          this._viewBag[item] = viewItems[item];
        }
      }
      let phtml = partial( this._viewBag );
      if( viewItems !== null ) {
        for( var item in viewItems ) {
          if( viewBackup[item] !== undefined ) {
            this._viewBag[item] = viewBackup[item];
          }
          else {
            delete this._viewBag[item];
          }
        }
      }
      this._viewBag.module = localModule;
      this.module = localModule;
      return phtml;
    }

    return "Server Error: partial not found " + partialName;
  }

  _CompireAttributeData( attributes ) {
    let attrs = [];
    for( let attribute in attributes ){
      attrs.push( attribute + '="' + attributes[attribute] + '"' );
    }
    return attrs.join( " " );
  }

  _GenerateMetaData( metaData = null ){
    if( metaData !== null ) {
      this._metaData.push( metaData );
    }
    else {
      let meta = [];
      for( let m = 0; m < this._metaData.length; m++ ) {
        let metaName = this._metaData[m].name || "meta";
        delete this._metaData[m].name
        meta.push( "<" + metaName + " " + this._CompireAttributeData( this._metaData[m] ) + "/>" );
      }
      return meta.join( "\n" );
    }
  }

  _GenerateScriptData( scriptName = null, scriptAttributes = null ){
    if( scriptName !== null ){
      scriptAttributes.src = scriptName;
      this._scripts.push( scriptAttributes );
    }
    else{
      let scripts = [];
      for( let s = 0; s < this._scripts.length; s++ ){
        scripts.push( "<script " + this._CompireAttributeData( this._scripts[s] ) + "></script>" );
      }

      return scripts.join( "\n" );
    }
  }

  _GenerateBreadCrumbs( breadCrumbSettings = null ){
    if( breadCrumbSettings !== null ){
      this._breadCrumbs = breadCrumbSettings;
    }
    else{
      let breadcrumbs = [];
      for( let crumbName in this._breadCrumbs ){
        breadcrumbs.push( '<a href="' + this._breadCrumbs[crumbName] + '">' + crumbName + '</a>' );
      }
      return breadcrumbs.join( " &gt; " );
    }

  }

  _GenerateTitle( title = null ){
    if( title !== null ){
      this._pageTitle = title;
    }
    else{
      return this._pageTitle;
    }

  }

  _ShowViewContent(){
    return this._viewContent;
  }
}
