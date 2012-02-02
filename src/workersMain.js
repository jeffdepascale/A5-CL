
var runInstance;
var window = worker = this;
var errorStopped = false;

throwError = function(error, fromError, args){
	var value;
	if(typeof error == 'string')
		value = {message:error};
	else
		value = {
		message:error.message,
		stack:error.stack,
		lineNumber:error.lineNumber,
		fileName:error.fileName,
		args:args
	}
	errorStopped = true;
	value.fromError = fromError == false? false:true;
	worker.postMessage(JSON.stringify({error:value}));
}


window.onerror = function(e){
	throwError(e);
}

worker.onmessage = function(e){
	if (!errorStopped) {
		var data = JSON.parse(e.data);
		if (data.init) {
			if (data.includes) {
				try {
					for (var i = 0; i < data.includes.length; i++) 
						importScripts(data.includes[i]);
				} catch (e) {
					throwError(e);
					return;
				}
			}
			a5.Package('a5.cl').Extends('a5.EventDispatcher').Prototype('CLBase', function(proto){
				
				proto.CLBase = function(){
					proto.superclass(this);
				}
				
				proto.mvcName = proto.cl = proto.getClassInstance = proto.redirect = proto.config = proto.plugins = proto.appParams = function(){
					throwError('Cannot access MVC methods of CLBase from worker thread.', false);
				}
				
			})
			try {
				runInstance = a5.Create(data.init, ['_cl_isWorkerInitializer']);
			} catch (e) {
				throwError(e);
				return;
			}
			runInstance._cl_setCommunicator(worker);
			runInstance.defineWorkerMethods(runInstance, data);
		} else if (data.destroy) {
			runInstance.destroy();
		} else {
			runInstance[data.action].apply(runInstance, data.id);
		}
	}
}	