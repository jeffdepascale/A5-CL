
/**
 * @class Worker class instance, performs a task on a worker thread when available or in the browser thread when not.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLWorker
 * @extends a5.CLEventDispatcher
 */
a5.Package('a5.cl')
	
	.Extends('CLBase')
	.Prototype('CLWorker', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWorker#
	 	 * @function
		 */
		
		proto.CLWorker = function(isWorker){
			proto.superclass(this);
			if(this.isSingleton())
				this.redirect(500, "Workers cannot be singletons.");
			this._cl_communicator = null;
			this._cl_JSON = a5.cl.core.JSON || JSON;
			this._cl_isWorker = (isWorker === '_cl_isWorkerInitializer');
			if (!this._cl_isWorker) 
				this.workerInit.apply(this, arguments);
		}
		
		proto.workerInit = function(){}
		
		proto.defineWorkerMethods = function(func){
			//call func, passing worker obj and data
		}		
		
		/**
		 * @name JSON
		 */
		proto.JSON = function(){
			return this._cl_JSON;
		}
		
		/**
		 * @name createWorker
		 * @param {Object} props
		 */
		proto.createWorker = function(data){
			if (!this._cl_isWorker) {
				data = data || {};
				var self = this,
				workerURL = this.config().workersPath,
				includes = this.config().workersIncludes,
				handleMessages = function(obj){
					if (obj.log) {
						self.log(obj.log);
					} else if (obj.error) {
						self.redirect(500, obj.error);
					} else {
						var method = null;
						try {
							method = self[obj.action];
						} catch (e) {
							throw 'a5.cl.CLWorkerOwner Error: invalid action ' + obj.action + ' on class ' + self.namespace();
						}
						if (method) method.apply(null, obj.id || []);
					}
				}
				if (workerURL && 'Worker' in window) {
					this._cl_communicator = new Worker(workerURL);
					this._cl_communicator.onmessage = function(e){
						handleMessages(self._cl_JSON.parse(e.data));
					}
				} else {
					var runInstance;
					this._cl_communicator = {
						postMessage: function(e){
							e = self._cl_JSON.parse(e);
							if (e.init) {
								runInstance = a5.Create(e.init, ['_cl_isWorkerInitializer']);
								runInstance._cl_setCommunicator({
									postMessage: function(obj){
										obj = self._cl_JSON.parse(obj);
										handleMessages(obj);
									}
								});
								runInstance.defineWorkerMethods(runInstance, data);
							} else if (e.destroy) {
								//Do nothing in main thread
							} else {
								runInstance[e.action].apply(self, e.id);
							}
						}
					}
				}
				this._cl_postMessage({
					init: this.namespace(),
					includes: includes,
					data: data
				});
			} else {
				self.redirect(500, 'Cannot call createWorker from worker methods.');
			}
		}
		
		/**
		 * @name callMethod
		 * @param {String} action
		 * @param {Array} [id]
		 */
		proto.callMethod = function(action, id){
			this._cl_postMessage({action:action, id:id});
		}
		
		/**
		 * @name log
		 * @param {String} value
		 */
		proto.Override.log = function(value){
			if(this._cl_isWorker)
				this._cl_postMessage({log:value});
			else 
				proto.superclass().log.apply(this, arguments);
		}
		
		/**
		 * @name throwError
		 * @param {Object|String} value
		 */
		proto.Override.throwError = function(error){
			//TODO: get stack from worker thread before passing along
			if(this._cl_isWorker)
				proto.throwError(error, false, this.throwError.caller.arguments);
			else
				proto.superclass().throwError.apply(this, arguments);
		}
		
		proto._cl_setCommunicator = function(communicator){
			if(this._cl_isWorker)
				this._cl_communicator = communicator;
		}
		
		proto._cl_postMessage = function(message){
			this._cl_communicator.postMessage(this._cl_JSON.stringify(message));
		}
		
		proto.dealloc = function(){
			if(!this._cl_isWorker)
				this.callMethod('destroy');
		}			
});