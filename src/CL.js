/**
 * The instance of an A5 CL application, acting as both a reference instance for core components via its methods and as a global binder object.
 */
a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(cls, im){
	
		var _params,
			_initializer,
			_config,
			core;
		
		cls._cl_plugins = {};

		cls.CL = function(params, initializer){
			cls.superclass(this);
			var main = new a5.cl.CLMain._extenderRef[0](params);
			_params = main._cl_params();
			_initializer = initializer;
			core = new a5.cl.core.Core(_params);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), params);
			if (_config.breakOnDestroyedMethods == true) {
				a5._a5_destroyedObjFunc = Function('debugger;');
			}
		}
		
		cls._cl_launch = function(){
			core.initializeCore((_params.environment || null), (_params.clientEnvironment || null));
		}
		
		cls.initializer = function(){
			return _initializer;
		}
		
		/**
		 * Returns the current launch state of the application, a value from TODO
		 */
		cls.launchState = function(){ return core.launchState(); }
		
		/**
		* @type String
		* @default null
		*/
		cls.applicationBuild = function(){ return _config.applicationBuild; }
		
		/**
		* @type  String 
		* @default an empty string
		*/
		cls.appName = function(){ return _config.appName; }
		
		/**
		 * Returns a reference to the application package.
		 * @param {Boolean} [returnString=false] If true is passed, returns the string value of the namespace of the application package.
		 */
		cls.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(cls, arguments); };
		
		/**
		 *
		 */
		cls.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }
		
		/**
		* @type  String
		* @default 'DEVELOPMENT'
		*/
		cls.environment = function(){ return _config.environment; }
		
		/**
		 *
		 */
		cls.Override.plugins = function(){ return cls._cl_plugins; }
		
		/**
		 * Restarts the application.
		 */
		cls.relaunch = function(){ core.relaunch(); }
		
		cls._core = function(){		return core; }
		
		cls.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
		cls.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(cls.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});