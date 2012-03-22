
/** @name a5.cl
 * @namespace Framework classes.
 */
a5.SetNamespace('a5.cl'); 

/**
 * @function
 * @type a5.cl.CL
 * @returns Shortcut to the instance of the A5 CL application.
 */
a5.cl.instance = function(){
	return a5.cl.CL.instance();
}

/**
 * @function
 * Initializes an instance of the A5 CL framework.
 * @param {Object|String} props
 * @param {String} [props.applicationPackage]
 * @param {String|a5.cl.CLApplication} [props.application]
 * @param {String} [props.rootController]
 * @param {String} [props.rootViewDef]
 * @param {String} [props.environment]
 * @param {String} [props.clientEnvironment]
 * @type Function
 * @returns A function that returns the singleton instance of the application framework.
 */
a5.cl.CreateApplication = function(props, callback){
	if (!a5.cl.instance()) {
		if(typeof props === 'function'){
			callback = props;
			props = undefined;
		}
		if(props === undefined)
			props = {};
		if(callback && typeof callback === 'function')
			a5.CreateCallback(callback);
		
		var initialized = false,

		onDomReady = function(){
			if (!props && a5.cl.CLMain._extenderRef.length === 0) {
				var str = 'CreateApplication requires at least one parameter:\n\na5.cl.CreateApplication("app"); or a class that extends a5.cl.CLMain.';
				a5.cl.core.Utils.generateSystemHTMLTemplate(500, str, true);
				throw str;
			} else {
				if (!initialized) {
					a5.Create(a5.cl.CL, [props])
					initialized = true;
					for(var i = 0, l = a5.cl._cl_createCallbacks.length; i<l; i++)
						a5.cl._cl_createCallbacks[i](a5.cl.instance());
					a5.cl._cl_createCallbacks = null;
				}
			}
		},
	
		domContentLoaded = function(){
			if (document.addEventListener) {
				document.removeEventListener( "DOMContentLoaded", domContentLoaded, false);
				onDomReady();
			} else if ( document.attachEvent ) {
				if ( document.readyState === "complete" ) {
					document.detachEvent("onreadystatechange", domContentLoaded);
					onDomReady();
				}
			}
		}
		
		if (document.readyState === "complete") {
			onDomReady();
		} else if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", domContentLoaded, false);
		} else if (document.attachEvent) {
			document.attachEvent("onreadystatechange", domContentLoaded);
		}
		return function(){
			return a5.cl.CL.instance();
		}
	} else {
		throw "Error: a5.cl.CreateApplication can only be called once.";
	}
}

a5.cl._cl_createCallbacks = [];

a5.cl.CreateCallback = function(callback){
	a5.cl._cl_createCallbacks.push(callback);
}

