let ModuleBase = superDynamic( "./base/ModuleBase" ).ModuleBase;
exports.SiteModule = class SiteModule extends ModuleBase{
  SetDefaults( defaultController, defaultAction, defaultView, defaultActionView, defaultEvent, defaultLayout ){
    this._defaultController = defaultController;
    this._defaultAction = defaultAction;
    this._defaultView = defaultView;
    this._defaultActionView = defaultActionView;
    this._defaultEvent = defaultEvent;
    this._defaultLayout = defaultLayout;
  }
};
