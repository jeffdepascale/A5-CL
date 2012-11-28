
a5.Package('a5.cl.interfaces')
	.Interface('IDataCacheProvider', function(IDataCacheProvider){
		
		IDataCacheProvider.isAvailable = function(){};
		IDataCacheProvider.cacheExists = function(){};
		IDataCacheProvider.storeValue = function(){};
		IDataCacheProvider.getValue = function(){};
		IDataCacheProvider.clearValue = function(){};
		IDataCacheProvider.clearScopeValues = function(){};
		
});
