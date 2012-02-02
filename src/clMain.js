
/** @name a5.cl
 * @namespace Framework classes.
 */
a5.SetNamespace('a5.cl'); 

/**
 * @function
 * @type a5.cl.CL
 * @returns Shortcut to the instance of the A5 CL application.
 */
a5.cl.instance = function(val){
	return a5.cl.CL.instance(val);
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
a5.cl.CreateApplication = function(props){
	if (!a5.cl._cl_appCreated) {
		a5.cl._cl_appCreated = true;
		a5.cl.Mappings = a5.cl.Filters = 
		a5.cl.AppParams = a5.cl.Config = 
		a5.cl.BootStrap = function(){
			a5.cl.core.Utils.generateSystemHTMLTemplate(500, "Invalid call to CL configuration method: methods must be called prior to application launch", true);
		}
		var props = (props === undefined ? undefined:((typeof props === 'object') ? props : {applicationPackage:props}));
		var initialized = false;
		var onDomReady = function(){
			if (!props) {
				var str = 'CreateApplication requires at least one parameter:\n\na5.cl.CreateApplication("app");';
				a5.cl.core.Utils.generateSystemHTMLTemplate(500, str, true);
				throw str;
			} else {
				if (!initialized) a5.Create(a5.cl.CL, [props])
				initialized = true;
			}
		}
	
		var domContentLoaded = function(){
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

a5.cl._cl_appCreated = false;

a5.cl._cl_storedCfgs = { mappings:[], filters:[], config:[], appParams:{}, pluginConfigs:[], bootStrap:null };

/**
 * 
 * @param {Array} array
 */
a5.cl.Mappings = function(array){ a5.cl._cl_storedCfgs.mappings = array; }

/**
 * 
 * @param {Array} array
 */
a5.cl.Filters = function(array){ a5.cl._cl_storedCfgs.filters = array; }

/**
 * 
 * @param {Object} obj
 */
a5.cl.AppParams = function(obj){ a5.cl._cl_storedCfgs.appParams = obj; }

/**
 * 
 * @param {Object} obj
 */
a5.cl.Config = function(obj){ a5.cl._cl_storedCfgs.config = obj; }

/**
 * 
 * @param {string} namespace
 * @param {Object} obj
 */
a5.cl.PluginConfig = function(namespace, obj){ a5.cl._cl_storedCfgs.pluginConfigs.push({nm:namespace, obj:obj}); }

/**
 * 
 * @param {Function} func
 */
a5.cl.BootStrap = function(func){ a5.cl._cl_storedCfgs.bootStrap = func; }
