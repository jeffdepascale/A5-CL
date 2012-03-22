
/**
 * @class Base class for Ajax handlers.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLAjax
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Mix('a5.cl.mixins.BindableSource')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLAjax#
	 	 * @function
		 */	
		
		proto.CLAjax = function(){
			proto.superclass(this);
			this._cl_ajaxStruct = null;
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
	.Class('AjaxCallAttribute', function(cls, im, AjaxCallAttribute){
		
		AjaxCallAttribute.CANCEL_CYCLE	= 'ajaxCallAttributeCancelCycle';
		
		var cycledCalls = {};
		
		cls.AjaxCallAttribute = function(){
			cls.superclass(this);
			
		}
		
		cls.Override.methodPre = function(rules, args, scope, method, callback){
			args = Array.prototype.slice.call(args);
			var data = null,
				argsCallback = null,
				rules = rules.length ? rules[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length)
				data = args.shift();
			if(rules.props)
				propObj = rules.props;
			if(rules.hasCallback === true && args.length && typeof args[0] === 'function')
				argsCallback = args.shift();
			var executeCall = function(){
				scope.call(method.getName(), data, function(response){
					args.unshift(response);
					if(argsCallback)
						argsCallback(args);
					callback(args);
				}, propObj);
			}
			if (args[0] === AjaxCallAttribute.CANCEL_CYCLE) {
				if (method._cl_cycleID) {
					clearInterval(method._cl_cycleID);
					delete method._cl_cycleID;
				}
				return a5.Attribute.ASYNC;
			}
			if (rules.cycle) {
				if (!method._cl_cycleID) {
					method._cl_cycleID = setInterval(function(){
						method.apply(scope, args);
					}, rules.cycle);
					executeCall();
				} else {
					executeCall();
				}
			} else {
				executeCall();
			}
			return a5.Attribute.ASYNC;
		}	
})

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('BoundAjaxReturnAttribute', function(cls){
		
		cls.BoundAjaxReturnAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPost = function(rules, args, scope, method, callback){
			if (rules.length && rules[0].receiverMethod !== undefined) {
				var method = rules[0].receiverMethod;
				method.call(null, args[0]);
			} else {
				scope.notifyReceivers(args[0]);
			}
			return a5.Attribute.SUCCESS;
		}
	})
