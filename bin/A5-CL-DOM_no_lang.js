

(function(global) {
a5.SetNamespace('a5.cl', true, function(){

    var initializer = null,
		inst,
        createCalled = false,
        createCallbacks = [];

    var Instance = function () {
        return inst;
    },

    /**
     * @function
     * Initializes an instance of the A5 CL framework.
     * @param {Object} props
     * @type Function
     * @returns A function that returns the singleton instance of the application framework.
     */
     CreateApplication = function(props, callback){
         if (!createCalled) {
             createCalled = true;

             if (a5.cl.CLMain._extenderRef.length === 0) {
                 var str = 'A5 CL requires a class that extends a5.cl.CLMain.';
                 throw str;
             } else {
                 if (typeof props === 'function') {
                     callback = props;
                     props = undefined;
                 }
                 if (props === undefined)
                     props = {};
                 if (callback && typeof callback === 'function')
                     CreateCallback(callback);
                 var initializeComplete = function () {
                    inst = new a5.cl.CL(props || {}, initializer);
                    for (var i = 0, l = createCallbacks.length; i < l; i++)
                        createCallbacks[i](inst);
                    createCallbacks = null;
					if(initializer !== null)
						initializer.applicationInitialized(inst);
					inst._cl_launch();
                 }

                 if (initializer !== null)
                     initializer.initialize(props, initializeComplete);
                 else
                     initializeComplete();

                 return function () {
                     return a5.cl.CL.instance();
                 }
             }
        } else {
            throw "Error: a5.cl.CreateApplication can only be called once.";
        }
     },

     RegisterInitializer = function(_initializer){
         if (initializer == null)
             initializer = _initializer;
         else
             throw "initializer error";
     },

     CreateCallback = function(callback){
         createCallbacks.push(callback);
     }

     return {
         Instance:Instance,
         CreateApplication:CreateApplication,
         RegisterInitializer: RegisterInitializer,
         CreateCallback:CreateCallback
     }
});




/**
 * Base class for all classes in an A5 CL application. 
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns a reference to the CL application instance.
		 * @return {a5.cl.CL}
		 */
		proto.cl = function(){
			return a5.cl.Instance();
		}
		
		/**
		 * Returns an instance of the class defined by the specified parameters
		 * @param {String} type A string value representing the type of class to instantiate. 'Service' is available by default, add-ons may register additional type names for instantiation. 
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooService', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * Sends a log value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		/**
		 * Sends a warn value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
		proto.warn = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.warn.apply(this, arguments);
			else
				if ('console' in window) 
					console.warn.apply(console, arguments);
		}
		
		/**
		 * Returns a reference to the plugins object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns a reference to the appParams object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
});



﻿a5.Package('a5.cl')

    .Extends('a5.cl.CLBase')
    .Prototype('CLInitializer', function (cls, im) {
		
        cls.CLInitializer = function () {
            cls.superclass(this);
            a5.cl.RegisterInitializer(this);
        }

        cls.initialize = function (props, callback) {
            throw "Classes extending CLInitializer must override initialize method without calling super.";
        }
		
		cls.load = function(arr, complete, progress){
			return false;
		}
		
		cls.applicationInitialized = function(inst){
		}
});


/**
 * Defines an error in A5 CL.
 */
a5.Package('a5.cl')

	.Extends('a5.Error')
	.Prototype('CLError', function(proto, im){
		
		proto.CLError = function(){
			proto.superclass(this, arguments);
			this.type = 'CLError';
		}
})



a5.Package('a5.cl')

	.Enum('CLLaunchState', function(cls){
		
		cls.addValue('APPLICATION_INITIALIZING');
		cls.addValue('DEPENDENCIES_LOADING');
		cls.addValue('DEPENDENCIES_LOADED');
		cls.addValue('AUTO_INSTANTIATION_COMPLETE');
		cls.addValue('PLUGINS_LOADED');
		cls.addValue('LAUNCH_INTERCEPTED');
		cls.addValue('APPLICATION_WILL_LAUNCH');
		cls.addValue('APPLICATION_LAUNCHED');
})


a5.Package('a5.cl')
	
	.Extends('a5.Event')
	.Static(function(CLEvent){
		
		/**
		 * @event
		 * @param {Boolean} online Specifies whether the browser is currently online.
		 * @description Dispatched when a change in the online status of the application occurs (HTML5 only).
		 */
		CLEvent.ONLINE_STATUS_CHANGE = 'onlineStatusChange';
		
		CLEvent.ERROR_THROWN = 'errorThrown';
		
		/**
		 * @event
		 * @description Dispatched when the dom has completely loaded, the framework has been successfully loaded to the dom, and the framework is starting instatiation. 
		 * */
		CLEvent.APPLICATION_INITIALIZING = "applicationInitializing";
		
		
		CLEvent.CORE_LOADED = "coreLoaded";
		/**
		 * @event
		 * @param {Number} count
		 * @param {Number} total
		 * @description Dispatched while dependencies are loading to the DOM.
		 */
		CLEvent.DEPENDENCIES_LOADING = "dependenciesLoading";
		
		/**
		 * @event
		 * @description Dispatched when all dependencies specified in the configuration file have been successfully loaded to the DOM.
		 */
		CLEvent.DEPENDENCIES_LOADED = 'dependenciesLoaded';
		
		/**
		 * @event
		 * @description Dispatched when auto detected classes have been successfully instantiated.
		 */
		CLEvent.AUTO_INSTANTIATION_COMPLETE = 'autoInstantiationComplete';
		
		/**
		 * @event
		 * @description Dispatched when all plugins have successfully loaded, if any.
		 */
		CLEvent.PLUGINS_LOADED = 'pluginsLoaded';
		
		/**
		 * 
		 */
		CLEvent.APPLICATION_PREPARED = 'applicationPrepared';
		
		/**
		 * @event
		 * @param {a5.cl.interfaces.ILaunchInterceptor} e.interceptor The plugin that has intercepted the launch.
		 * @description Dispatched when the application launch has been intercepted by a plugin that has registered to stall the application launch.
		 */
		CLEvent.LAUNCH_INTERCEPTED = 'launchIntercepted';
		
		/**
		 * @event
		 * @description Dispatched when the application is ready to initialize.
		 */
		CLEvent.APPLICATION_WILL_LAUNCH = 'applicationWillLaunch';
		
		/**
		 * @event
		 * @description Dispatched when the application has successfully initialized.
		 */
		CLEvent.APPLICATION_LAUNCHED = 'applicationLaunched';
		
		/**
		 * @event
		 * @description Dispatched when the window is about to be closed.
		 */
		CLEvent.APPLICATION_WILL_CLOSE = 'applicationWillClose';
		
		/**
		 * @event
		 * @description Dispatched when the window is closing.
		 */
		CLEvent.APPLICATION_CLOSED = 'applicationClosed';
		
		/**
		 * @event
		 * @param {Number} width
		 * @param {Number} height
		 * @description Dispatched when the window is resized.
		 */
		CLEvent.WINDOW_RESIZED = 'windowResized';
		
		/**
		 * @event
		 * @description Dispatched when the application is about to relaunch.
		 */
		CLEvent.APPLICATION_WILL_RELAUNCH = 'applicationWillRelaunch';
		
		
		/**
		 * @event
		 * @description Dispatched repeatedly at the specified update rate from {@link a5.cl.CLConfig#globalUpdateTimerInterval}.
		 */
		 CLEvent.GLOBAL_UPDATE_TIMER_TICK = 'globalUpdateTimerTick';
		
		/**
		 * @event
		 * @description Dispatched when async service requests start
		 */
		CLEvent.ASYNC_START = 'asyncStart';
		
		/**
		 * @event
		 * @description Dispatched when async service requests complete
		 */
		CLEvent.ASYNC_COMPLETE = 'asyncComplete';
		
		 /**
		 * @event
		 * @description Dispatched when the client orientation has changed. This is only dispatched for mobile or tablet client environments.
		 */
		CLEvent.ORIENTATION_CHANGED = 'orientationChanged';
		
		/**
		 * @event
		 * @description Dispatched when the client environment has switched. This is only relevant when the configuration flag 'clientEnvironmentOverrides' is set to true.
		 */
		CLEvent.CLIENT_ENVIRONMENT_UPDATED = 'clientEnvironmentUpdated';
		 /**
		 * @event
		 * @param {Number} errorType
		 * @description Dispatched when an application error occurs.
		 * 
		 */
		CLEvent.APPLICATION_ERROR = 'applicationError';
		
	})
	.Prototype('CLEvent', function(proto, im){
		
		proto.CLEvent = function(){
			proto.superclass(this, arguments);
		}	
});


a5.Package('a5.cl.interfaces')

	.Interface('IHTMLTemplate', function(cls){
		
		cls.populateTemplate = function(){}
})




a5.Package('a5.cl.interfaces')

	.Interface('ILogger', function(cls){
		
		cls.log = function(){}
})




a5.Package('a5.cl.interfaces')

	.Interface('IServiceURLRewriter', function(cls){
		
		cls.rewrite = function(){}
})



a5.Package('a5.cl.interfaces')

	.Interface('ILaunchInterceptor', function(cls){
		
		cls.interceptLaunch = function(){}
});


a5.Package('a5.cl.interfaces')
	.Interface('IDataCacheProvider', function(IDataCacheProvider){
		
		IDataCacheProvider.isAvailable = function(){};
		IDataCacheProvider.cacheExists = function(){};
		IDataCacheProvider.storeValue = function(){};
		IDataCacheProvider.getValue = function(){};
		IDataCacheProvider.clearValue = function(){};
		IDataCacheProvider.clearScopeValues = function(){};
		
});



a5.Package('a5.cl.interfaces')
	
	.Interface('IBindableReceiver', function(cls){
		
		cls.receiveBindData = function(){}
});


a5.Package('a5.cl.core')

	.Extends('a5.cl.CLBase')
	.Class('PluginManager', 'singleton final', function(self){
	
		var plugins = [],
			addOns = [],
			processes = {
				animation:null,
				htmlTemplate:null,
				serviceURLRewriter:null,
				logger:null,
				dataCacheProvider:null,
				launchInterceptor:null,
				presentationLayer:null
			}
		
		this.PluginManager = function(){
			self.superclass(this);
			self.plugins()['getRegisteredProcess'] = this.getRegisteredProcess;
		}
		
		this.instantiatePlugins = function(){
			var classes = [], i, l, plugin, pi, cfg, obj;
			for(i = 0, l=a5.cl.CLPlugin._extenderRef.length; i<l; i++)
				if(a5.cl.CLPlugin._extenderRef[i] !== a5.cl.CLAddon)
					classes.push(a5.cl.CLPlugin._extenderRef[i]);
			for (i = 0, l = a5.cl.CLAddon._extenderRef.length; i < l; i++) {
				addOns.push(a5.cl.CLAddon._extenderRef[i]);
				classes.push(a5.cl.CLAddon._extenderRef[i]);
			}
			for(i = 0, l=classes.length; i<l; i++){
				plugin = classes[i];
				if (!plugin.isAbstract()) {
					pi = plugin.instance(true);
					cfg = pi._cl_sourceConfig(); 
					obj = a5.cl.core.Utils.mergeObject(cfg || {}, pi.configDefaults());
					pi._cl_isFinal = pi._cl_isSingleton = true;
					if (!a5.cl.core.Utils.testVersion(pi.requiredVersion())) {
						throw 'Error - plugin "' + plugin.className() + '" requires at least CL version ' + pi.requiredVersion();
						return;
					}
					if (pi.maxVerifiedVersion() && !self.config().allowUntestedPlugins && !a5.cl.core.Utils.testVersion(pi.maxVerifiedVersion(), true)) {
						throw 'Error - untested version';
						return;
					}
					pi._cl_pluginConfig = obj;
					
					if (pi instanceof a5.cl.CLAddon) {
						if (a5.cl.CLBase.prototype[plugin.className()] === undefined) {
							a5.cl.CLBase.prototype[plugin.className()] = function(){
								var p = pi;
								return function(){
									return p;
								}
							}()
							
						}
					} else {
						if (self.plugins()[plugin.className()] == undefined) {
							self.plugins()[plugin.className()] = function(){
								var p = pi;
								return function(){
									return p;
								}
							}()
						}
					}
					plugins.push(pi);
				}
			}
			for(var i = 0, l=plugins.length; i<l; i++){
				var checkResult = checkRequires(plugins[i]);
				if(checkResult){
					throw 'Error: plugin "' + plugins[i].className() + '" requires plugin "' + checkResult;
					return;
				}
				plugins[i].initializePlugin();
					
			}
			a5.cl.PluginConfig = function(){
				throw new a5.cl.CLError('Invalid call to MVC pluginConfig method: method must be called prior to plugin load.');
			}
		}
		
		this.defineRegisterableProcess = function(process){
			processes[process] = null;
		}
		
		this.registerForProcess = function(type, instance){
			var val = processes[type];
			if(val === null)
				processes[type] = instance;
			else if (val === undefined)
				self.redirect(500, "Error registering process for type '" + type + "', type does not exist.");
			else
				self.warn("Multiple plugins trying to register for process '" + type + "'.");
		}
		
		this.getRegisteredProcess = function(type){
			return processes[type];
		}
		
		this.processAddons = function(callback){
			var count = 0,
			processAddon = function(){
				if (count >= addOns.length) {
					callback();
					return;
				} else {
					var addOn = addOns[count].instance(),
						isAsync = addOn.initializeAddOn() === true;
					count++;
					if (isAsync) addOn.addOneTimeEventListener(a5.cl.CLAddon.INITIALIZE_COMPLETE, processAddon);
					else processAddon();
				}
			} 
			processAddon();
		}
		
		var checkRequires = function(plugin){
			var r = plugin._cl_requires;
			for(var i = 0, l = r.length; i<l; i++){
				if(!a5.GetNamespace(r[i], null, true))
					return r[i];	
			}
			return false;
		}
});


a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLBase') 
	.Class('Instantiator', 'singleton final', function(self, im){
	
		var applicationPackage,
		_applicationPackageInstance,
		namespaceArray = [['services', [a5.cl.CLService, a5.cl.CLSocket, a5.cl.CLAjax]]];
		
		this.Instantiator = function($applicationPackage){
			self.superclass(this);
			applicationPackage = $applicationPackage;
			_applicationPackageInstance = a5.SetNamespace(applicationPackage);
		}
		
		this.applicationPackage = function(returnString){
			if(returnString) return applicationPackage;
			else return _applicationPackageInstance;
		}
		
		this.registerAutoInstantiate = function(name, clsArray){
			namespaceArray.push([name, clsArray]);
		}
		
		this.Override.getClassInstance = function(type, className, instantiate){
			var instance = null,
			namespace = null;
			if(className.indexOf('.') !== -1)
				namespace = a5.GetNamespace(className);
			else 
				namespace = getClassNamespace(type, className);
			if(namespace)
				instance = namespace.instance(!!instantiate);
			return instance;
		}
		
		this.createClassInstance = function(clsName, type){
			var cls = getClassNamespace(type, clsName),
			instance,
			clsPath = null;
			if (cls) {
				var clsInstance;
				clsInstance = (cls._a5_instance === null) ? new cls() : cls.instance();
				clsInstance._cl_setMVCName(clsName);
				return clsInstance;
			} else {
				return null;
			}
		}
		
		this.instantiateConfiguration = function(){
			var retObj = a5.cl.CLMain._cl_storedCfgs.config;
			var plgnArray = a5.cl.CLMain._cl_storedCfgs.pluginConfigs;
			for (var i = 0; i < plgnArray.length; i++) {
				var obj = {};
				var split = plgnArray[i].nm.split('.'),
					lastObj = obj;
				for(var j = 0; j< split.length; j++)
					lastObj = lastObj[split[j]] = j == split.length-1 ? plgnArray[i].obj:{};
				retObj.plugins = a5.cl.core.Utils.mergeObject(retObj.plugins, obj)
			}
			return retObj;
		}
		
		this.beginInstantiation = function(){
			for(var i = 0, l=namespaceArray.length; i<l; i++){
				var liveNamespace = a5.GetNamespace(applicationPackage + '.' + namespaceArray[i][0], null, true);
				if(liveNamespace && typeof liveNamespace == 'object'){
					for (var prop in liveNamespace) 
						if (typeof liveNamespace[prop] === 'function') {
							var instance = new liveNamespace(prop);
							liveNamespace[prop]._cl_isFinal = true;
							if (namespaceArray[i][0] === 'domains') {
								instance._name = prop;
								liveNamespace[prop]._a5_isSingleton = true;
							} else {
								instance._name = prop.substr(0, prop.toLowerCase().indexOf(namespaceArray[i][0].substr(0, namespaceArray[i][0].length - 1)));
							}
							var isValid = false;
							for(var j = 0, m=namespaceArray[i][1].length; j<m; j++)
								if(instance instanceof namespaceArray[i][1][j])
									isValid = true;
							if(!isValid)
								self.redirect(500, 'Error instantiating ' + namespaceArray[i][0] + ' class ' + instance.namespace() + ', must extend ' + namespaceArray[i][1].namespace());
						}
				}
			}
			self.cl().dispatchEvent(im.CLEvent.AUTO_INSTANTIATION_COMPLETE);
		}
		
		var getClassNamespace = function(type, clsName){							   
			return a5.GetNamespace(applicationPackage + '.' + type.toLowerCase() + 's.' + clsName + (type == 'domain' ? '':(type.substr(0, 1).toUpperCase() + type.substr(1))));
		}
})


a5.Package('a5.cl.core')
	.Static('Utils', function(Utils){
		
		Utils.isAbsolutePath = function(url){
			return (url.indexOf('://') !== -1 || url.substr(0, 1) == '/');
		}
		
		Utils.makeAbsolutePath = function(url){
			return Utils.isAbsolutePath(url) ? (url.substr(0, 1) == '/' ? a5.cl.Instance().initializer().environmentManager().appPath(true) + url:url):(a5.cl.Instance().initializer().environmentManager().appPath() + url);
		}
		
		
		Utils.trim = function(str){
			if(!str) return str;
			return str.replace(/(^\s+)|(\s+$)/g, "").replace(/\s{2,}/, " ");
		}
		
		Utils.mergeObject = function(mergeObj, sourceObj, $setSourceObj){
			var setSourceObj = $setSourceObj || false,
				retObj, prop;
			if(mergeObj == null) return sourceObj;
			if(sourceObj == null) return mergeObj;
			function recursiveMerge(sourceObj, mergeObj){
				for(prop in mergeObj){
					if(prop !== 'prototype' && prop !== 'constructor'){
						if (sourceObj[prop] !== undefined && sourceObj[prop] !== null && sourceObj[prop] !== sourceObj) {
							if (typeof sourceObj[prop] === 'object') {
								if (Object.prototype.toString.call(sourceObj[prop]) === '[object Array]') {
									if (Object.prototype.toString.call(mergeObj[prop]) === '[object Array]') 
										sourceObj[prop] = sourceObj[prop].concat(mergeObj[prop]);
								} else {
									sourceObj[prop] = recursiveMerge(sourceObj[prop], mergeObj[prop]);
								}
							} else {
								sourceObj[prop] = mergeObj[prop];
							}
						}  else {
							sourceObj[prop] = mergeObj[prop];
						}
					}
				}
				return sourceObj;
			}
			retObj = recursiveMerge(sourceObj, mergeObj);
			if(setSourceObj) sourceObj = retObj;
			return retObj;
		}
		
		Utils.deepClone = function(obj){
              if (typeof obj !== 'object' || obj == null) {
                  return obj;
              }
              var c = Utils.isArray(obj) ? [] : {};
              for (var i in obj) {
                  var value = obj[i];
                  if (typeof value == 'object') {
                     if (Utils.isArray(value)) {
                         c[i] = [];
                         for (var j = 0, l=value.length; j < l; j++) {
                             if (typeof value[j] != 'object') c[i].push(value[j]);
                             else c[i].push(Utils.deepClone(value[j]));
                         }
                     } else {
                         c[i] = Utils.deepClone(value);
                     }
                  } else {
                     c[i] = value;
                  }
              }
              return c;
          }

		
		Utils.initialCap = function(str){
			return str.substr(0, 1).toUpperCase() + str.substr(1);
		}
		
		Utils.validateHexColor = function(color){
			return /^#(([a-fA-F0-9]){3}){1,2}$/.test(color);
		}
		
		Utils.expandHexColor = function(color){
			if(a5.cl.core.Utils.validateHexColor(color)){
				if(color.length === 4)
					return '#' + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);
				else
					return color;
			} else {
				return '#000000';
			}
		}
		
		Utils.arrayIndexOf = function(array, value){
			for(var x = 0, y = array.length; x < y; x++){
				if(array[x] === value) return x;
			}
			return -1;
		}
		
		Utils.arrayContains = function(array, value){
			return Utils.arrayIndexOf(array, value) !== -1;
		}
		
		Utils.isArray = function(array){
			return Object.prototype.toString.call(array) === '[object Array]';
		}
		
		Utils.testVersion = function(val, isMax){
			var parseVersionString = function(val) {
			    val = val.split('.');
			    return {
			        major: parseInt(val[0]) || 0,
			        minor: val.length > 1 && parseInt(val[1]) || 0,
			        build: val.length > 2 && parseInt(val[2]) || 0
			    }
			}
			
			isMax = isMax || false;
			var versionVal = parseVersionString(a5.Version()),
			testVal = parseVersionString(String(val));
			if (versionVal.major !== testVal.major)
		        return isMax ? (versionVal.major < testVal.major) : (versionVal.major > testVal.major);
		    else if (versionVal.minor !== testVal.minor)
	            return isMax ? (versionVal.minor < testVal.minor) : (versionVal.minor > testVal.minor);
	        else if (versionVal.build !== testVal.build)
                return isMax ? (versionVal.build < testVal.build) : (versionVal.build > testVal.build);
            else
                return true;
		}
		
		Utils.viewInStack = function(view){
			var appView = a5.cl.mvc.core.AppViewContainer.instance();
			while(view){
				if(view === appView)
					return true;
				view = view.parentView();
			}
			return false;
		}
});



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
			try {	
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
			} catch (e) {
				req = null;
				self.throwError(e);
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


/**
 * @class An implementation of JSON2 by Douglas Crockford 
 * @see <a href="http://www.json.org">www.json.org</a>
 * @name a5.cl.core.JSON
 */
a5.cl.core.JSON = function(){
		
	var self = this;
		
	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = { // table of character substitutions
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"': '\\"',
		'\\': '\\\\'
	}, rep;
	
	var init = function(){
		if (typeof Date.prototype.toJSON !== 'function') {
			Date.prototype.toJSON = function(key){
				return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' +
				f(this.getUTCMonth() + 1) +
				'-' +
				f(this.getUTCDate()) +
				'T' +
				f(this.getUTCHours()) +
				':' +
				f(this.getUTCMinutes()) +
				':' +
				f(this.getUTCSeconds()) +
				'Z' : null;
			};
			String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key){
				return this.valueOf();
			};
		}
	}
	
	/**
	 * @memberOf a5.cl.core.JSON
	 * @param {Object} value
	 * @param {Object} replacer
	 * @param {Object} space
	 */
	var stringify = function(value, replacer, space){
		var i;
		gap = '';
		indent = '';
		
		if (typeof space === 'number') {
			for (i = 0; i < space; i += 1) {
				indent += ' ';
			}
		}
		else 
			if (typeof space === 'string') {
				indent = space;
			}
		
		rep = replacer;
		if (replacer && typeof replacer !== 'function' &&
		(typeof replacer !== 'object' ||
		typeof replacer.length !== 'number')) {
			throw 'JSON stringify error.';
		}
		return str('', {
			'': value
		});
	};
	
	/**
	 * @memberOf a5.cl.core.JSON
	 * @param {Object} text
	 * @param {Object} reviver
	 */
	var parse = function(text, reviver){
		var j;
		function walk(holder, key){
			var k, v, value = holder[key];
			if (value && typeof value === 'object') {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) {
							value[k] = v;
						}
						else {
							delete value[k];
						}
					}
				}
			}
			return reviver.call(holder, key, value);
		}
		
		text = String(text);
		cx.lastIndex = 0;
		if (cx.test(text)) {
			text = text.replace(cx, function(a){
				return '\\u' +
				('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			});
		}
		if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
			j = eval('(' + text + ')');
			return typeof reviver === 'function' ? walk({
				'': j
			}, '') : j;
		}
		throw new SyntaxError('JSON.parse');
	};
	
	var f = function(n){
		return n < 10 ? '0' + n : n;
	}
	
	function quote(string){
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' +
		string.replace(escapable, function(a){
			var c = meta[a];
			return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) +
		'"' : '"' + string + '"';
	}
	
	function str(key, holder){
		var i, k, v, length, mind = gap, partial, value = holder[key];
		
		if (value && typeof value === 'object' &&
		typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}
		
		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}
		
		switch (typeof value) {
			case 'string':
				return quote(value);
			case 'number':
				return isFinite(value) ? String(value) : 'null';
			case 'boolean':
			case 'null':
				return String(value);
			case 'object':
				if (!value) {
					return 'null';
				}
				gap += indent;
				partial = [];
				if (Object.prototype.toString.apply(value) === '[object Array]') {
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}
					v = partial.length === 0 ? '[]' : gap ? '[\n' + gap +
					partial.join(',\n' + gap) +
					'\n' +
					mind +
					']' : '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}
				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						k = rep[i];
						if (typeof k === 'string') {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}
				else {
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}
				v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
				mind +
				'}' : '{' + partial.join(',') + '}';
				gap = mind;
				return v;
		}
	}
	
	init();
	
	return {
		stringify:stringify,
		parse:parse			
	}
}();



a5.Package("a5.cl.core")
	.Static(function(DataCache){
		
		DataCache.enabled = function(){
			return DataCache.instance().enabled();
		}
		
		DataCache.cacheExists = function(){
			return DataCache.instance().cacheExists();
		}
		
		DataCache.isAvailable = function(){
			return DataCache.instance().isAvailable();
		}
		
		DataCache.storeValue = function(key, value){
			return DataCache.instance().storeValue(key, value);
		}
		
		DataCache.getValue = function(key){
			return DataCache.instance().getValue(key);
		}
		
		DataCache.clearValue = function(key){
			return DataCache.instance().clearValue(key);
		}
		
		DataCache.clearScopeValues = function(scope, exceptions){
			return DataCache.instance().clearScopeValues(scope, exceptions);
		}
		
		DataCache.validateCacheKeyPrefix = function(key){
			return DataCache.instance().validateCacheKeyPrefix(key);
		}
		
		DataCache.removeCacheKeyPrefix = function(key){
			return DataCache.instance().removeCacheKeyPrefix(key);
		}
	})
	.Extends("a5.cl.CLBase")
	.Class("DataCache", 'singleton final', function(self, im){
		
		var _enabled,
			cacheKeys,
			provider;
		
		this.DataCache = function(cacheEnabled){
			self.superclass(this); 
			_enabled = cacheEnabled;
			cacheKeys = [];
		}
		
		this.enabled = function(){
			return _enabled;
		}

		this.isAvailable = function(){
			getCacheProvider().isAvailable();
		}
		
		this.cacheExists = function(){
			return getCacheProvider().cacheExists();
		}
		
		this.storeValue = function(key, value){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().storeValue(key);
			else
				return false;
		}
		
		this.getValue = function(key){			
			if (self.isAvailable() && checkCacheKey(key)) 
				return getCacheProvider().getValue(key);
		}
		
		this.clearValue = function(key){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().clearValue(key);
		}
		
		this.clearScopeValues = function(scope, $exceptions){		
			return getCacheProvider().clearScopeValues(scope, $exceptions);
		}		
		
		this.validateCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++)
				if(cacheKeys[i] == key)
					return false;
			cacheKeys.push(key);
			return true;
		}
		
		this.removeCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if(cacheKeys[i] == key){
					cacheKeys.splice(i, 1);
					return;
				}
			}
		}
		
		var checkCacheKey = function(key){
			var isInCache = false;
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if (key.substr(cacheKeys[i]) != -1) {
					isInCache = true;
					break;
				}
			}
			return isInCache;
		}
		
		var getCacheProvider = function(){
			if (!provider) 
				provider = self.plugins().getRegisteredProcess('dataCacheProvider');
			return provider;
		}
	
	
});


a5.Package("a5.cl.core")

	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("GlobalUpdateTimer", 'singleton final', function(self, im){

		var timer,
		clInstance,
		interval,
		evtInstance = new im.CLEvent(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK);
		
		this.GlobalUpdateTimer = function(_interval){
			self.superclass(this);
			interval = _interval;
			clInstance = self.cl();
			evtInstance.shouldRetain(true);
		}
		
		this.startTimer = function(){
			if(!timer)
				timer = setInterval(update, interval);
		}
		
		this.stopTimer = function(){
			this._cl_killTimer();
		}
		
		var update = function(){
			clInstance.dispatchEvent(evtInstance);
		}
		
		this._cl_killTimer = function(){
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		}		
});


a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent', 'a5.cl.CLLaunchState')
	.Extends('a5.cl.CLBase')
	.Class("Core", 'singleton final', function(self, im){
	
		var _cache,
			_params,
			_requestManager,
			_globalUpdateTimer,
			_instantiator,
			_pluginManager,
			_launchState;
		
		this.Core = function(params){
			self.superclass(this); 
			_params = params;
			_instantiator = new im.Instantiator(params.applicationPackage);
		}
			
		this.instantiator = function(){ return _instantiator; }			
		this.cache = function(){	return _cache;	}
		this.requestManager = function(){ return _requestManager;	}	
		this.pluginManager = function(){ return _pluginManager; }			
		this.globalUpdateTimer = function(){return _globalUpdateTimer;}
		this.launchState = function(){ return _launchState; }
		
		this.relaunch = function(){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_RELAUNCH);
			window.location.reload();
		}
		
		this.config = function(){ return _params; }
		
		this.initializeCore = function($environment, $clientEnvironment){
			updateLaunchStatus('APPLICATION_INITIALIZING');
			_globalUpdateTimer = new im.GlobalUpdateTimer(_params.globalUpdateTimerInterval);
			_requestManager = new im.RequestManager(_params.requestDefaultMethod, _params.requestDefaultContentType);
			_pluginManager = new im.PluginManager();
			_cache = new im.DataCache(_params.cacheEnabled);
			updateLaunchStatus('CORE_LOADED');
			var loadPaths = self.config().dependencies;
			if(loadPaths.length){
				if(self.cl().initializer()){
					var implemented = self.cl().initializer().load(loadPaths, dependenciesLoaded, function(e){
						updateLaunchStatus('DEPENDENCIES_LOADING', e);
					});
					if(implemented == false)
						dependenciesLoaded();
				} else
					dependenciesLoaded();
			}
			else dependenciesLoaded();	
		}
		
		var dependenciesLoaded = function(){
			updateLaunchStatus('DEPENDENCIES_LOADED');
			_pluginManager.instantiatePlugins();
			updateLaunchStatus('PLUGINS_LOADED');
			updateLaunchStatus('APPLICATION_PREPARED')
			_instantiator.beginInstantiation();
			var plgn = _pluginManager.getRegisteredProcess('launchInterceptor');
			if(plgn){
				var intercept = plgn.interceptLaunch(launchApplication);
				if(intercept) updateLaunchStatus('LAUNCH_INTERCEPTED', {interceptor:plgn});
				else launchApplication();
			} else {
				launchApplication();
			}
		}
		
		var launchApplication = function(){		
			_pluginManager.processAddons(addOnsLoaded);		
		}
		
		var addOnsLoaded = function(){
			updateLaunchStatus('APPLICATION_WILL_LAUNCH');
			updateLaunchStatus('APPLICATION_LAUNCHED');	
		}
		
		var updateLaunchStatus = function(type, e){
			_launchState = im.CLLaunchState[type];
			self.cl().dispatchEvent(im.CLEvent[type], e);
		}
});



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


/**
 * Base class for service consumers in A5 CL.
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){	
		
		this.Properties(function(){
			this._cl_url = null;
			this._cl_isJson = true;
		})
		
		/**
		 * Constructor for CLService
		 * @param {String} url The url of the service endpoint.
		 */
		proto.CLService = function(url){
			proto.superclass(this);
			this._cl_url = url;
		}
		
		/**
		 * Returns the url of the service endpoint, respecting the serviceURLRewriter plugin process if associated.
		 * @return {String}
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * Getter/Setter method for the default setting for the consumer endpoint for JSON parsing.
		 * @param {Boolean} [value] If passed, sets the value.
		 * @return {Boolean|a5.cl.CLService} if a value is passed, returns a reference to the object instance for chaining, otherwise returns the value.
		 */
		proto.isJson = function(value){
			if(value !== undefined) this._cl_isJson = value;
			return this._cl_isJson;
		}
		
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('SerializableAttribute', 'abstract', function(cls){
		
		cls.SerializableAttribute = function(){
			
		}
})


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


/**
 * Base class for Ajax endpoint consumers.
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Mix('a5.cl.mixins.BindableSource')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		this.Properties(function(){
			this._cl_ajaxStruct = null;
			this._cl_silent = false;
		})
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.CLAjax = function(url, props){
			proto.superclass(this, [url]);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
		 * @returns {Number} The request ID.
		 */
		proto.call = function(m, data, callback, props){
			//TODO: enforceContract to allow overload with no method, or no data
			var callObj = this._cl_ajaxStruct ? a5.cl.core.Utils.deepClone(this._cl_ajaxStruct):{};
			if (props) {
				for (var prop in callObj) 
					if (props[prop] == undefined) props[prop] = callObj[prop];
			} else {
				props = callObj;
			}
			if (data) {
				if(data.isA5Class)
					props.data = a5.Attribute.processInstance(data);
				props.data = data;
			}
			props.isJson = this.isJson();
			props.success = callback;
			if(this._cl_silent)
				props.silent = true;
			if(m){
				if(this.url().indexOf('?') == -1 && m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		/**
		 * Aborts all calls associated with the service.
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Boolean} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});


/**
 * Adds ajax call wrapping logic to a method. Calls to methods with this attribute are assumed to execute a call
 * to a method on the endpoint of the same name.
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Static(function(AjaxCallAttribute){
		
		AjaxCallAttribute.CANCEL_CYCLE	= 'ajaxCallAttributeCancelCycle';
		
	})
	.Class('AjaxCallAttribute', function(cls, im, AjaxCallAttribute){
		
		var cycledCalls = {},
			data = {};
		
		cls.AjaxCallAttribute = function(){
			cls.superclass(this);
			
		}

		cls.Override.before = function(aspectArgs){		
			var data = null,
				args = aspectArgs.args() ? Array.prototype.slice.call(aspectArgs.args()) : [];
				argsCallback = null,
				rules = aspectArgs.rules().length ? aspectArgs.rules()[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length)
				data = args.shift();
			if(rules.props)
				propObj = rules.props;
			if(rules.hasErrorCallback){
				if(!propObj)
					propObj= {};
				propObj.error = args.pop();	
			}
			if(rules.hasCallback === true && args.length && typeof args[0] === 'function')
				argsCallback = args.shift();
			var executeCall = function(){
				if (rules.cacheResponse && getData(aspectArgs.method())) {
					setTimeout(function(){
						args.unshift(getData(aspectArgs.method()));
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, 0);
				} else {	
					aspectArgs.scope().call(aspectArgs.method().getName(), data, function(response){
						if (rules.cacheResponse)
							storeData(aspectArgs.method(), response);
						args.unshift(response);
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, propObj);
				}
			}
			if (args[0] === AjaxCallAttribute.CANCEL_CYCLE) {
				if (aspectArgs.method()._cl_cycleID) {
					clearInterval(aspectArgs.method()._cl_cycleID);
					delete aspectArgs.method()._cl_cycleID;
				}
				return a5.Attribute.ASYNC;
			}
			if (rules.cycle) {
				if (!aspectArgs.method()._cl_cycleID) {
					aspectArgs.method()._cl_cycleID = setInterval(function(){
						aspectArgs.method().apply(aspectArgs.scope(), args);
					}, rules.cycle);
					executeCall();
				} else {
					executeCall();
				}
			} else {
				executeCall();
			}
			return a5.Attribute.ASYNC;
		}	
		
		var getData = function(method){
			return data[method.getClassInstance().instanceUID() + "_" + method.getName()];
		}	
		
		var storeData = function(method, value){
			data[method.getClassInstance().instanceUID() + "_" + method.getName()] = value;
		}
})

/**
 * Associates a method on a CLAjax instance as associated with a bind configuration from {@link a5.cl.mixins.Binder}
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxReturnAttribute', function(cls){
		
		cls.BoundAjaxReturnAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			if (aspectArgs.rules().length && aspectArgs.rules()[0].receiverMethod !== undefined) 
				aspectArgs.rules()[0].receiverMethod.call(null, aspectArgs.args()[0]);
			else
				aspectArgs.scope().notifyReceivers(aspectArgs.args()[0], aspectArgs.method().getName());
			return a5.AspectAttribute.SUCCESS;
		}
	})



/**
 * Defines a plugin for an A5 CL application.
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLPlugin', 'abstract', function(proto, im){
			
		this.Properties(function(){
			this._cl_pluginConfig = null;
			this._cl_configDefaults = {};
			this._cl_requiredVersion = '0';
			this._cl_maxVerifiedVersion = null;
			this._cl_requires = [];
		})
		
		proto.CLPlugin = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the plugin configuration object, merging default values with overrides from the application CLMain instance.
		 * @return {Object}
		 */
		proto.pluginConfig = function(){
			return this._cl_pluginConfig;
		}
		
		/**
		 * Specifies a require class or package for the plugin.
		 * @param {String} val
		 */
		proto.requires = function(val){
			this._cl_requires.push(val);
		}
		
		/**
		 * Specifies a required minimum version of A5 CL for the plugin.
		 * @param {String} value
		 */
		proto.requiredVersion = function(value){
			if(value !== undefined) this._cl_requiredVersion = value;
			return this._cl_requiredVersion;
		}
		
		/**
		 * Specifies a maximum version of A5 CL that the plugin has been validated for. Setting allowUntestedPlugins to true on A5 CL config
		 * will allow a plugin to run in CL with a version number higher than this specified value.
		 * @param {String} value
		 */
		proto.maxVerifiedVersion = function(value){
			if(value !== undefined) this._cl_maxVerifiedVersion = value;
			return this._cl_maxVerifiedVersion;
		}
		
		/**
		 * Sets the default config params and their values for the plugin.
		 * @param {Object} value
		 */
		proto.configDefaults = function(value){
			 if(value !== undefined)
			 	this._cl_configDefaults = value;
			return this._cl_configDefaults;
		}
		
		
		/**
		 * Initialization method for the plugin, called when all plugins have been loaded. Override does not require super call. 
		 */
		proto.initializePlugin = function(){}
		
		/**
		 * Associates the plugin with the specified registerable plugin process, either of the A5 CL framework directly or of an addon that specifies its own registrable processes.
		 * @param {String} type
		 */
		proto.registerForProcess = function(type){
			this.cl()._core().pluginManager().registerForProcess(type, this);
		}
		
		proto._cl_sourceConfig = function(){
			var cfg = a5.cl.CLMain._cl_storedCfgs.pluginConfigs;
			var pkg = this.classPackage();
			if(String(pkg[pkg.length-1]).toLowerCase() != this.className().toLowerCase())
						pkg = pkg + '.' + this.constructor.className();
			for (var prop in cfg){
				var pluginCfg = cfg[prop];
				 if(pluginCfg.nm && (pluginCfg.nm === pkg || pluginCfg.nm === this.constructor.className()))
				 	return pluginCfg.obj;
			}
			return {};
		}
	
});


/**
 * CLAddons are top level member plugins for A5 CL. CLAddons augment the plugin model by allowing for custom configuration rules,
 * the ability to define custom registrable processes for other plugins, and the ability register custom class types for auto instantiation.
 */
a5.Package('a5.cl')

	.Extends('CLPlugin')
	.Prototype('CLAddon', 'abstract', function(proto, im, CLAddon){
		
		/**
		 * @event
		 */
		CLAddon.INITIALIZE_COMPLETE = 'clAddonInitializeComplete';	
		
		proto.CLAddon = function(){
			proto.superclass(this);
		}
		
		/**
		 * Must be override as a starting point for the addon. This method is called after all addons have been loaded, but prior to plugins loading.
		 * It is not necessary to call super on this method when overriding.
		 */
		proto.initializeAddOn = function(){
			return false;
		}
		
		/**
		 * Defines a new config method for CLMain. This method should be called in the constructor of the addon. Values added dynamically create a method with a 'set' prefix, much like the existing setConfig method.
		 * For example, a value of 'foo' would create a method named setFoo() in CLMain.
		 * @param {String} type
		 */
		proto.createMainConfigMethod = function(type){
			a5.cl.CLMain.prototype['set' + type.substr(0, 1).toUpperCase() + type.substr(1)] = function(){
				a5.cl.CLMain._cl_storedCfgs[type] = Array.prototype.slice.call(arguments);
			}
		}
		
		/**
		 * Gets the values set via CLMain for a type defined in createMainConfigMethod.
		 * @param {Object} type
		 */
		proto.getMainConfigProps = function(type){
			return a5.cl.CLMain._cl_storedCfgs[type];
		}
		
		/**
		 * 
		 */
		proto.registerAutoInstantiate = function(){
			a5.cl.core.Instantiator.instance().registerAutoInstantiate.apply(null, arguments);
		}
		
		/**
		 * 
		 */
		proto.defineRegisterableProcess = function(process){
			this.cl()._core().pluginManager().defineRegisterableProcess(process);
		}
	
});

/**
 * The instance of an A5 CL application, acting as both a reference instance for core components via its methods and as a global binder object.
 */
a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(cls, im){
	
		var _params,
			_initializer,
			_config,
			core;
		
		cls._cl_plugins = {};

		cls.CL = function(params, initializer){
			cls.superclass(this);
			var main = new a5.cl.CLMain._extenderRef[0](params);
			_params = main._cl_params();
			_initializer = initializer;
			core = new a5.cl.core.Core(_params);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), params);
			if (_config.breakOnDestroyedMethods == true) {
				a5._a5_destroyedObjFunc = Function('debugger;');
			}
		}
		
		cls._cl_launch = function(){
			core.initializeCore((_params.environment || null), (_params.clientEnvironment || null));
		}
		
		cls.initializer = function(){
			return _initializer;
		}
		
		/**
		 * Returns the current launch state of the application, a value from TODO
		 */
		cls.launchState = function(){ return core.launchState(); }
		
		/**
		* @type String
		* @default null
		*/
		cls.applicationBuild = function(){ return _config.applicationBuild; }
		
		/**
		* @type  String 
		* @default an empty string
		*/
		cls.appName = function(){ return _config.appName; }
		
		/**
		 * Returns a reference to the application package.
		 * @param {Boolean} [returnString=false] If true is passed, returns the string value of the namespace of the application package.
		 */
		cls.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(cls, arguments); };
		
		/**
		 *
		 */
		cls.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }
		
		/**
		* @type  String
		* @default 'DEVELOPMENT'
		*/
		cls.environment = function(){ return _config.environment; }
		
		/**
		 *
		 */
		cls.Override.plugins = function(){ return cls._cl_plugins; }
		
		/**
		 * Restarts the application.
		 */
		cls.relaunch = function(){ core.relaunch(); }
		
		cls._core = function(){		return core; }
		
		cls.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
		cls.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(cls.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});


a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		var configDefaults={
			allowUntestedPlugins:false,
			applicationBuild:null,
			appName:'',		
			breakOnDestroyedMethods:false,
			cacheEnabled:true,
			dependencies:[],
			environment:'DEVELOPMENT',
			globalUpdateTimerInterval:10,
			requestDefaultContentType:'application/json',
			requestDefaultMethod:'POST'
		},
		_params;
		
		/**
		 * @param {Object} [params=null] An optional object of parameters to pass into the application instance. Must be passed as a parameter to a5.cl.CreateApplication.
		 */
		proto.CLMain = function(params){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				throw new a5.cl.CLError('Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.');
			if(this.getStatic().instanceCount() > 1)
				throw new a5.cl.CLError('Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"');
			for (var prop in configDefaults)
				if(params[prop] === undefined)
					params[prop] = configDefaults[prop];
			_params = params;
			_params.applicationPackage = this.classPackage();
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
		}
		
		proto.Override.cl = function(){
			return a5.cl.CL.instance();
		}
		
		proto.allowUntestedPlugins = function(val){ _params.allowUntestedPlugins = val; }
		
		proto.appName = function(val){ _params.appName = val; }
		
		proto.breakOnDestroyedMethods = function(val){ _params.breakOnDestroyedMethods = val; }
		
		proto.cacheEnabled = function(val){ _params.cacheEnabled = val; }
		
		proto.dependencies = function(val){ _params.dependencies = val; }
		
		proto.environment = function(val){ _params.environment = val; }
		
		proto.globalUpdateTimerInterval = function(val){ _params.globalUpdateTimerInterval = val; }
		
		proto.requestDefaultContentType = function(val){ _params.requestDefaultContentType = val; }
		
		proto.requestDefaultMethod = function(val){ _params.requestDefaultMethod = val; }
		
		proto._cl_params = function(){ return _params; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
		/**
		 * 
		 * @param {string} namespace
		 * @param {Object} obj
		 */
		proto.setPluginConfig = function(namespace, obj){ CLMain._cl_storedCfgs.pluginConfigs.push({nm:namespace, obj:obj}); }
		
		
		proto.dependenciesLoaded = function(){}
		
		/**
		 * 
		 */
		proto.pluginsLoaded = function(){}
		/**
		 * @name onlineStatusChanged
		 * @description Called by the framework when the browser's online status has changed. This is equivalent to listening for {@link a5.cl.MVC.event:ONLINE_STATUS_CHANGE}.
		 */
		proto.onlineStatusChanged = function(isOnline){}
		
		/**
		 * @name autoInstantiationComplete 
		 * @description Called by the framework when auto detected classes have been successfully instantiated.
		 */
		proto.autoInstantiationComplete = function(){}
		
		/**
		 * @name applicationWillLaunch 
		 * @description Called by the framework when the application is about to launch.
		 */
		proto.applicationWillLaunch = function(){}
		
		/**
		 * @name applicationLaunched 
		 * @description Called by the framework when the application has successfully launched.
		 */
		proto.applicationLaunched = function(){}
		
		/**
		 * @name applicationWillClose
		 * @description Called by the framework when the window is about to be closed. This method is tied to
		 * the onbeforeunload event in the window, and as such can additionally return back a custom string value to throw in a confirm
		 * dialogue and allow the user to cancel the window close if desired.
		 */
		proto.applicationWillClose = function(){
			
		}
		
		/**
		 * @name applicationClosed
		 * @description Called by the framework when the window is closing.
		 */
		proto.applicationClosed = function(){}
		
		/**
		 * @name applicationWillRelaunch
		 * @description Called by the framework when the application is about to relaunch.
		 */
		proto.applicationWillRelaunch = function(){}
})	



})(this);


a5.Package("a5.cl.initializers.dom")
	.Extends("a5.cl.CLPlugin")
	.Implements('a5.cl.interfaces.IDataCacheProvider')
	.Class("DataCache", 'singleton final', function(cls, im){
		
		var _capable,
			_hadCacheAtLaunch;
		
		this.DataCache = function(){
			cls.superclass(this); 
			cls.registerForProcess('dataCacheProvider');
			_capable = window.localStorage != undefined;
			_hadCacheAtLaunch = (cls.isAvailable() && localStorage.length) ? true:false;
		}
		
		this.isAvailable = function(){
			return a5.cl.core.DataCache.enabled() && _capable;
		}
		
		this.cacheExists = function(){
			if(this.isAvailable()) return _hadCacheAtLaunch;
			else return false;
		}
		
		this.storeValue = function(key, value){
			var stringVal = a5.cl.core.JSON.stringify(value);
			return localStorage.setItem(key, stringVal);
		}
		
		this.getValue = function(key){
			try {
				var retValue = localStorage.getItem(key);
				return a5.cl.core.JSON.parse(retValue);
			} catch (e) {
				return null;
			}
		}
		
		this.clearValue = function(key){
			try {
				return localStorage.removeItem(key);
			} catch (e) {
				return false;
			}
		}
		
		this.clearScopeValues = function(scope, $exceptions){
			var exceptions = $exceptions || [], i, j;
			for(var i = 0, l=localStorage.length; i<l; i++){
				var key =localStorage.key(i);
				if (key.indexOf(scope) == 0) {
					var cacheItemName = key.split(scope)[1].substr(1),
					isExcepted = false;
					for (j = 0, m=exceptions.length; j < m; j++) {
						if(cacheItemName == exceptions[j]) isExcepted = true;
					}
					if(!isExcepted){
						localStorage.removeItem(key);
						i--;
						l=localStorage.length;
					}
				}
			}
		}
});


a5.Package('a5.cl.initializers.dom')

	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLBase')
	.Class("EnvManager", 'singleton final', function(self, im){
	
		var _supportsCanvas,
		_isOnline,
		_mobileWidthThreshold,
		_forceIE7,
		_clientEnvironment,
		_clientPlatform,
		_clientOrientation,
		_browserVersion,
		_environment,
		_trapErrors,
		_isBB,
		_isLocal,
		_appPath,
		_appRoot;
		
		this.environment = function(){		return _environment;}		
		this.clientPlatform = function(){	return _clientPlatform;	}
		this.clientOrientation = function(){return _clientOrientation;	}
		this.clientEnvironment = function(){return _clientEnvironment;	}
		this.browserVersion = function(){ return _browserVersion; }	
		this.isOnline = function(){	return _isOnline;}		
		this.isLocal = function(){ return _isLocal; }
		this.appPath = function(root){ return root ? _appRoot:_appPath; }	
		
		this.EnvManager = function($environment, $clientEnvironment){
			self.superclass(this);
			_isOnline = true;
			_supportsCanvas = !!document.createElement('canvas').getContext;
			_clientOrientation = getOrientation();
			_environment = $environment;
			_isLocal = window.location.protocol == 'file:';
			setAppPath();
		}
		
		this.initialize = function(trapErrors){
			var pc = self.DOM().pluginConfig();
			_trapErrors = pc.trapErrors;
			_mobileWidthThreshold = pc.mobileWidthThreshold;
			_forceIE7 = pc.forceIE7;
			_clientEnvironment = testForClientEnvironment();
			testClientPlatform();
			testBrowserVersion();
			setupWindowEvents();
			try{
				 document.body.addEventListener('online', update);
				 document.body.addEventListener('offline', update);
			} catch(e){}
		}
		
		var update = function(){
			if(navigator.onLine !== undefined){
				var newVal = navigator.onLine;
				if(newVal != _isOnline){
					_isOnline = newVal;
					self.cl().dispatchEvent(im.CLEvent.ONLINE_STATUS_CHANGE, {online:self.isOnline()});
				}
			}
		}
	
		var testForClientEnvironment = function(){
			if('runtime' in window){
				return 'AIR';
			} else if('connection' in window && 'notification' in window && 'contacts' in window){
				return 'PHONEGAP';
			}else {
				var isMobile = mobileTest(),
				isTablet = isMobile && screen.width >= _mobileWidthThreshold;
				_isBB = window.blackberry != undefined;
				if(_isBB) isMobile = true;
				if(isTablet) return 'TABLET';
				else if (isMobile) return 'MOBILE';
				else return 'DESKTOP';	
			}	
		}
		
		var mobileTest = function(){
			if(window.orientation !== undefined)
				return true;
			var propArray = ['ontouchstart'];
			var elem = document.createElement('div');
			for (var i = 0, l = propArray.length; i<l; i++){
				elem.setAttribute(propArray[i], 'return;');
				if(typeof elem[propArray[i]] === 'function')
					return true;
			}
			elem = null;
			if(navigator.userAgent.toLowerCase().match(/mobile/i))
				return true;
			return false;
		}
		
		var testClientPlatform = function(){
			if(_isBB){
				if(_supportsCanvas) _clientPlatform = 'BB6';
				else _clientPlatform = 'BB';
			} else {
				if(navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) _clientPlatform = 'IOS';
				else if(navigator.userAgent.match(/Android/i)) _clientPlatform = 'ANDROID';
				else if(navigator.userAgent.match(/IEMobile/i)) _clientPlatform = 'WP7';
				else if(window.ActiveXObject) _clientPlatform = 'IE';
				// _clientPlatform = 'OSX';
			}
			if(!_clientPlatform) _clientPlatform = 'UNKNOWN';
		}
		
		var getOrientation = function(){
			if(typeof window.orientation !== 'undefined')
				return (window.orientation == 0 || window.orientation === 180) ? 'PORTRAIT' : 'LANDSCAPE';
			else
				return 'UNKNOWN';
		}
		
		var testBrowserVersion = function(){
			_browserVersion = 0;
			if (document.body.style.scrollbar3dLightColor!=undefined) {
				if (document.body.style.opacity!=undefined) { _browserVersion = 9; }
				else if (!_forceIE7 && document.body.style.msBlockProgression!=undefined) { _browserVersion = 8; }
				else if (document.body.style.msInterpolationMode!=undefined) { _browserVersion = 7; }
				else if (document.body.style.textOverflow!=undefined) { _browserVersion = 6; }
				else {_browserVersion = 5.5; }
			}
		}
		
		var setAppPath = function(){
			var pathname = window.location.pathname;
			if(pathname.indexOf('.') != -1) pathname = pathname.substr(0, pathname.lastIndexOf('/') + 1);
			_appRoot = window.location.protocol + '//' + window.location.host;
			_appPath = _appRoot + pathname;
			if(_appPath.charAt(_appPath.length-1) != '/') _appPath += '/';
		}
		
		var setupWindowEvents = function(){
			window.onbeforeunload = function(){
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_CLOSE);
			}
			window.onunload = function(){
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_CLOSED);
			}
			if (_trapErrors === true){
				window.onerror = function(e, url, line){
					e = e || window.error;
					if(e === 'Script error.')
						e = "Cannot discern error data from window.onerror - Possible cause is loading A5 from a cross domain source.\nTry disabling trapErrors to use the console or load a local copy of A5.";
					var clErr = a5._a5_getThrownError();
					if(clErr && e !== "" && e.indexOf(clErr.toString()) !== -1)
						e = clErr;
					else
						e = new a5.Error(e, false);
					if(url) e.url = url;
					if(line) e.line = line;
					self.cl().dispatchEvent(im.CLEvent.ERROR_THROWN, e);			
					return false;
				};
			}
			var orientationEvent = ("onorientationchange" in window) ? "onorientationchange" : "onresize";
			window[orientationEvent] = function() {
				self.cl().dispatchEvent(im.CLEvent.WINDOW_RESIZED);
			    var newOrientation = getOrientation();
				if(newOrientation !== _clientOrientation){
					_clientOrientation = newOrientation;
					if (_clientEnvironment === 'MOBILE' || _clientEnvironment === 'TABLET')
						self.cl().dispatchEvent(im.CLEvent.ORIENTATION_CHANGED);
				}
			}
			if (orientationEvent !== 'onresize') {
				window.onresize = function(){
					self.cl().dispatchEvent(im.CLEvent.WINDOW_RESIZED);
				}
			}
		}
		
})

a5.Package('a5.cl.initializers.dom')
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLBase')
	.Mix('a5.cl.mixins.DataStore')
	.Static(function(ResourceCache){
		
		ResourceCache.BROWSER_CACHED_ENTRY = 'clResourceCacheBrowserCacheEntry';
		
		ResourceCache.COMBINED_DEPENDENCY = 'clResourceCacheCombinedDependcy';
		
		ResourceCache._cl_delimiterOpen = '<!--CL:';
		ResourceCache._cl_delimiterClose = ':CL-->';
	})
	.Class('ResourceCache', 'singleton final', function(self, im, ResourceCache){
			
		var resources,
			dataCache,
			shouldCacheBreak,
			staggerDependencies,
			xhrDependencies,
			shouldUseCache,
			silentIncludes,
			requestManager,
			cacheBreakValue,
			cacheTypes = [
				{type:'html', extension:'html'},
				{type:'html', extension:'htm'},
				{type:'js', extension:'js'},
				{type:'text', extension:'txt'},
				{type:'image', extension:'jpg'},
				{type:'image', extension:'gif'},
				{type:'image', extension:'png'},
				{type:'css', extension:'css'},
				{type:'xml', extension:'xml'}
			];
		
		
		this.ResourceCache = function(_cacheTypes, _cacheBreak, _staggerDependencies, _xhrDependencies, _silentIncludes){
			this.superclass(this);
			cacheTypes = cacheTypes.concat(_cacheTypes);
			shouldCacheBreak = _cacheBreak;
			staggerDependencies = _staggerDependencies;
			xhrDependencies = _xhrDependencies;
			silentIncludes = _silentIncludes;
			self.cl().addOneTimeEventListener(im.CLEvent.CORE_LOADED, eAppIntializingHandler);
			resources = {};
		}
		
		var eAppIntializingHandler = function(){
			requestManager = a5.cl.core.RequestManager.instance();
			if(shouldCacheBreak && typeof self.cl().applicationBuild() === 'string'){
				var trimVal = im.Utils.trim(self.cl().applicationBuild());
				if(trimVal !== "")
					cacheBreakValue = trimVal;
			}
		}
		
		this.initStorageRules = function(){
			var manifestBuild = this.DOM().manifestBuild(),
				storedBuild = this.getValue('build') || -1;
			shouldUseCache = (this.cl().isOfflineCapable() && this.cl().environment() === 'PRODUCTION');
			if(manifestBuild && manifestBuild > storedBuild) this.clearScopeValues();
			if(shouldUseCache) this.storeValue('build', manifestBuild);
			else this.clearScopeValues();
		}
		
		this.load = function(value, callback, itemCallback, onerror, asXHR){
			var urlArray = [],
			retValue,
			loadCount = 0,
			totalItems, 
			percentPer, 
			asXHR = asXHR || false,
			elem;
			if (typeof value == 'string') {
				urlArray.push(value);
				retValue = null;
			} else {
				urlArray = value;
				retValue = [];
			}
			a5._a5_delayProtoCreation(true);
			totalItems = urlArray.length;
			percentPer = 100 / totalItems;
			
			if (staggerDependencies || xhrDependencies || asXHR) {	
				fetchURL(urlArray[loadCount]);
			} else {
				for(var i = 0, l = urlArray.length; i<l; i++)
					fetchURL(urlArray[i]);
			}
			
			function fetchURL(urlObj){
				var url = null;
				var type = null;
				if (urlObj != undefined) {
					if (typeof urlObj == 'string') {
						url = urlObj;
						type = discernType(url);
					} else {
						url = urlObj[0];
						type = urlObj[1];
					}
				}
				
				function completeLoad(retValue){
					a5._a5_createQueuedPrototypes();
					a5._a5_verifyPackageQueueEmpty();
					a5._a5_delayProtoCreation(false);
					if (callback) 
						callback(retValue);
				}
				
				function continueLoad(data){
					loadCount++;
					var percent = Math.floor((loadCount / totalItems) * 100);
					if (itemCallback) itemCallback({
						loadCount: loadCount,
						totalItems: totalItems,
						data:data,
						itemURL: url,
						itemType: type,
						percent: percent
					});
					if(totalItems == 1) retValue = data;
					else retValue.push(data);
					if (staggerDependencies || xhrDependencies || asXHR) {
						if (loadCount == totalItems) {
							completeLoad(retValue);
						} else {
							fetchURL(urlArray[loadCount]);
						}
					} else {
						if (loadCount === urlArray.length) {
							completeLoad(retValue);
						}
					}
				}
				var cacheValue = checkCache(url);
				if (!cacheValue) {
					if (type) {
						url = im.Utils.makeAbsolutePath(checkReplacements(url));
						if(cacheBreakValue)
							url = url + '?a5=' + cacheBreakValue;
						if (type === 'css') {
							var cssError = function(){
								if (onerror) onerror(url);
								else self.throwError('Error loading css resource at url ' + url);
							},
							headID = document.getElementsByTagName("head")[0],
							elem = document.createElement('link');
							elem.onerror = cssError;
							elem.href =  url;
							elem.rel = 'stylesheet';
							elem.media = 'screen';
							headID.appendChild(elem);
							updateCache(url, type, ResourceCache.BROWSER_CACHED_ENTRY);
							continueLoad();
							elem = headID = null;
						} else if (type === 'image'){
							var imgObj = new Image(),
							clearImage = function(){
								a5.cl.mvc.core.GarbageCollector.instance().destroyElement(imgObj);
								imgObj = null;
								updateCache(url, type, ResourceCache.BROWSER_CACHED_ENTRY);
								continueLoad();
							},
							imgError = function(){
								if (onerror) onerror(url);
								else self.redirect(500, 'Error loading image resource at url ' + url);
							};
												
							imgObj.onload = clearImage;
							imgObj.onerror = imgError;
							imgObj.src = data;
						} else if (type === 'js' && xhrDependencies === false && asXHR == false){
							var insertElem = function(){
								head.insertBefore(include, head.firstChild);
							}
							var head = document.getElementsByTagName("head")[0], include = document.createElement("script");
							include.type = "text/javascript";		
							include.src = url;
							if(include.readyState){
								include.onreadystatechange = function(){
									if (this.readyState == 'loaded' || this.readyState == 'complete') continueLoad();
								}
							} else {
								include.onload = continueLoad;
							}
							insertElem();
						} else {
							var reqObj = {
								url: url,
								method: 'GET',
								contentType: 'text/plain',
								success: function(data){
									data = updateCache(url, type, data);
									processData(url, data, type, function(){
										continueLoad(data);
									});
								},
								error: function(){
									if (onerror) onerror(url);
									else self.redirect(500, 'Error loading resource at url ' + url);
								}
							}
							if (typeof itemCallback === 'function') {
								reqObj.progress = function(e){
									itemCallback({
										loadCount: loadCount,
										totalItems: totalItems,
										itemURL: url,
										itemType: type,
										percent: Math.floor(percentPer * loadCount + percentPer * Math.floor(e.loaded / e.total))
									});
								}
							}
							reqObj.silent = silentIncludes === true;
							requestManager.makeRequest(reqObj)
						}
					} else {
						throw 'Unknown include type for included file "' + url + '".';
					}
				} else {
					if(cacheValue === ResourceCache.BROWSER_CACHED_ENTRY)
							continueLoad(null);
						else
							continueLoad(cacheValue);
				}			
			}
		}
		
		this.getCachedHTML = function(id, callback){
			var obj = resources[id];
			if (obj && obj.isID && obj.type === 'html') {
				var docFrag = document.createDocumentFragment();
				docFrag.innerHTML = obj.data;
				return docFrag;
			}
			return null;
		}
		
		this.purgeAllCaches = function($restartOnComplete){
			//orm integration?
			if(window.localStorage !== undefined) localStorage.clear();
			self.cl().purgeApplicationCache($restartOnComplete);
		}
		
		this.combineMarkupResources = function(){
			var combined = "";
			for(var prop in resources){
				var thisResource = resources[prop];
				if(thisResource.type === 'xml' || thisResource.type === 'html'){
					combined += ResourceCache._cl_delimiterOpen + ' ';
					combined += (thisResource.isID ? 'id=' : 'url=') + prop;
					combined += ' type=' + thisResource.type;
					combined += ' ' + ResourceCache._cl_delimiterClose + '\n\n';
					combined += thisResource.data + '\n\n';
				}
			}
			return combined;
		}
		
		var checkCache = function(url){
			var value = resources[url],
				cached = (typeof value === 'object');
			if(!value && shouldUseCache && value !== ResourceCache.BROWSER_CACHED_ENTRY && value !== ResourceCache.COMBINED_DEPENDENCY)
				value = self.getValue(url);
			return (cached ? value.data : null);
		}
		
		var updateCache = function(url, type, value, fromStorage, isID){
			value = a5.cl.core.Utils.trim(value);
			var regex = new RegExp(ResourceCache._cl_delimiterOpen + '.*?' + ResourceCache._cl_delimiterClose, 'g');
			if(regex.test(value)){
				if (value.indexOf(ResourceCache._cl_delimiterOpen) !== 0) {
					self.throwError('Error parsing combined resource: ' + url + '\n\nCombined XML and HTML resources must start with a delimiter');
					return;
				}
				//if the loaded content is a combined file, uncombine it and store each piece
				var result, delimiters = [];
				//find all of the delimiters
				regex.lastIndex = 0;
				while(result = regex.exec(value))
					delimiters.push({index:regex.lastIndex, match:a5.cl.core.Utils.trim(result[0])});
				//loop through each delimiter
				for(var x = 0, xl = delimiters.length; x < xl; x++){
					var thisDelimiter = delimiters[x],
						//get the content associated with this delimiter
						dataSnippet = value.substring(thisDelimiter.index, (x < xl - 1) ? delimiters[x + 1].index : value.length).replace(regex, ""),
						//remove the delimiter open and close tags to get the params
						paramString = thisDelimiter.match.replace(ResourceCache._cl_delimiterOpen, '').replace(ResourceCache._cl_delimiterClose, ''),
						//split the params into an array
						paramList = a5.cl.core.Utils.trim(paramString).split(' '),
						params = {};
					//process each parameter into a name/value pair
					for(var y = 0, yl = paramList.length; y < yl; y++){
						var splitParam = paramList[y].split('='),
							paramName = splitParam.length > 1 ? splitParam[0] : 'url',
							paramValue = splitParam.pop();
						params[paramName] = paramValue;
					}
					if(params.url)
						params.url = a5.cl.core.Utils.makeAbsolutePath(params.url);
					updateCache(params.url || params.id, params.type || type, dataSnippet, false, !params.url);
				}
				updateCache(url, type, ResourceCache.COMBINED_DEPENDENCY);
				return null;
			} else {
				resources[url] = {
					type: type,
					data: value,
					isID: isID === true
				};
				if(shouldUseCache && !fromStorage)
					self.storeValue(url, value);
				return value;
			}
		}
		
		var discernType = function(url){
			var urlArray = url.split('.'),
				extension = urlArray[urlArray.length-1].replace(/\?.*$/, ''); //the replace() removes querystring params
			for (var i = 0, l=cacheTypes.length; i < l; i++) {
				if (typeof cacheTypes[i] != 'object' ||
				cacheTypes[i].extension == undefined ||
				cacheTypes[i].type == undefined) {
					throw 'Improper config cacheType specified: ' + cacheTypes[i].toString();
				} else if (extension == cacheTypes[i].extension) {
					return cacheTypes[i].type;
				}
			}
			return null;
		}
		
		var processData = function(url, data, type, callback){
			switch (type){
				case 'js':
					try {
						var insertElem = function(){
							head.insertBefore(include, head.firstChild);
						}
						var head = document.getElementsByTagName("head")[0], include = document.createElement("script");
						include.type = "text/javascript";					
						try {
							include.appendChild(document.createTextNode(data));
						} catch (e) {
							include.text = data;
						} finally {
							insertElem();
							callback();
						}
					} catch (e) {
						self.throwError(e);
					} finally {
						include = head = null;
					}
					break;
				case 'html':
				case 'xml':
				default:
					callback();
			}
		}
		
		var checkReplacements = function(url){
			var env = self.cl().initializer().environmentManager();
			return url.replace('{CLIENT_ENVIRONMENT}', env.clientEnvironment()).replace('{ENVIRONMENT}', env.environment());
		}
	
})

a5.Package('a5.cl.initializers.dom')

	.Extends('a5.cl.CLBase')
	.Class('ManifestManager', 'singleton final', function(self){
	
		var _isOfflineCapable,
		appCache,
		_manifestBuild = null,
		manifestHref;
		
		this.ManifestManager = function(){
			self.superclass(this);
			manifestHref = document.getElementsByTagName('html')[0].getAttribute('manifest');
			appCache = window.applicationCache;
			_isOfflineCapable = appCache && manifestHref ? true:false;
			if(_isOfflineCapable) 
				initialize();
		}
		
		this.manifestBuild = function(){	return _manifestBuild; }
		this.isOfflineCapable = function(){	return _isOfflineCapable;}
		
		this.purgeApplicationCache = function($restartOnComplete){
			var restartOnComplete = ($restartOnComplete == false ? false:true);
			var updateReady = function(){
				appCache.swapCache();
				if(restartOnComplete) 
					self.cl().relaunch(true);
			}
			if (appCache.status == 1) {
				appCache.addEventListener('updateready', updateReady, false);
				appCache.update();
			} else {
				throw 'Cannot purge application cache, appCache status is ' + appCache.status;
			}
		}
		
		var initialize = function(){
			checkManifestBuild(manifestHref);
			appCache.addEventListener('error', onerror, false);
		}
		
		var checkManifestBuild = function(manifestHref){
			var resourceCache = a5.cl.core.ResourceCache.instance(), 
			result;
			self.cl().include(manifestHref, function(data){
				result = data.match(/#build\b.[0-9]*/);
				if(result){
					result = result[0];
					result = result.split('#build')[1];
					result = parseInt(a5.cl.core.Utils.trim(result));
					if(!isNaN(result)) _manifestBuild = result;
				}
			})
		}
		
		var onerror = function(e){
			self.redirect(500, 'Error loading manifest');
		}
})

a5.Package('a5.cl.initializers.dom')
	
	.Import('a5.cl.CLEvent')
    .Extends('a5.cl.CLInitializer')
    .Class('DOMInitializer', function (cls, im) {

		var resourceCache,
			props,
			envManager;

        cls.DOMInitializer = function () {
            cls.superclass(this);
        }
		
		cls.environmentManager = function(){
			return envManager;
		}		
				
		cls.resourceCache = function(){
			return resourceCache;
		}
		
		cls.Override.load = function(arr, complete, progress){
			return resourceCache.load(arr, complete, progress);
		}

        cls.Override.initialize = function (_props, callback) {
            props = _props;
			var initialized = false,

            onDomReady = function () {
                if (!initialized) {
                    initialized = true;
					callback();
                }
            },

            domContentLoaded = function () {
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", domContentLoaded, false);
                    onDomReady();
                } else if (document.attachEvent) {
                    if (document.readyState === "complete") {
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
        }
		
		cls.Override.applicationInitialized = function(inst){
			inst.addOneTimeEventListener(im.CLEvent.APPLICATION_PREPARED, eAppPreparedHandler);
			resourceCache = new im.ResourceCache, (props.cacheTypes || [], 
									props.cacheBreak || false, 
									props.staggerDependencies || true,
									props.xhrDependencies || false,
									props.silentIncludes || false);
			envManager = new im.EnvManager(inst.environment());
		}
		
		var eAppPreparedHandler = function(){
			envManager.initialize();
		}
});


a5.Package('a5.cl.initializers.dom')
	.Static('Utils', function(Utils){
		
		Utils.vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
		Utils.jsVendorPrefixes = ['Webkit', 'Moz', 'ms', 'o'];
		Utils.jsVendorMethodPrefixes = ['webkit', 'moz', 'ms', 'o'];
		
		Utils.purgeBody = function(){
			var body = document.getElementsByTagName('body')[0];
			body.innerHTML = '';
			body.style.margin = '0px';
		}
		
		Utils.getParameterByName = function(name){
		    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
		}
		
		Utils.isAbsolutePath = function(url){
			return (url.indexOf('://') !== -1 || url.substr(0, 1) == '/');
		}
		
		Utils.makeAbsolutePath = function(url){
			return Utils.isAbsolutePath(url) ? (url.substr(0, 1) == '/' ? a5.cl.Instance().initializer().environmentManager().appPath(true) + url:url):(a5.cl.Instance().initializer().environmentManager().appPath() + url);
		}
		
		Utils.generateSystemHTMLTemplate = function(type, str, replBody){
			var retHtml = '<div style="margin:0px auto;text-align:center;font-family:Arial;"><h1>A5 CL: ' + type + ' Error</h1>\
				<div style="text-align:left;margin-bottom:50px;">' + str + '</div></div>';
			if (replBody) {
				var body = document.getElementsByTagName('body')[0];
				if(body) body.innerHTML = retHtml;
				else throw str;
			}
			return retHtml;
		}
		
		Utils.addEventListener = function(target, type, listener, useCapture){
			var type = type.indexOf('on') === 0 ? type.substr(2) : type,
				useCapture = useCapture || false;
			if(typeof target.addEventListener === 'function')
				target.addEventListener(type, listener, useCapture);
			else
				target.attachEvent('on' + type, listener);
		}
		
		Utils.removeEventListener = function(target, type, listener, useCapture){
			var type = type.indexOf('on') === 0 ? type.substr(2) : type;
			if(typeof target.addEventListener === 'function')
				target.removeEventListener(type, listener, useCapture);
			else
				target.detachEvent('on' + type, listener);
		}
		
		Utils.getVendorWindowMethod = function(type){
			var retVal = null,
				i, l, thisProp,
				regex = /-/g;
			while(regex.test(type)){
				type = type.substring(0, regex.lastIndex - 1) + type.substr(regex.lastIndex, 1).toUpperCase() + type.substr(regex.lastIndex + 1);
				regex.lastIndex = 0;
			}
		    for (i = 0, l = Utils.jsVendorMethodPrefixes.length; i <= l; i++) {
				thisProp = i === l ? type : (Utils.jsVendorMethodPrefixes[i] + type.substr(0, 1).toUpperCase() + type.substr(1));
				if(typeof window[thisProp] === "function"){
					retVal = window[thisProp];
					break;
				}
			}
			return retVal;
		}
		
		Utils.getCSSProp = function(type){
			var elem = document.createElement('div'),
				retVal = null,
				i, l, thisProp,
				regex = /-/g;
			while(regex.test(type)){
				type = type.substring(0, regex.lastIndex - 1) + type.substr(regex.lastIndex, 1).toUpperCase() + type.substr(regex.lastIndex + 1);
				regex.lastIndex = 0;
			}
		    for (i = 0, l = Utils.jsVendorPrefixes.length; i <= l; i++) {
				thisProp = i === l ? type : (Utils.jsVendorPrefixes[i] + type.substr(0, 1).toUpperCase() + type.substr(1));
				if(retVal === null && typeof elem.style[thisProp] === "string"){
					retVal = thisProp;
					break;
				}
			}
			//a5.cl.core.GarbageCollector.instance().destroyElement(elem);
			elem = null;
			return retVal;
		}
		
		/**
		 * Get the vendor-specific value for a CSS property.  For example, display:box should become something like display:-moz-box.
		 * @param {Object} prop The CSS property to use.
		 * @param {Object} value The standards-compliant value. (without a vendor prefix)
		 */
		Utils.getVendorCSSValue = function(prop, value){
			var elem = document.createElement('div'),
				returnVal = value,
				x, y, prefixedValue;
			for(x = 0, y = Utils.vendorPrefixes.length; x <= y; x++){
				prefixedValue = (x === 0 ? '' : Utils.vendorPrefixes[x - 1]) + value;
				elem.style[prop] = prefixedValue;
				if (elem.style[prop] === prefixedValue) {
					returnVal =  prefixedValue;
					break;
				}
			}
			//a5.cl.core.GarbageCollector.instance().destroyElement(elem);
			elem = null;
			return returnVal;
		}
		
		Utils.setVendorCSS = function(elem, prop, value, prefixValue){
			prefixValue = prefixValue === true; 
			elem.style.setProperty(prop, value, null);
			for(var x = 0, y = Utils.vendorPrefixes.length; x < y; x++){
				elem.style.setProperty((prefixValue ? '' : Utils.vendorPrefixes[x]) + prop, (prefixValue ? Utils.vendorPrefixes[x] : '') + value, null);
			}
		}
		
		Utils.elementInDocument = function(elem){
			while(elem){
				if(elem === document)
					return true;
				elem = elem.parentNode;
			}
			return false;
		}
});

﻿
a5.Package('a5.cl.initializers.dom')

	.Extends('a5.cl.CLAddon')
	.Class('DOM', 'singleton', function(cls, im, DOM){
		
		var manifestManager;
		
		cls.DOM = function(){
			cls.superclass(this);
			cls.configDefaults({				
				clientEnvironment:null,
				forceIE7:true,
				clientEnvironmentOverrides:false,
				mobileWidthThreshold:768,		
				titleDelimiter:': ',
				trapErrors:false
			});
		}
		
		cls.Override.initializePlugin = function(){
			manifestManager = new im.ManifestManager();
		}
		
		cls.manifestManager = function(){
			return cls.cl().initializer().manifestManager();
		}
		
		cls.environmentManager = function(){
			return envManager;
		}
		
		/**
		 *
		 * @type String
		 * @param {Boolean} [root]
		 */
		cls.appPath = function(root){ return envManager.appPath(root); }
		
		/**
		 *
		 * @type Number
		 */
		cls.browserVersion = function(){	return envManager.browserVersion();	}
		
		/**
		 * Defines A5 CL client environment types. One of 'DESKTOP', 'MOBILE', or 'TABLET'.
		 *
		 * @type String
		 */
		cls.clientEnvironment = function(){	return envManager.clientEnvironment.apply(null, arguments);	}
		
		/**
		 * Defines A5 CL client platform types.<br/>
		 * Values:<br/>
		 * 'BB6' - BlackBerry OS 6<br/>
		 * 'BB' - BlackBerry OS 5 and under<br/>
		 * 'IOS' - Apple iOS<br/>
		 * 'ANDROID' - Google Android<br/>
		 * 'IE' - Internet Explorer<br/>
		 * 'UNKNOWN' - Unknown platform.<br/>
		 *
		 * @type String
		 */
		cls.clientPlatform = function(){		return envManager.clientPlatform();	}
		
		/**
		 * 
		 */
		cls.clientOrientation = function(){ return envManager.clientOrientation(); }	
		
		
		/**
		 * Defines AirFrame CL development environment types. One of 'DEVELOPMENT', 'TEST', or 'PRODUCTION'.
		 *
		 * @type String
		 */
		cls.environment = function(){	return envManager.environment();	}
		
		/**
		 * Returns whether the client environment supports manifest caching.
		 *
		 */
		cls.isOfflineCapable = function(){		return manifestManager.isOfflineCapable();	}
		
		/**
		 * Returns whether the application is running on http:// or file://
		 *
		 */
		cls.isLocal = function(){ return envManager.isLocal(); }
		
		/**
		 * Returns the current online state of the client browser, where supported.
		 *
		 */
		cls.isOnline = function(){	return envManager.isOnline();	}	
		
});

new a5.cl.initializers.dom.DOMInitializer();

