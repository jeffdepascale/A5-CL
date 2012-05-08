

/**
 * Mixin class for providing data storage hooks. DataStore applies a uniqe ID prefix on key values, removing the need to 
 * assure uniqueness of keys in your application. Key prefixes are unique to the class in which they are referenced.
 */
a5.Package('a5.cl.mixins')
	.Import('a5.cl.core.DataCache')
	.Mixin('DataStore', function(proto, im, DataStore){
		
		this.Properties(function(){
			this._cl_cacheKeyValidated = false;
			this._cl_prefix = null;
			this._cl_validatedPrefix = null;
		})
		
		proto.DataStore = function(){
		}
		
		/**
		 * Returns whether caching has previously been set by the application on the client and values are available for retrieval.
		 * @returns {Boolean}
		 */
		proto.cacheExists = function(){
			return im.DataCache.cacheExists();
		}
		
		/**
		 * Stores a value uniquely keyed in the localStorage cache.
		 * @param {String} key
		 * @param {String} value
		 * @returns {Boolean} success
		 */
		proto.storeValue = function(key, value){
			if(im.DataCache.isAvailable() && value !== undefined) 
				return im.DataCache.storeValue(this._cl_createCacheKey(key), value);
			else return false;
		}
		
		/**
		 * Specifies a predefined prefix name for values when stored in localStorage.
		 * @param {Object} value
		 */
		proto.keyPrefix = function(value){
			if(typeof value === 'string'){
				this._cl_prefix = value;
				return this;
			}
			return this._cl_prefix;
		}
		
		/**
		 * Retrieves a value for the specified key from the client data store.
		 * @param key {String}
		 * @returns {Object} False if failure
		 */
		proto.getValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.getValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Removes the value for the specified key from the client data store.
		 * @param key {String}
		 */
		proto.clearValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.clearValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Clears all key/value pairs associated with the class in which the method is called.
		 * @param {Array} [exceptions] An array of keys to leave untouched when clearing.
		 */
		proto.clearScopeValues = function(exceptions){
			if(im.DataCache.isAvailable()) 
				im.DataCache.clearScopeValues(this.instanceUID(), exceptions);
			else 
				return false;
		}
		
		proto._cl_createCacheKey = function(key){
			if (!this._cl_cacheKeyValidated || !this._cl_validatedPrefix) {
				var prefix = (this._cl_prefix || (this.id ? this.id() : false) || this.instanceUID());
				this._cl_cacheKeyValidated = im.DataCache.validateCacheKeyPrefix(prefix)
				if(!this._cl_cacheKeyValidated){
					a5.ThrowError("Error: Duplicate cache key prefix: " + prefix);
					return;
				}
				this._cl_validatedPrefix = prefix;
			}
			return this._cl_validatedPrefix + '_' + key;
		}
		
		proto.dealloc = function(){
			im.DataCache.removeCacheKeyPrefix(this._cl_validatedPrefix);
		}
});	