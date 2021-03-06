a5.Package('a5.cl.initializers.dom')

	.Extends('a5.cl.CLAddon')
	.Class('DOM', 'singleton', function(cls, im, DOM){
		
		var manifestManager;
		
		cls.DOM = function(){
			cls.superclass(this);
			cls.configDefaults({				
				clientEnvironment:null,
				forceIE7:true,
				clientEnvironmentOverrides:false,
				mobileWidthThreshold:768,		
				titleDelimiter:': ',
				trapErrors:false
			});
		}
		
		cls.Override.initializePlugin = function(){
			manifestManager = new im.ManifestManager();
		}
		
		cls.manifestManager = function(){
			return cls.cl().initializer().manifestManager();
		}
		
		cls.environmentManager = function(){
			return cls.cl().initializer().environmentManager();
		}
		
		/**
		 *
		 * @type String
		 * @param {Boolean} [root]
		 */
		cls.appPath = function(root){ return cls.environmentManager().appPath(root); }
		
		/**
		 *
		 * @type Number
		 */
		cls.browserVersion = function(){	return cls.environmentManager().browserVersion();	}
		
		/**
		 * Defines A5 CL client environment types. One of 'DESKTOP', 'MOBILE', or 'TABLET'.
		 *
		 * @type String
		 */
		cls.clientEnvironment = function(){	return cls.environmentManager().clientEnvironment.apply(null, arguments);	}
		
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
		cls.clientPlatform = function(){		return cls.environmentManager().clientPlatform();	}
		
		/**
		 * 
		 */
		cls.clientOrientation = function(){ return cls.environmentManager().clientOrientation(); }	
		
		
		/**
		 * Defines AirFrame CL development environment types. One of 'DEVELOPMENT', 'TEST', or 'PRODUCTION'.
		 *
		 * @type String
		 */
		cls.environment = function(){	return cls.environmentManager().environment();	}
		
		/**
		 * Returns whether the client environment supports manifest caching.
		 *
		 */
		cls.isOfflineCapable = function(){		return manifestManager.isOfflineCapable();	}
		
		/**
		 * Returns whether the application is running on http:// or file://
		 *
		 */
		cls.isLocal = function(){ return cls.environmentManager().isLocal(); }
		
		/**
		 * Returns the current online state of the client browser, where supported.
		 *
		 */
		cls.isOnline = function(){	return cls.environmentManager().isOnline();	}	
		
});

new a5.cl.initializers.dom.DOMInitializer();