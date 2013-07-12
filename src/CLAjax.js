
/**
 * Base class for Ajax endpoint consumers.
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Mix('a5.cl.mixins.BindableSource')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		this.Properties(function(){
			this._cl_ajaxStruct = null;
			this._cl_silent = false;
		})
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.CLAjax = function(url, props){
			proto.superclass(this, [url]);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
		 * @returns {Number} The request ID.
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
				if(this.url().indexOf('?') == -1 && m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		/**
		 * Aborts all calls associated with the service.
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Boolean} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});


/**
 * Adds ajax call wrapping logic to a method. Calls to methods with this attribute are assumed to execute a call
 * to a method on the endpoint of the same name.
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Static(function(AjaxCallAttribute){
		
		AjaxCallAttribute.CANCEL_CYCLE	= 'ajaxCallAttributeCancelCycle';
		
	})
	.Class('AjaxCallAttribute', function(cls, im, AjaxCallAttribute){
		
		var cycledCalls = {},
			data = {};
		
		cls.AjaxCallAttribute = function(){
			cls.superclass(this);
			
		}

		cls.Override.before = function(aspectArgs){		
			var data = null,
				args = aspectArgs.args() ? Array.prototype.slice.call(aspectArgs.args()) : [],
				argsCallback = null,
				rules = aspectArgs.rules().length ? aspectArgs.rules()[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length)
				data = args.shift();
			if(rules.props)
				propObj = rules.props;
			if(rules.hasErrorCallback){
				if(!propObj)
					propObj= {};
				propObj.error = args.pop();	
			}
			if(rules.hasCallback === true && args.length && typeof args[0] === 'function')
				argsCallback = args.shift();
			var executeCall = function(){
				if (rules.cacheResponse && getData(aspectArgs.method())) {
					setTimeout(function(){
						args.unshift(getData(aspectArgs.method()));
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, 0);
				} else {	
					aspectArgs.scope().call(aspectArgs.method().getName(), data, function(response){
						if (rules.cacheResponse)
							storeData(aspectArgs.method(), response);
						args.unshift(response);
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, propObj);
				}
			}
			if (args[0] === AjaxCallAttribute.CANCEL_CYCLE) {
				if (aspectArgs.method()._cl_cycleID) {
					clearInterval(aspectArgs.method()._cl_cycleID);
					delete aspectArgs.method()._cl_cycleID;
				}
				return a5.AspectAttribute.ASYNC;
			}
			if (rules.cycle) {
				if (!aspectArgs.method()._cl_cycleID) {
					aspectArgs.method()._cl_cycleID = setInterval(function(){
						aspectArgs.method().apply(aspectArgs.scope(), args);
					}, rules.cycle);
					executeCall();
				} else {
					executeCall();
				}
			} else {
				executeCall();
			}
			return a5.AspectAttribute.ASYNC;
		}	
		
		var getData = function(method){
			return data[method.getClassInstance().instanceUID() + "_" + method.getName()];
		}	
		
		var storeData = function(method, value){
			data[method.getClassInstance().instanceUID() + "_" + method.getName()] = value;
		}
})

/**
 * Associates a method on a CLAjax instance as associated with a bind configuration from {@link a5.cl.mixins.Binder}
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxReturnAttribute', function(cls){
		
		cls.BoundAjaxReturnAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			if (aspectArgs.rules().length && aspectArgs.rules()[0].receiverMethod !== undefined) 
				aspectArgs.rules()[0].receiverMethod.call(null, aspectArgs.args()[0]);
			else
				aspectArgs.scope().notifyReceivers(aspectArgs.args()[0], aspectArgs.method().getName());
			return a5.AspectAttribute.SUCCESS;
		}
})
	
/**
 * Provides init info for an associated method on a CLAjax instance as associated with a bind configuration from {@link a5.cl.mixins.Binder}
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxInitializeAttribute', function(cls){
		
		cls.BoundAjaxInitializeAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			aspectArgs.scope().notifyReceiversOnInitialize();
			return a5.AspectAttribute.SUCCESS;
		}
})
