
a5.Package("a5.cl.initializers.dom")
	.Extends("a5.cl.CLPlugin")
	.Implements('a5.cl.interfaces.IDataCacheProvider')
	.Class("DataCache", 'singleton final', function(cls, im){
		
		var _capable,
			_hadCacheAtLaunch;
		
		this.DataCache = function(){
			cls.superclass(this); 
			cls.registerForProcess('dataCacheProvider');
			_capable = window.localStorage != undefined;
			_hadCacheAtLaunch = (cls.isAvailable() && localStorage.length) ? true:false;
		}
		
		this.isAvailable = function(){
			return a5.cl.core.DataCache.enabled() && _capable;
		}
		
		this.cacheExists = function(){
			if(this.isAvailable()) return _hadCacheAtLaunch;
			else return false;
		}
		
		this.storeValue = function(key, value){
			var stringVal = a5.cl.core.JSON.stringify(value);
			return localStorage.setItem(key, stringVal);
		}
		
		this.getValue = function(key){
			try {
				var retValue = localStorage.getItem(key);
				return a5.cl.core.JSON.parse(retValue);
			} catch (e) {
				return null;
			}
		}
		
		this.clearValue = function(key){
			try {
				return localStorage.removeItem(key);
			} catch (e) {
				return false;
			}
		}
		
		this.clearScopeValues = function(scope, $exceptions){
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
});