a5.Package('a5.cl.initializers.dom')
	
	.Import('a5.cl.CLEvent')
    .Extends('a5.cl.CLInitializer')
    .Class('DOMInitializer', function (cls, im) {

		var resourceCache,
			props,
			envManager;

        cls.DOMInitializer = function () {
            cls.superclass(this);
        }
		
		cls.environmentManager = function(){
			return envManager;
		}		
				
		cls.resourceCache = function(){
			return resourceCache;
		}
		
		cls.Override.load = function(arr, complete, progress){
			return resourceCache.load(arr, complete, progress);
		}
		
		cls.Override.cacheLoadedValue = function(name, value, type){
			return resourceCache.cacheURLValue(name, type, value);
		}

        cls.Override.initialize = function (_props, callback) {
            props = _props;
			var initialized = false,

            onDomReady = function () {
                if (!initialized) {
                    initialized = true;
					callback();
                }
            },

            domContentLoaded = function () {
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", domContentLoaded, false);
                    onDomReady();
                } else if (document.attachEvent) {
                    if (document.readyState === "complete") {
                        document.detachEvent("onreadystatechange", domContentLoaded);
                        onDomReady();
                    }
                }
            }

            if (document.readyState === "complete") {
                onDomReady();
            } else if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", domContentLoaded, false);
            } else if (document.attachEvent) {
                document.attachEvent("onreadystatechange", domContentLoaded);
            }
        }
		
		cls.Override.applicationInitialized = function(inst){
			inst.addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, ePluginsLoadedHandler);
			resourceCache = new im.ResourceCache(props.cacheTypes || [], 
									props.cacheBreak || false, 
									props.staggerDependencies || true,
									props.xhrDependencies || false,
									props.silentIncludes || false);
			envManager = new im.EnvManager(inst.environment());
		}
		
		var ePluginsLoadedHandler = function(){
			envManager.initialize(props.trapErrors);
		}
});