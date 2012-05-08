
/**
 * Adds capabilities to a class to manage bindings.
 */
a5.Package('a5.cl.mixins')
	.Mixin('Binder', function(mixin, im){
		
		this.Properties(function(){
			this._cl_bindingsConnected = true;
			this._cl_bindings = [];
		});
		
		mixin.Binder = function(){
			this._cl_bindings = [];
		}
		
		/**
		 * Sets whether bindings are currently enabled. If set to false, all bindings are suspended, unless a binding has its persist value set to true.
		 * @param {Boolean} value
		 */
		mixin.setBindingEnabled = function(value){
			if (value !== this._cl_bindingsConnected) {
				for (var i = 0, l = this._cl_bindings.length; i < l; i++) {
					var b = this._cl_bindings[i];
					if (b.persist !== true) {
						if (value) 
							b.source._cl_attachReceiver(b.receiver, b.params, b.mapping, b.scope);
						else b.source._cl_detachReceiver(b.receiver);
					}
				}
				this._cl_bindingsConnected = value;
			}
		}
		
		/**
		 * Returns whether bindings are active.
		 * @return {Boolean}
		 */
		mixin.bindingsConnected = function(){
			return this._cl_bindingsConnected;
		}
		
		/**
		 * Creates a bind between a data source and a receiver.
		 * @param {a5.cl.mixins.BindableSource} source
		 * @param {a5.cl.interfaces.IBindableReceiver} receiver
		 * @param {Object} params Parameters for the binding source, as specified by the receiver.
		 * @param {Object} [mapping] If specified, remaps properties by name to new values. 
		 * @param {Object} [scope] Defines a scope to call the bind receiver in.
		 * @param {Object} [persist=false] If set to true, the binding will remain active if bindings are set to disabled.
		 */
		mixin.bind = function(source, receiver, params, mapping, scope, persist){
			if(!this._cl_checkBindExists(source, receiver, params)){
				if(source.isA5ClassDef())
					source = source.instance();
				if (!source.doesMix('a5.cl.mixins.BindableSource'))
					return this.throwError('source "' + source.className() + '" of bind call must mix a5.cl.mixins.BindableSource.');
				if(receiver.isA5ClassDef())
					receiver = receiver.instance();
				if (!receiver.doesImplement('a5.cl.interfaces.IBindableReceiver'))
					return this.throwError('receiver "' + receiver.className() + '" of call bind must implement a5.cl.interfaces.IBindableReceiver.');
				var hasParams = params !== undefined && params !== null,
					isNM = false,
					pType = null;
				if(source.bindParamRequired() || params){
					var isValid = true;
				 	if (!hasParams){
						isValid = false;
					} else if (source.bindParamType() !== null){
						pType = source.bindParamType();
						if(typeof pType === 'string' && pType.indexOf('.') !== -1)
							pType = a5.GetNamespace(pType);
						if(pType.namespace){
							isNM = true;
							var nmObj = pType.namespace();
							if(!(params instanceof pType))
								isValid = false;
						} else {
							if(typeof params !== source.bindParamType())
								isValid = false; 
						}
					}
					if(!isValid){
						this.throwError('params required for binding source "' + source.namespace() + '"' + (pType !== null ? ' must be of type "' + (isNM ? pType.namespace() : pType) + '"' : ''));
						return;
					}
				}
				this._cl_bindings.push({source:source, scope:scope, receiver:receiver, mapping:mapping, params:params, persist:persist})
				if(this.bindingsConnected())
					source._cl_attachReceiver(receiver, params, mapping, scope);
			}
		}
		
		/**
		 * Removes a given binding, if it exists.
		 * @param {a5.cl.mixins.BindableSource} source
		 * @param {a5.cl.interfaces.IBindableReceiver} receiver
		 * @throws 
		 */
		mixin.unbind = function(source, receiver){
			var found = false;
			for(var i = 0, l = this._cl_bindings.length; i<l; i++){
				var obj = this._cl_bindings[i];
				if(obj.source === source && obj.receiver === receiver){
					this._cl_bindings.splice(i, 1);
					found = true;
					break;
				}
			}
			if(found)
				source._cl_detachReceiver(receiver);
			else
				this.throwError('cannot unbind source "' + source.namespace() + '" on controller "' + this.namespace() + '", binding does not exist.');
		}
		
		mixin._cl_checkBindExists = function(source, receiver, params){
			for(var i = 0, l = this._cl_bindings.length; i<l; i++){
				var b = this._cl_bindings[i];
				if(b.source === source && b.receiver === receiver && b.params === params)
					return true;
			}
			return false;
		}
});