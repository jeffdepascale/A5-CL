
a5.Package("a5.cl.core")
	.Static(function(DataCache){
		
		DataCache.enabled = function(){
			return DataCache.instance().enabled();
		}
		
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
			cacheKeys,
			provider;
		
		this.DataCache = function(){
			self.superclass(this); 
			_enabled = a5.cl.instance().config().cacheEnabled;
			cacheKeys = [];
		}
		
		this.enabled = function(){
			return _enabled;
		}

		this.isAvailable = function(){
			getCacheProvider().isAvailable();
		}
		
		this.cacheExists = function(){
			return getCacheProvider().cacheExists();
		}
		
		this.storeValue = function(key, value){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().storeValue(key);
			else
				return false;
		}
		
		this.getValue = function(key){			
			if (self.isAvailable() && checkCacheKey(key)) 
				return getCacheProvider().getValue(key);
		}
		
		this.clearValue = function(key){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().clearValue(key);
		}
		
		this.clearScopeValues = function(scope, $exceptions){		
			return getCacheProvider().clearScopeValues(scope, $exceptions);
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
		
		var getCacheProvider = function(){
			if (!provider) 
				provider = self.plugins().getRegisteredProcess('dataCacheProvider');
			return provider;
		}
	
	
});