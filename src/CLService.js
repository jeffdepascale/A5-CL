
/**
 * @class Base class for service handlers in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLService
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLService#
	 	 * @function
		 */		
		
		proto.CLService = function(){
			proto.superclass(this);
			this._cl_url = null;
			this._cl_isJson = true;
		}
		

		proto.initialize = function(url){
			this._cl_url = url;
		}
		
		/**
		 * @name url
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * @name isJson
		 * @param {Boolean} [value]
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
		
		cls.Override.instanceProcess = function(rules, instance){
		
		}
})