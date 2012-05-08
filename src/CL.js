/**
 * The instance of an A5 CL application, acting as both a reference instance for core components via its methods and as a global binder object.
 */
a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(self, im){
	
		var _params,
			_config,
			_main,
			core;
		
		this._cl_plugins = {};
		
		/**
		 * 
		 * @param {Object} params
		 */
		this.CL = function(params){
			self.superclass(this);
			_params = {};
			if(a5.cl.CLMain._extenderRef.length)
				_main = self.create(a5.cl.CLMain._extenderRef[0], [params]);
			_params.applicationPackage = _main.classPackage();
			core = self.create(a5.cl.core.Core, [_params.applicationPackage]);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), _params);
			_config = core.instantiator().createConfig(_config);
			core.initializeCore((params.environment || null), (_params.clientEnvironment || null));
		}
		
		/**
		 * Returns the current launch state of the application, a value from TODO
		 */
		this.launchState = function(){ return core.launchState(); }
		
		/**
		 * Returns a reference to the application package.
		 * @param {Boolean} [returnString=false] If true is passed, returns the string value of the namespace of the application package.
		 */
		this.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(this, arguments); };
		
		/**
		 *
		 */
		this.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }

		/**
		 *
		 * @type String
		 * @param {Boolean} [root]
		 */
		this.appPath = function(root){ return core.envManager().appPath(root); }
		
		/**
		 *
		 * @type Number
		 */
		this.browserVersion = function(){	return core.envManager().browserVersion();	}
		
		/**
		 * Defines A5 CL client environment types. One of 'DESKTOP', 'MOBILE', or 'TABLET'.
		 *
		 * @type String
		 */
		this.clientEnvironment = function(){	return core.envManager().clientEnvironment.apply(null, arguments);	}
		
		/**
		 * Defines A5 CL client platform types.<br/>
		 * Values:<br/>
		 * 'BB6' - BlackBerry OS 6<br/>
		 * 'BB' - BlackBerry OS 5 and under<br/>
		 * 'IOS' - Apple iOS<br/>
		 * 'ANDROID' - Google Android<br/>
		 * 'IE' - Internet Explorer<br/>
		 * 'UNKNOWN' - Unknown platform.<br/>
		 *
		 * @type String
		 */
		this.clientPlatform = function(){		return core.envManager().clientPlatform();	}
		
		/**
		 * 
		 */
		this.clientOrientation = function(){ return core.envManager().clientOrientation(); }
		
		/**
		 *
		 */
		this.Override.config = function(){		return _config; }		
		
		/**
		 * Defines AirFrame CL development environment types. One of 'DEVELOPMENT', 'TEST', or 'PRODUCTION'.
		 *
		 * @type String
		 */
		this.environment = function(){	return core.envManager().environment();	}
		
		
		/**
		 * Includes external content into the application.
		 *
		 * @param {String} value
		 * @param {function} callback
		 * @param {function} [itemCallback]
		 * @param {Boolean} [allowReplacements=true]
		 * @param {function} [onError]
		 */
		this.include = function(){ return core.resourceCache().include.apply(this, arguments); }	
		
		/**
		 * Returns whether the client environment supports manifest caching.
		 *
		 */
		this.isOfflineCapable = function(){		return core.manifestManager().isOfflineCapable();	}
		
		/**
		 * Returns whether the application is running on http:// or file://
		 *
		 */
		this.isLocal = function(){ return core.envManager().isLocal(); }
		
		/**
		 * Returns the current online state of the client browser, where supported.
		 *
		 */
		this.isOnline = function(){	return core.envManager().isOnline();	}	
		
		/**
		 *
		 */
		this.manifestBuild = function(){ return core.manifestManager().manifestBuild();	}
		
		/**
		 *
		 */
		this.Override.plugins = function(){ return this._cl_plugins; }
		
		/**
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeAllCaches = function(restartOnComplete){ core.resourceCache().purgeAllCaches(restartOnComplete); }
		
		/**
		 * Purges the manifest cache data in applicationStorage, if applicable.
		 *
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeApplicationCache = function(restartOnComplete){ core.manifestManager().purgeApplicationCache(restartOnComplete); }
		
		/**
		 * Restarts the application.
		 */
		this.relaunch = function(){ core.relaunch(); }
		
		this._core = function(){		return core; }
		
		this.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
		this._cl_createParams = function(){ return _params; }
		
		this.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(this.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});