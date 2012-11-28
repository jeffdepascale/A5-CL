/**
 * The instance of an A5 CL application, acting as both a reference instance for core components via its methods and as a global binder object.
 */
a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(self, im){
	
		var _params,
			_config,
			_initializer,
			_main,
			core;
		
		this._cl_plugins = {};
		
		/**
		 * 
		 * @param {Object} params
		 */
		this.CL = function(params, initializer){
			self.superclass(this);
			_params = {};
			if(a5.cl.CLMain._extenderRef.length)
				_main = self.create(a5.cl.CLMain._extenderRef[0], [params]);
			_params.applicationPackage = _main.classPackage();
			_initializer = initializer;
			core = self.create(a5.cl.core.Core, [_params.applicationPackage]);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), _params);
			_config = core.instantiator().createConfig(_config);
			if(_config.breakOnDestroyedMethods == true){
				a5._a5_destroyedObjFunc = function(){ 
					debugger; 
				}
			}
		}
		
		this._cl_launch = function(){
			core.initializeCore((_params.environment || null), (_params.clientEnvironment || null));
		}
		
		this.initializer = function(){
			return _initializer;
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
		 */
		this.Override.config = function(){		return _config; }		
		
		/**
		 *
		 */
		this.Override.plugins = function(){ return this._cl_plugins; }
		
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