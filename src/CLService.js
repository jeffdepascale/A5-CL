
/**
 * Base class for service consumers in A5 CL.
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){	
		
		this.Properties(function(){
			this._cl_url = null;
			this._cl_isJson = true;
		})
		
		/**
		 * Constructor for CLService
		 * @param {String} url The url of the service endpoint.
		 */
		proto.CLService = function(url){
			proto.superclass(this);
			this._cl_url = url;
		}
		
		/**
		 * Returns the url of the service endpoint, respecting the serviceURLRewriter plugin process if associated.
		 * @return {String}
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * Getter/Setter method for the default setting for the consumer endpoint for JSON parsing.
		 * @param {Boolean} [value] If passed, sets the value.
		 * @return {Boolean|a5.cl.CLService} if a value is passed, returns a reference to the object instance for chaining, otherwise returns the value.
		 */
		proto.isJson = function(value){
			if(value !== undefined) this._cl_isJson = value;
			return this._cl_isJson;
		}
		
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('SerializableAttribute', 'abstract', function(cls){
		
		cls.SerializableAttribute = function(){
			
		}
})