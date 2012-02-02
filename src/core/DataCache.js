
a5.Package("a5.cl.core")
	.Static(function(DataCache){
		DataCache.cacheExists = function(){
			return DataCache.instance().cacheExists();
		}
		
		DataCache.isAvailable = function(){
			return DataCache.instance().isAvailable();
		}
		
		DataCache.storeValue = function(key, value){
			return DataCache.instance().storeValue(key, value);
		}
		
		DataCache.getValue = function(key){
			return DataCache.instance().getValue(key);
		}
		
		DataCache.clearValue = function(key){
			return DataCache.instance().clearValue(key);
		}
		
		DataCache.clearScopeValues = function(scope, exceptions){
			return DataCache.instance().clearScopeValues(scope, exceptions);
		}
		
		DataCache.validateCacheKeyPrefix = function(key){
			return DataCache.instance().validateCacheKeyPrefix(key);
		}
		
		DataCache.removeCacheKeyPrefix = function(key){
			return DataCache.instance().removeCacheKeyPrefix(key);
		}
	})
	.Extends("a5.cl.CLBase")
	.Class("DataCache", 'singleton final', function(self, im){
		
		var _enabled,
			_capable,
			_hadCacheAtLaunch,
			cacheKeys;
		
		this.DataCache = function(){
			self.superclass(this); 
			_enabled = a5.cl.instance().config().cacheEnabled;
			_capable = window.localStorage != undefined;
			_hadCacheAtLaunch = (this.isAvailable() && localStorage.length) ? true:false;
			cacheKeys = [];
		}
		
		this.isAvailable = function(){
			var plugin = getDataPlugin();
			if(plugin)
				_capable = plugin.isCapable.call(plugin);
			return _enabled && _capable;
		}
		
		this.cacheExists = function(){
			if(this.isAvailable()) return _hadCacheAtLaunch;
			else return false;
		}
		
		this.storeValue = function(key, value){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.storeValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				var stringVal = a5.cl.core.JSON.stringify(value),
				value = localStorage.setItem(key, stringVal);
				return value;
			} else {
				return false;
			}
		}
		
		this.getValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.getValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					var retValue = localStorage.getItem(key);
					return a5.cl.core.JSON.parse(retValue);
				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		}
		
		this.clearValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					return localStorage.removeItem(key);
				} 
				catch (e) {
					return false;
				}
			} else {
				return false;
			}
		}
		
		this.clearScopeValues = function(scope, $exceptions){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearScopeValues.apply(plugin, arguments);
			
			var exceptions = $exceptions || [], i, j;
			for(var i = 0, l=localStorage.length; i<l; i++){
				var key =localStorage.key(i);
				if (key.indexOf(scope) == 0) {
					var cacheItemName = key.split(scope)[1].substr(1),
					isExcepted = false;
					for (j = 0, m=exceptions.length; j < m; j++) {
						if(cacheItemName == exceptions[j]) isExcepted = true;
					}
					if(!isExcepted){
						localStorage.removeItem(key);
						i--;
						l=localStorage.length;
					}
				}
			}
		}
		
		this.validateCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++)
				if(cacheKeys[i] == key)
					return false;
			cacheKeys.push(key);
			return true;
		}
		
		this.removeCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if(cacheKeys[i] == key){
					cacheKeys.splice(i, 1);
					return;
				}
			}
		}
		
		var checkCacheKey = function(key){
			var isInCache = false;
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if (key.substr(cacheKeys[i]) != -1) {
					isInCache = true;
					break;
				}
			}
			return isInCache;
		}
		
		var getDataPlugin = function(){
			return self.plugins().getRegisteredProcess('dataStorage');
		}
	
	
});