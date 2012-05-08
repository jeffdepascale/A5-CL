
/**
 * Base class for web socket consumers in the A5 CL framework.
 */
a5.Package('a5.cl')
	
	.Import('a5.cl.core.JSON')
	.Extends('CLService')
	.Static(function(CLSocket){
		
		/**
		 * Returns whether the application context has support for the HTML5 WebSocket API, required for CLSocket usage.
		 */
		CLSocket.supportsSockets = function(){
			return 'WebSocket' in window ? true : false;
		}	
		
	})
	.Prototype('CLSocket', 'abstract', function(proto, im, CLSocket){
		
		this.Properties(function(){
			this._cl_socket = null;
			this._cl_socketOnMessage = null;
		})
		
		/**
		 * Constructor for a CLSocket instance.
		 * @param {String} url The location of the socket endpoint.
		 */
		proto.CLSocket = function(url){
			proto.superclass(this, [url]);
			if (CLSocket.supportsSockets()) {
				this._cl_socket = new WebSocket(url);
				var self = this;
				this._cl_socketOnMessage = function(e){
					var data = self.isJson() ? im.JSON.parse(e.data) : e.data;
					self.dataReceived(data);
				}
			}
		}
		
		/**
		 * Performs a call on the socket endpoint.
		 * @param {String} message The message to send to the socket.
		 * @param {Function} [callback] A function to pass returned results to.
		 */
		proto.send = function(m, callback){
			if (CLSocket.supportsSockets()) {
				var self = this;
				self._cl_socket.onmessage = self._cl_socketOnMessage;
				var sendMsg = function(){
					self._cl_socket.onopen = null;
					if (callback) {
						self._cl_socket.onmessage = function(e){
							var data = self.isJson() ? a5.cl.core.JSON.parse(e.data) : e.data;
							callback(data);
							self._cl_socket.onmessage = self._cl_socketOnMessage;
						}
					}
					self._cl_socket.send(m);
					return null;
				}
				switch (this._cl_socket.readyState) {
					case 0:
						this._cl_socket.onopen = sendMsg;
						break;
					case 1:
						sendMsg();
						break;
					case 2:
						this._cl_socket.onopen = sendMsg;
						this._cl_socket.connect();
						break;
				}
			} else {
				throw 'Error sending data to socket ' + this.mvcName() + ', Web Sockets are not supported in this browser.';
			}
		}
		
		
		/**
		 * Override to receive data from the socket connection.
		 * @param {String|Object} message The returned data, either an object or a string depending on the value of the isJson setting.
		 */
		proto.dataReceived = function(data){
			
		}
		
		/**
		 * Closes the socket connection.
		 */
		proto.close = function(){
			if(this._cl_socket) this._cl_socket.close();
		}	
		
		proto.dealloc = function(){
			if(this._cl_socket && this._cl_socket.readyState === 2) this.close();
		}
});