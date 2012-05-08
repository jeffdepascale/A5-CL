
/**
 * Adds capabilities to a class to be a data source for a binding.
 */
a5.Package('a5.cl.mixins')
	.Mixin('BindableSource', function(mixin, im){
		
		this.Properties(function(){
			this._cl_receivers = null;
			this._cl_bindParamType = null;
			this._cl_bindParamRequired = false;
			this._cl_bindParamCallback = null;
		})
		
		mixin.BindableSource = function(){
			this._cl_receivers = [];
		}
		
		/**
		 * 
		 * @param {String} type
		 * @param {Boolean} required
		 * @param {Function} callback
		 */
		mixin.bindParamProps = function(type, required, callback){
			this._cl_bindParamType = type;
			if(required !== undefined) this._cl_bindParamRequired = required;
			if(callback !== undefined) this._cl_bindParamCallback = callback;
			return this;
		}
		
		/**
		 * Returns the data type of the param binding, specified in bindParamProps.
		 * @return {String}
		 */
		mixin.bindParamType = function(){
			return this._cl_bindParamType;
		}
		
		/**
		 * Returns whether a param is required for a binding, specified in bindParamProps.
		 * @return {String}
		 */
		mixin.bindParamRequired = function(){
			return this._cl_bindParamRequired;
		}
		
		/**
		 * Sends data to registered binding receivers.
		 * @param {Object} data The data to send.
		 * @param {Object} params Parameter data, based on values set in bindParamProps.
		 */
		mixin.notifyReceivers = function(data, params){	
			for (var i = 0, l = this._cl_receivers.length; i < l; i++) {
				var r = this._cl_receivers[i];
				if (params === undefined || params === r.params) {
					if (this._cl_bindParamRequired || (!data && this._cl_bindParamCallback !== null)) 
						data = this._cl_bindParamCallback.call(this, r.params);
					if (data !== null && data !== undefined) 
						r.receiver.receiveBindData.call(r.scope || r.receiver, this._cl_modifyBindData(data, r.mapping));
				}
			}
		}
		
		mixin._cl_attachReceiver = function(receiver, params, mapping, scope){
			this._cl_receivers.push({receiver:receiver, params:params, mapping:mapping, scope:scope});
			this.notifyReceivers();
		}
		
		mixin._cl_detachReceiver = function(receiver){
			for(var i = 0, l = this._cl_receivers.length; i<l; i++){
				var r = this._cl_receivers[i];
				if(r.receiver === receiver){
					this._cl_receivers.splice(i, 1);
					break;
				}
			}
		}

		mixin._cl_modifyBindData = function(dataSource, mapping){
			var data,
				isQuery = false;
			//TODO - needs to move to ORM implementation
			if(dataSource instanceof a5.cl.CLQueryResult)
				isQuery = true;
			if(isQuery)
				data = dataSource._cl_data;
			else 
				data = dataSource;
			if(mapping){
				var dataSet = [],
					skipProps = {};
				for (var i = 0, l = data.length; i < l; i++) {
					var dataRow = {};
					for (var prop in mapping) {
						dataRow[prop] = data[i][mapping[prop]];
						skipProps[mapping[prop]] = prop;
					}
					for(var prop in data[i])
						if(skipProps[prop] === undefined)
							dataRow[prop] = data[i][prop];
					dataSet.push(dataRow);
				}
				if (isQuery) {
					dataSource._cl_data = dataSet;
					return dataSource;
				} else {
					return dataSet;
				}
			} else {
				return dataSource;
			}
		}
				
});
