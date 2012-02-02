
/**
 * @class Base class for Ajax handlers.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLAjax
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLAjax#
	 	 * @function
		 */	
		
		proto.CLAjax = function(){
			proto.superclass(this);
			this._cl_ajaxStruct = null;
			this._cl_cycledCalls = {};
			this._cl_silent = false;
		}
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @name initialize
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.Override.initialize = function(url, props){
			proto.superclass().initialize.call(this, url);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @name call
		 * @type Number
		 * @returns The request ID.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
		 */
		proto.call = function(m, data, callback, props){
			//TODO: enforceContract to allow overload with no method, or no data
			var callObj = this._cl_ajaxStruct ? a5.cl.core.Utils.deepClone(this._cl_ajaxStruct):{};
			if (props) {
				for (var prop in callObj) 
					if (props[prop] == undefined) props[prop] = callObj[prop];
			} else {
				props = callObj;
			}
			if (data) {
				if(data.isA5Class)
					props.data = a5.Attribute.processInstance(data);
				props.data = data;
			}
			props.isJson = this.isJson();
			props.success = callback;
			if(this._cl_silent)
				props.silent = true;
			if(m){
				if(m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		proto.createCycledCall = function(m, data, delay, callback, props){
			
		}
		
		/*
		proto.cancelCycledCall = this.Attributes(["a5.Contracts", {id:'number'}], function(){
			
		})*/
		
		/**
		 * Aborts all calls associated with the service.
		 * @name abort
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Object} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('AjaxCall', function(cls, im, ServiceCall){
		
		cls.AjaxCall = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(rules, args, scope, method, callback){
			args = Array.prototype.slice.call(args);
			var data = null,
				rules = rules.length ? rules[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length) {
				data = args.shift();
				delete rules.takesData;
			}

			scope.call(method.getName(), data, function(response){
				args.unshift(response);
				callback(args);
			}, (rules && rules.length ? rules[0] : null));
			return a5.Attribute.ASYNC;
		}	
})