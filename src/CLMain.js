
a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {config:[], appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		proto.CLMain = function(){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.']))
			if(this.getStatic().instanceCount() > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"']));
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
		}
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setConfig = function(obj){ CLMain._cl_storedCfgs.config = obj; }
		
		/**
		 * 
		 * @param {string} namespace
		 * @param {Object} obj
		 */
		proto.setPluginConfig = function(namespace, obj){ CLMain._cl_storedCfgs.pluginConfigs.push({nm:namespace, obj:obj}); }
		
		
		proto.dependenciesLoaded = function(){}
		
		/**
		 * 
		 */
		proto.pluginsLoaded = function(){}
		/**
		 * @name onlineStatusChanged
		 * @description Called by the framework when the browser's online status has changed. This is equivalent to listening for {@link a5.cl.MVC.event:ONLINE_STATUS_CHANGE}.
		 */
		proto.onlineStatusChanged = function(isOnline){}
		
		/**
		 * @name autoInstantiationComplete 
		 * @description Called by the framework when auto detected classes have been successfully instantiated.
		 */
		proto.autoInstantiationComplete = function(){}
		
		/**
		 * @name applicationWillLaunch 
		 * @description Called by the framework when the application is about to launch.
		 */
		proto.applicationWillLaunch = function(){}
		
		/**
		 * @name applicationLaunched 
		 * @description Called by the framework when the application has successfully launched.
		 */
		proto.applicationLaunched = function(){}
		
		/**
		 * @name applicationWillClose
		 * @description Called by the framework when the window is about to be closed. This method is tied to
		 * the onbeforeunload event in the window, and as such can additionally return back a custom string value to throw in a confirm
		 * dialogue and allow the user to cancel the window close if desired.
		 */
		proto.applicationWillClose = function(){
			
		}
		
		/**
		 * @name applicationClosed
		 * @description Called by the framework when the window is closing.
		 */
		proto.applicationClosed = function(){}
		
		/**
		 * @name applicationWillRelaunch
		 * @description Called by the framework when the application is about to relaunch.
		 */
		proto.applicationWillRelaunch = function(){}
})	
