
export class ViewHelper{
  constructor( module, controller, contentBuffer, serverConfig ){
    this.module = module;
    this.controller = controller;
    this.buffer = contentBuffer;
    this._pageTitle = "Webpage";
    this._scripts = [];
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
      config : serverConfig
    };
  }
  
  Render( ){
    this._viewBag.require = this._RenderPartial.bind( this );
    this._viewBag.controller = this.controller;
    this._viewBag.buffer = this.contentBuffer;
    this._viewBag.module = this.module;
    this._viewBag.get = this.buffer.router.get;
    this._viewBag.post = this.buffer.router.post;
    this._viewBag.connection = this.buffer.connection;
    this._viewBag.isset = this._ViewBagHas.bind( this );
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
  
  _RenderPartial( partialName, searchSharedHost = true, searchHostSharedModule = true, searchLocalModule = true ){
    let partial = this.module.GetPartial( partialName, searchSharedHost, searchHostSharedModule, searchLocalModule );
    if( partial !== null ){
      return partial( this._viewBag );
    }
    
    return "Server Error: partial not found " + partialName;
  }
  
  _GenerateMetaData( ){
    return "";
  }
  
  _GenerateScriptData( scriptName = null, scriptAttributes = null ){
    if( scriptName !== null ){
      scriptAttributes.src = scriptName;
      this._scripts.push( scriptAttributes );
    }
    else{
      let scripts = [];
      for( let s = 0; s < this._scripts.length; s++ ){
        let scriptAttr = [];
        for( let attribute in this._scripts[s] ){
          scriptAttr.push( attribute + '="' + this._scripts[s][attribute] + '"' );
        }
        scripts.push( "<script " + scriptAttr.join( " " ) + "></script>" );
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
