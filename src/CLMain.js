
a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		var configDefaults={
			allowUntestedPlugins:false,
			applicationBuild:null,
			appName:'',		
			breakOnDestroyedMethods:false,
			cacheEnabled:true,
			dependencies:[],
			environment:'DEVELOPMENT',
			globalUpdateTimerInterval:10,
			requestDefaultContentType:'application/json',
			requestDefaultMethod:'POST'
		},
		_params;
		
		/**
		 * @param {Object} [params=null] An optional object of parameters to pass into the application instance. Must be passed as a parameter to a5.cl.CreateApplication.
		 */
		proto.CLMain = function(params){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.']))
			if(this.getStatic().instanceCount() > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"']));
			for (var prop in configDefaults)
				if(params[prop] === undefined)
					params[prop] = configDefaults[prop];
			_params = params;
			_params.applicationPackage = this.classPackage();
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
		}
		
		proto.Override.cl = function(){
			return a5.cl.CL.instance();
		}
		
		proto.allowUntestedPlugins = function(val){ _params.allowUntestedPlugins = val; }
		
		proto.appName = function(val){ _params.appName = val; }
		
		proto.breakOnDestroyedMethods = function(val){ _params.breakOnDestroyedMethods = val; }
		
		proto.cacheEnabled = function(val){ _params.cacheEnabled = val; }
		
		proto.dependencies = function(val){ _params.dependencies = val; }
		
		proto.environment = function(val){ _params.environment = val; }
		
		proto.globalUpdateTimerInterval = function(val){ _params.globalUpdateTimerInterval = val; }
		
		proto.requestDefaultContentType = function(val){ _params.requestDefaultContentType = val; }
		
		proto.requestDefaultMethod = function(val){ _params.requestDefaultMethod = val; }
		
		proto._cl_params = function(){ return _params; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
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
