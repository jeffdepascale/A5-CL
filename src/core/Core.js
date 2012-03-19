
a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent', 'a5.cl.CLLaunchState')
	.Extends('a5.cl.CLBase')
	.Class("Core", 'singleton final', function(self, im){
	
		var _cache,
		_requestManager,
		_envManager,
		_globalUpdateTimer,
		_resourceCache,
		_instantiator,
		_pluginManager,
		_launchState,
		_manifestManager;
		
		this.Core = function($applicationPackage){
			self.superclass(this); 
			_instantiator = self.create(a5.cl.core.Instantiator, [$applicationPackage]);
		}
			
		this.resourceCache = function(){ return _resourceCache; }	
		this.instantiator = function(){ return _instantiator; }			
		this.cache = function(){	return _cache;	}
		this.envManager = function(){ return _envManager; }	
		this.manifestManager = function(){ return _manifestManager; }
		this.requestManager = function(){ return _requestManager;	}	
		this.pluginManager = function(){ return _pluginManager; }			
		this.globalUpdateTimer = function(){return _globalUpdateTimer;}
		this.launchState = function(){ return _launchState; }
		
		this.relaunch = function(){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_RELAUNCH);
			window.location.reload();
		}
		
		this.initializeCore = function($environment, $clientEnvironment){
			updateLaunchStatus('APPLICATION_INITIALIZING');
			_globalUpdateTimer = self.create(a5.cl.core.GlobalUpdateTimer);
			_manifestManager = self.create(a5.cl.core.ManifestManager);
			_requestManager = self.create(a5.cl.core.RequestManager);
			_envManager = self.create(a5.cl.core.EnvManager, [$environment, $clientEnvironment]);
			_resourceCache = self.create(a5.cl.core.ResourceCache);
			_pluginManager = self.create(a5.cl.core.PluginManager);
			_cache = self.create(a5.cl.core.DataCache);
			_resourceCache.initStorageRules();
			var loadPaths = self.config().dependencies;
			if(loadPaths.length) _resourceCache.include(loadPaths, dependenciesLoaded, function(e){
				updateLaunchStatus('DEPENDENCIES_LOADING', e);
			});
			else dependenciesLoaded();	
		}
		
		var dependenciesLoaded = function(){
			updateLaunchStatus('DEPENDENCIES_LOADED');
			_pluginManager.instantiatePlugins();
			updateLaunchStatus('PLUGINS_LOADED');
			updateLaunchStatus('APPLICATION_PREPARED')
			_envManager.initialize();
			_instantiator.beginInstantiation();
			var plgn = _pluginManager.getRegisteredProcess('launchInterceptor');
			if(plgn){
				var intercept = plgn.interceptLaunch(launchApplication);
				if(intercept) updateLaunchStatus('LAUNCH_INTERCEPTED', {interceptor:plgn});
				else launchApplication();
			} else {
				launchApplication();
			}
		}
		
		var launchApplication = function(){		
			_pluginManager.processAddons(addOnsLoaded);		
		}
		
		var addOnsLoaded = function(){
			updateLaunchStatus('APPLICATION_WILL_LAUNCH');
			updateLaunchStatus('APPLICATION_LAUNCHED');	
		}
		
		var updateLaunchStatus = function(type, e){
			_launchState = im.CLLaunchState[type];
			self.cl().dispatchEvent(im.CLEvent[type], e);
		}
});