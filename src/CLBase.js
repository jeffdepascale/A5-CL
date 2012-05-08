
/**
 * Base class for all classes in an A5 CL application. 
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns a reference to the CL application instance.
		 * @return {a5.cl.CL}
		 */
		proto.cl = function(){
			return a5.cl.instance();
		}
		
		/**
		 * Returns an instance of the class defined by the specified parameters
		 * @param {String} type A string value representing the type of class to instantiate. 'Service' is available by default, add-ons may register additional type names for instantiation. 
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooService', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * Sends a log value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		/**
		 * Sends a warn value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
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
		 * Returns a reference to the configuration object for the A5 CL application instance.
		 * @return {a5.cl.CLConfig}
		 */
		proto.config = function(){
			return this.cl().config();
		}
		
		/**
		 * Returns a reference to the plugins object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns a reference to the appParams object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
});

