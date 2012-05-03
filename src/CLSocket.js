
/**
 * @class Base class for web sockets in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLSocket
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Prototype('CLSocket', 'abstract', function(proto, im, CLSocket){
		
		CLSocket.supportsSockets = function(){
			return 'WebSocket' in window ? true : false;
		}
		
		/**#@+
	 	 * @memberOf a5.cl.CLSocket#
	 	 * @function
		 */		
		
		proto.CLSocket = function(){
			proto.superclass(this);
			this._cl_socket = null;
			var self = this;
			this._cl_socketOnMessage = function(e){
				var data = self.isJson() ? a5.cl.core.JSON.parse(e.data):e.data;
				self.dataReceived(data);
			}
		}
		
		/**
		 * 
		 * @name initialize
		 * @param {String} url
		 * @return {Boolean} success
		 */
		proto.Override.initialize = function(url){
			if (this.supportsSockets()){
				this._cl_socket = new WebSocket(url);
				return true;
			} else {
				return false;
			}
		}
		
		/**
		 * Performs a call on the socket. createSocket must be called first.
		 * @name send
		 * @param {String} message The message to send to the socket.
		 * @param {Function} [callback] A function to pass returned results to.
		 */
		proto.send = function(m, callback){
			if (this.supportsSockets()) {
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
		 * @name dataReceived
		 * @param {String|Object} message
		 */
		proto.dataReceived = function(data){
			
		}
		
		/**
		 * @name supportsSockets
		 */
		proto.supportsSockets = function(){
			return CLSocket.supportsSockets;
		}
		
		/**
		 * @name close
		 */
		proto.close = function(){
			if(this._cl_socket) this._cl_socket.close();
		}	
		
		proto.dealloc = function(){
			if(this._cl_socket && this._cl_socket.readyState === 2) this.closeSocket();
		}
});