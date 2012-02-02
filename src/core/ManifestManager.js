
a5.Package('a5.cl.core')

	.Extends('a5.cl.CLBase')
	.Class('ManifestManager', 'singleton final', function(self){
	
		var _isOfflineCapable,
		appCache,
		_manifestBuild = null,
		manifestHref;
		
		this.ManifestManager = function(){
			self.superclass(this);
			manifestHref = document.getElementsByTagName('html')[0].getAttribute('manifest');
			appCache = window.applicationCache;
			_isOfflineCapable = appCache && manifestHref ? true:false;
			if(_isOfflineCapable) 
				initialize();
		}
		
		this.manifestBuild = function(){	return _manifestBuild; }
		this.isOfflineCapable = function(){	return _isOfflineCapable;}
		
		this.purgeApplicationCache = function($restartOnComplete){
			var restartOnComplete = ($restartOnComplete == false ? false:true);
			var updateReady = function(){
				appCache.swapCache();
				if(restartOnComplete) 
					self.cl().relaunch(true);
			}
			if (appCache.status == 1) {
				appCache.addEventListener('updateready', updateReady, false);
				appCache.update();
			} else {
				throw 'Cannot purge application cache, appCache status is ' + appCache.status;
			}
		}
		
		var initialize = function(){
			checkManifestBuild(manifestHref);
			appCache.addEventListener('error', onerror, false);
		}
		
		var checkManifestBuild = function(manifestHref){
			var resourceCache = a5.cl.core.ResourceCache.instance(), 
			result;
			self.cl().include(manifestHref, function(data){
				result = data.match(/#build\b.[0-9]*/);
				if(result){
					result = result[0];
					result = result.split('#build')[1];
					result = parseInt(a5.cl.core.Utils.trim(result));
					if(!isNaN(result)) _manifestBuild = result;
				}
			})
		}
		
		var onerror = function(e){
			self.redirect(500, 'Error loading manifest');
		}
})
