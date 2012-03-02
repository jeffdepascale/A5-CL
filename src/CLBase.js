
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
});

