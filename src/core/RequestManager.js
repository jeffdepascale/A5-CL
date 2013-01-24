
/**
 * @class Handles all xhr/ajax requests.
 * @name a5.cl.core.RequestManager
 */
a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("RequestManager", 'final', function(self, im){
		
		var defaultContentType,
			defaultMethod,
			reqArray,
			asyncRunning = false,
			reqCount;
	
		this.RequestManager = function(defMethod, defType){
			self.superclass(this, arguments);
			reqArray = [];
			reqCount = 0;
			defaultContentType = defType;
			defaultMethod = defMethod;
		}
		
		this.asyncRunning = function(){
			return asyncRunning;
		}

		this.processItem = function(props, reqID){
			var req;
			var reqComplete = function($req){
				if (getPropsForID(reqID)) {
					var req = this;
					if (req.readyState == 4) {
						var response, retData, status = req.status;
						if (status !== 500) {
							if (props.isJson) {
								response = req.responseText;
								
								if (a5.cl.core.Utils.trim(response) !== "") {
									try {
										response = a5.cl.core.JSON.parse(response);
										retData = (props.dataProp && props.dataProp !== undefined) ? response[props.dataProp] : response;
									} 
									catch (e) {
										status = 500;
										retData = "Error parsing JSON response from url: " + props.url + "\nresponse: " + response;
									}
								}
							}
							else 
								if (props.isXML && req.responseXML) {
									response = req.responseXML;
								}
								else {
									response = req.responseText;
								}
							if (retData === undefined) 
								retData = response;
						}
						if (status == 200 || (status == 0)) {
							self.success(reqID, retData);
						}
						else {
							self.onError(reqID, status, retData || req.responseText);
						}
						self.reqComplete(reqID);
					}
				}
			},
			
			updateProgress = function(e){
				self.updateProgress(reqID, e);
			},
			
			onError = function(e){
				self.onError(reqID, req.status, e);
			},
			
			createAppend = function(data, isGet){
				var retString = isGet ? '?':'';
				for(var prop in data)
					retString += prop + '=' + data[prop] + '&';
				return retString.substr(0, retString.length-1);
			},
			
			contentType = null;
				req = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP.3.0');
			if (req !== undefined) {
				var method = props.method || defaultMethod,
					data = props.data || null,
					urlAppend = method == "GET" ? createAppend(props.data, true) : '';
				if (data) {
					if (props.formData === true) {
						contentType = "multipart/form-data";
						var fd = new FormData();
						for (var prop in data) 
							fd.append(prop, data[prop])
						data = fd;
					} else if (props.isJson) {
						data = a5.cl.core.JSON.stringify(data);
					} else {
						contentType = 'application/x-www-form-urlencoded';
						data = createAppend(data, false);
					}
				}
				if(contentType === null)
					 contentType = defaultContentType;
				if(props.contentType)
					contentType = props.contentType;
				props.isJson = props.isJson !== undefined ? props.isJson:(contentType && contentType.toLowerCase().indexOf('json') != -1 ? true : false);
				props.isXML = (!props.isJson && contentType.toLowerCase().indexOf('xml')) != -1 ? true : false;
				props.charSet = props.charSet || null;
				if (req.addEventListener != undefined) req.addEventListener("progress", updateProgress, false);
				if (XMLHttpRequest) req.onerror = onError;
				req.onreadystatechange = reqComplete;
				req.open(method, props.url + urlAppend, true);
				if(props.formData !== true)
					req.setRequestHeader("Content-type", contentType);
				if (props.charSet) req.setRequestHeader("charset", props.charSet);
				req.send(data);
			} else {
				if (props.error) props.error('client does not support XMLHTTPRequests');
			}
		}
		
		this.abortRequest = function(id){
			for (var i = 0; i < reqArray.length; i++) {
				if (reqArray[i].id === id) {
					reqArray[i].abort();
					reqArray.splice(i, 1);
					return;
				}
			}
			self.redirect(500, 'Cannot abort request; invalid identifier sent to abortRequest method.');
		}
		
		/**
		 * @function
		 * @name a5.cl.core.RequestManager#makeRequest
		 */
		this.makeRequest = function(props){
			if ((reqArray.length === 0 || isSilent()) && props.silent !== true) {
				asyncRunning = true;
				self.cl().dispatchEvent(im.CLEvent.ASYNC_START);
			}
			var reqID = reqCount++;
			props.url = a5.cl.core.Utils.makeAbsolutePath(props.url);
			var obj = {props:props,
				id:reqID,
				abort:function(){
						self.abortRequest(this.id);
					}
				};
			reqArray.push(obj);
			self.processItem(props, reqID);
			return obj;
		}
		
		this.success = function(id, data){
			var props = getPropsForID(id);
			if(props.success) props.success.call(self, data);
		}
		
		this.reqComplete = function(id){
			unqueueItem(id);
			if (reqArray.length === 0 || checkSilentReq()) {
				asyncRunning = false;
				self.cl().dispatchEvent(im.CLEvent.ASYNC_COMPLETE);
			}
		}
		
		this.updateProgress = function(id, e){
			var props = getPropsForID(id);
			if(props.progress) props.progress.call(self, e);
		}
		
		this.onError = function(id, status, errorObj){
			if (status != 200 && status != 0) {
				var props = getPropsForID(id);
				if (props && props.error) props.error.call(self, status, errorObj);
				else this.throwError(errorObj);
			}
		}
		
		var checkSilentReq = function(){
			for(var i =0, l = reqArray.length; i<l; i++)
				if(reqArray[i].props.silent !== true)
					return false;
			return true;
		}
		
		var getPropsForID = function(id){
			for(var i = 0, l=reqArray.length; i<l; i++)
				if(reqArray[i].id == id)
					return reqArray[i].props;
		}
		
		var unqueueItem = function(value){
			var isNumber = typeof value == 'number';
			for (var i = 0, l=reqArray.length; i < l; i++) {
				if ((isNumber && reqArray[i].id == value) || reqArray[i] == value) {
					reqArray.splice(i, 1);
					return;
				}
			}
		}
		
		var isSilent = function(){
			for (var i = 0, l = reqArray.length; i < l; i++) {
				if(reqArray[i].props.silent === true)
					return true;
			}
			return false;
		}
	
});