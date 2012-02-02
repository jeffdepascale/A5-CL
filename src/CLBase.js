
/**
 * @class Base class for all classes in the AirFrame CL MVC framework. 
 * <br/><b>Abstract</b>
 * @name a5.cl.CLBase
 * @extends a5.CLEventDispatcher
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		/**#@+
	 	 * @memberOf a5.cl.CLBase#
	 	 * @function
		 */	
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the name value of the class if known, else it returns the instanceUID value.
		 * @name mvcName
		 * @type String
		 */
		proto.mvcName = function(){
			return this._cl_mvcName || this.instanceUID();
		}
		
		
		/**
		 * @name cl
		 * @return
		 * @type a5.cl.MVC#
		 */
		proto.cl = function(){
			return a5.cl.instance();
		}
		
		/**
		 * Returns an instance of the class defined by the following parameters:
		 * @name getClassInstance
		 * @param {String} type One of 'Domain', 'Service', or 'Controller'
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooController', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * @name log
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		proto.warn = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.warn.apply(this, arguments);
			else
				if ('console' in window) 
					console.warn.apply(console, arguments);
		}
		
		/**
		 * The redirect method throws a control change to A5 CL.
		 * @name redirect
		 * @param {Object|String|Array|Number} params Numbers are explicitly parsed as errors. String parsed as location redirect if is a url, otherwise processed as a hash change.
		 * @param {String|Array} [param.hash] A string value to pass as a hash change. 
		 * @param {String} [param.url] A string value to pass as a location redirect. 
		 * @param {String} [param.controller] A string value referencing the name of a controller to throw control to, defaulting to the index method of the controller. 
		 * @param {String} [param.action] A string value of the name of the method action to call. 
		 * @param {Array} [param.id] An array of parameters to pass to the action method. 
		 * @param {String|Array} [param.forceHash] A string to set the hash value to. Note that unlike standard hash changes, forceHash will not be parsed as a mappings change and is strictly for allowing finer control over the address bar value.
		 * @param {String} [info] For errors only, a second parameter info is used to pass custom error info to the error controller. 
		 */
		proto.redirect = function(params, info, forceRedirect){
			if(this.cl()._core().locationManager()){
				return this.cl()._core().locationManager().redirect(params, info, forceRedirect);
			} else {
				if(params === 500){
					var isError = info instanceof a5.Error;
					if(isError && !info.isWindowError())
						this.throwError(info);
					else
						throw info;
				}
			}
		}
		
		proto.Override.throwError = function(error){
			proto.superclass().throwError(error, a5.cl.CLError);
		}
		
		/**
		 * Returns the configuration object.
		 * @name config
		 */
		proto.config = function(){
			return this.cl().config();
		}
		
		/**
		 * @name plugins
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns the appParams object as specified in the config object
		 * @name appParams
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
		
		proto._cl_setMVCName = function(name){
			this._cl_mvcName = name;
		}
});

