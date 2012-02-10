//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( window, undefined ) {
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
		var props = (props === undefined ? undefined:((typeof props === 'object') ? props : {applicationPackage:props}));
		var initialized = false;
		var onDomReady = function(){
			if (!props) {
				var str = 'CreateApplication requires at least one parameter:\n\na5.cl.CreateApplication("app");';
				a5.cl.core.Utils.generateSystemHTMLTemplate(500, str, true);
				throw str;
			} else {
				if (!initialized) {
					a5.cl._cl_appCreated = true;
					a5.cl.Mappings = a5.cl.Filters = 
					a5.cl.AppParams = a5.cl.Config = 
					a5.cl.CreateCallback =
					a5.cl.BootStrap = function(){
						a5.cl.core.Utils.generateSystemHTMLTemplate(500, "Invalid call to CL configuration method: methods must be called prior to application launch", true);
					}
					a5.Create(a5.cl.CL, [props])
					initialized = true;
					for(var i = 0, l = a5.cl._cl_createCallbacks.length; i<l; i++)
						a5.cl._cl_createCallbacks[i](a5.cl.instance());
					a5.cl._cl_createCallbacks = null;
				}
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

a5.cl._cl_createCallbacks = [];

a5.cl.CreateCallback = function(callback){
	a5.cl._cl_createCallbacks.push(callback);
}
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



/**
 * @class Base class for all classes in the AirFrame CL MVC framework. 
 * <br/><b>Abstract</b>
 * @name a5.cl.CLBase
 * @extends a5.CLEventDispatcher
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		/**#@+
	 	 * @memberOf a5.cl.CLBase#
	 	 * @function
		 */	
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the name value of the class if known, else it returns the instanceUID value.
		 * @name mvcName
		 * @type String
		 */
		proto.mvcName = function(){
			return this._cl_mvcName || this.instanceUID();
		}
		
		
		/**
		 * @name cl
		 * @return
		 * @type a5.cl.MVC#
		 */
		proto.cl = function(){
			return a5.cl.instance();
		}
		
		/**
		 * Returns an instance of the class defined by the following parameters:
		 * @name getClassInstance
		 * @param {String} type One of 'Domain', 'Service', or 'Controller'
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooController', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * @name log
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		proto.warn = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.warn.apply(this, arguments);
			else
				if ('console' in window) 
					console.warn.apply(console, arguments);
		}
		
		/**
		 * The redirect method throws a control change to A5 CL.
		 * @name redirect
		 * @param {Object|String|Array|Number} params Numbers are explicitly parsed as errors. String parsed as location redirect if is a url, otherwise processed as a hash change.
		 * @param {String|Array} [param.hash] A string value to pass as a hash change. 
		 * @param {String} [param.url] A string value to pass as a location redirect. 
		 * @param {String} [param.controller] A string value referencing the name of a controller to throw control to, defaulting to the index method of the controller. 
		 * @param {String} [param.action] A string value of the name of the method action to call. 
		 * @param {Array} [param.id] An array of parameters to pass to the action method. 
		 * @param {String|Array} [param.forceHash] A string to set the hash value to. Note that unlike standard hash changes, forceHash will not be parsed as a mappings change and is strictly for allowing finer control over the address bar value.
		 * @param {String} [info] For errors only, a second parameter info is used to pass custom error info to the error controller. 
		 */
		proto.redirect = function(params, info, forceRedirect){
			if(this.cl()._core().locationManager()){
				return this.cl()._core().locationManager().redirect(params, info, forceRedirect);
			} else {
				if(params === 500){
					var isError = info instanceof a5.Error;
					if(isError && !info.isWindowError())
						this.throwError(info);
					else
						throw info;
				}
			}
		}
		
		proto.Override.throwError = function(error){
			proto.superclass().throwError(error, a5.cl.CLError);
		}
		
		/**
		 * Returns the configuration object.
		 * @name config
		 */
		proto.config = function(){
			return this.cl().config();
		}
		
		/**
		 * @name plugins
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns the appParams object as specified in the config object
		 * @name appParams
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
		
		proto._cl_setMVCName = function(name){
			this._cl_mvcName = name;
		}
});




a5.Package('a5.cl')

	.Extends('a5.Error')
	.Prototype('CLError', function(proto, im){
		
		proto.CLError = function(){
			proto.superclass(this, arguments);
			this.type = 'CLError';
		}
})



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


/**
 * @class 
 * @name a5.cl.CLEvent
 */
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
		 * @param {Array} parsedLinks
		 * @description Dispatched when the address bar hash changes
		 */
		CLEvent.HASH_CHANGE = 'hashChange';
		
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
		
		/**
		 * @event
		 * @description Dispatched when the render() method is called on a mappable controller.
		 * @param {a5.cl.CLController} controller
		 */
		CLEvent.RENDER_CONTROLLER = 'renderController';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLEvent.ADDED_TO_PARENT = 'addedToParent';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLEvent.REMOVED_FROM_PARENT = 'removedFromParent';
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
	.Interface('IDataStorage', function(IDataStorage){
		
		IDataStorage.isCapable = function(){};
		IDataStorage.storeValue = function(){};
		IDataStorage.getValue = function(){};
		IDataStorage.clearValue = function(){};
		IDataStorage.clearScopeValues = function(){};
		
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
				dataStorage:null,
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
				self.throwError(self.create(a5.cl.CLError, ['Invalid call to MVC pluginConfig method: method must be called prior to plugin load.']));
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
				if (count >= addOns.length - 1) {
					callback();
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
				if(!a5.GetNamespace(r[i]))
					return r[i];	
			}
			return false;
		}
});


a5.Package('a5.cl.core')

	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLBase')
	.Class("EnvManager", 'singleton final', function(self, im){
	
		var _supportsCanvas,
		_isOnline,
		_clientEnvironment,
		_clientPlatform,
		_clientOrientation,
		_browserVersion,
		_environment,
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
			if($clientEnvironment) _clientEnvironment = $clientEnvironment;
			else if(self.config().clientEnvironment)_clientEnvironment = self.config().clientEnvironment;
			else _clientEnvironment = testForClientEnvironment();
			testClientPlatform();
			testBrowserVersion();
			if($environment) _environment = $environment;
			else _environment = self.config().environment;
			var envObj = checkConfigProp(_environment, self.config().environments); 
			if(envObj) a5.cl.core.Utils.mergeObject(envObj, self.config(), true);
			var cEnvObj = checkConfigProp(_clientEnvironment, self.config().clientEnvironments);
			if(cEnvObj) a5.cl.core.Utils.mergeObject(cEnvObj, self.config(), true);
			_isLocal = window.location.protocol == 'file:';
			setAppPath();
		}
		
		this.initialize = function(){
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
					a5.cl.instance().dispatchEvent(im.CLEvent.ONLINE_STATUS_CHANGE, {online:self.isOnline()});
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
				isTablet = isMobile && screen.width >= self.config().mobileWidthThreshold;
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
		
		var checkConfigProp = function(checkProp, obj){
			var foundProps = [], prop, propArray, isPositiveCase, envProp, i, l, canPush, isValidForNeg, retProp = null;
			for(prop in obj){
				isPositiveCase = true;
				envProp = prop;
				if (envProp.charAt(0) === '_') {
					isPositiveCase = false;
					envProp = envProp.substr(1);
				}
				propArray = envProp.split('_');
				canPush = false;
				isValidForNeg = true;
				for(i = 0, l=propArray.length; i<l; i++){
					if(isPositiveCase){
						 if (propArray[i] === checkProp) {
						 	canPush = true;
							break;
						 }
					} else {
						if(propArray[i] === checkProp)
							isValidForNeg = false;
							break;
					}
				}
				if((isPositiveCase && canPush) ||
				   (!isPositiveCase && isValidForNeg))
						foundProps.push(obj[prop]);
			}
			if(foundProps.length)
				retProp = foundProps[0];
			if(foundProps.length >1)
				for(i = 1, l=foundProps.length; i<l; i++)
					a5.cl.core.Utils.mergeObject(foundProps[i], retProp, true);
			return retProp;
		}
		
		var testBrowserVersion = function(){
			_browserVersion = 0;
			if (document.body.style.scrollbar3dLightColor!=undefined) {
				if (document.body.style.opacity!=undefined) { _browserVersion = 9; }
				else if (!self.config().forceIE7 && document.body.style.msBlockProgression!=undefined) { _browserVersion = 8; }
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
				/* need close interceptor in mvc
				var val = self.cl().application().applicationWillClose();
				if (typeof val == 'string') return val;
				*/
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_CLOSE);
			}
			window.onunload = function(){
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_CLOSED);
			}
			if (self.config().trapErrors === true){
				window.onerror = function(e, url, line){
					e = e || window.error;
					if(e === 'Script error.')
						e = "Cannot discern error data from window.onerror - Possible cause is loading A5 from a cross domain source.\nTry disabling trapErrors to use the console or load a local copy of A5.";
					var clErr = a5._a5_getThrownError();
					if(clErr && e !== "" && e.indexOf(clErr.toString()) !== -1)
						e = clErr;
					else
						e = a5.Create(a5.Error, [e, false]);
					if(url) e.url = url;
					if(line) e.line = line;
					self.dispatchEvent(im.CLEvent.ERROR_THROWN, e);			
					return true;
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
			try{
				if(className.indexOf('.') !== -1)
					namespace = a5.GetNamespace(className);
				else 
					namespace = getClassNamespace(type, className);
				if(namespace)
					instance = namespace.instance(!!instantiate);
			}catch(e){}
			return instance;
		}
		
		this.createClassInstance = function(clsName, type){
			var cls = getClassNamespace(type, clsName),
			instance,
			clsPath = null;
			if (cls) {
				var clsInstance;
				clsInstance = (cls._a5_instance === null) ? this.create(cls) : cls.instance();
				clsInstance._cl_setMVCName(clsName);
				return clsInstance;
			} else {
				return null;
			}
		}
		
		this.instantiateConfiguration = function(){
			var retObj = a5.cl._cl_storedCfgs.config;
			var plgnArray = a5.cl._cl_storedCfgs.pluginConfigs;
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
							var instance = self.create(liveNamespace[prop]);
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
		
		this.createConfig = function(userConfig){
			return userConfig ? a5.cl.core.Utils.mergeObject(userConfig, a5.cl.CLConfig):a5.cl.CLConfig;
		}
		
		var getClassNamespace = function(type, clsName){							   
			return a5.GetNamespace(applicationPackage + '.' + type.toLowerCase() + 's.' + clsName + (type == 'domain' ? '':(type.substr(0, 1).toUpperCase() + type.substr(1))));
		}
})


/**
 * @class Sets properties for the application.
 * @name a5.cl.CLConfig
 */
a5.SetNamespace("a5.cl.CLConfig", {	
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#allowUntestedPlugins
	 * @default false
	 */
	allowUntestedPlugins:false,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#appName
	 * @default an empty string
	 */
	appName:'',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#applicationPackage
	 * @default an empty string
	 */
	applicationPackage:'',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#applicationViewPath
	 * @default 'views/'
	 */
	applicationViewPath:'views/',
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#cacheEnabled
	 * @default true
	 */
	cacheEnabled:true,
	
	/**
	 * @field
	 * @type Array
	 * @name a5.cl.CLConfig#cacheTypes
	 */
	cacheTypes:[],
	
	/**
	 * @field
	 * @type  String
	 * @name a5.cl.CLConfig#clientEnvironment
	 * @see a5.cl.MVC#clientEnvironment
	 * @default null
	 */
	clientEnvironment:null,
	
	/**
	 * @field
	 * @type  Object 
	 * @name a5.cl.CLConfig#clientEnvironments
	 * @default an empty object
	 */
	clientEnvironments: {},
	
	/**
	 * Specifies whether browser dimension changes are allowed to trigger redraws to different client environment settings. 
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#environmentOverrides
	 * @default false
	 */
	clientEnvironmentOverrides:false,
	
	/**
	 * Specifies a default view container target for render calls. Defaults to the root window of the application. 
	 * @field
	 * @type a5.cl.CLViewContainer
	 * @name a5.cl.CLConfig#defaultRenderTarget
	 * @default null
	 */
	defaultRenderTarget:null,
	
	/**
	 * @field
	 * @type  Array 
	 * @name a5.cl.CLConfig#dependencies
	 * @default an empty array
	 */
	dependencies: [],
	
	/**
	 * @field
	 * @type  String
	 * @name a5.cl.CLConfig#environment
	 * @see a5.cl.MVC#environment
	 * @default 'DEVELOPMENT'
	 */
	environment:'DEVELOPMENT',
	
	/**
	 * @field
	 * @type  Object 
	 * @name a5.cl.CLConfig#environments
	 * @default an empty object
	 */
	environments: {},
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#faviconPath
	 * @default an empty string
	 */
	faviconPath:'',
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#forceIE7
	 * @default true
	 */
	forceIE7:true,
	
	/**
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#globalUpdateTimerInterval
	 * @default 100
	 */
	globalUpdateTimerInterval:10,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#hashDelimiter
	 * @default '#!'
	 */
	hashDelimiter:'#!',
	
	/**
	 * Specifies a browser width value for triggering mobile vs desktop (or tablet) rendering. 
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#mobileWidthThreshold
	 * @default 768
	 */
	mobileWidthThreshold:768,
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#persistORMData
	 * @default false
	 */
	persistORMData:false,

	plugins:{},
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#requestDefaultContentType
	 * @default 'application/json'
	 */
	requestDefaultContentType:'application/json',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#requestDefaultMethod
	 * @default 'POST'
	 */
	requestDefaultMethod:'POST',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#rootController
	 * @default null
	 */
	rootController:null,
	
	/**
	 * @field
	 * @type  XML 
	 * @name a5.cl.CLConfig#rootViewDef
	 * @default null
	 */
	rootViewDef:null,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#rootWindow
	 * @default null
	 */
	rootWindow:null,
	
	/**
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#schemaBuild
	 * @default 0
	 */
	schemaBuild:0,
	
	/**
	 * If true, the ASYNC_START and ASYNC_COMPLETE events will not be dispatched by includes.
	 * @field
	 * @type Boolean,
	 * @name a5.cl.CLConfig#silentIncludes
	 * @default false
	 */
	silentIncludes:false,
	
	/**
	 * Specifies the character delimiter to use when setting the address bar with an append value.
	 * @field
	 * @type String
	 * @name a5.cl.CLConfig#titleDelimiter
	 * @default ': '
	 */
	titleDelimiter:': ',
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#trapErrors
	 * @default false
	 */
	trapErrors:false,
	
	/**
	 * @field
	 * @type  Array 
	 * @name a5.cl.CLConfig#viewDependencies
	 * @default an empty array
	 */
	viewDependencies:[],
	
	/**
	 * @field
	 * @type String
	 * @name a5.cl.CLConfig#workersPath
	 * @default null
	 */
	workersPath:null,
	
	/**
	 * @field
	 * @type Array
	 * @name a5.cl.CLConfig#workersIncludes
	 * @default an empty array
	 */
	workersIncludes:[],
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#xhrDependencies
	 * @default false
	 */
	xhrDependencies:false
});



a5.Package('a5.cl.core')
	.Static('Utils', function(Utils){
		Utils.vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
		Utils.jsVendorPrefixes = ['Webkit', 'Moz', 'ms', 'o'];
		Utils.jsVendorMethodPrefixes = ['webkit', 'moz', 'ms', 'o'];
		
		Utils.purgeBody = function(){
			var body = document.getElementsByTagName('body')[0];
			body.innerHTML = '';
			body.style.margin = '0px';
		}
		
		Utils.trim = function(str){
			if(!str) return str;
			return str.replace(/(^\s+)|(\s+$)/g, "").replace(/\s{2,}/, " ");
		}
		
		Utils.getParameterByName = function(name){
		    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
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
		    var c = obj instanceof Array ? [] : {};
		    for (var i in obj) {
		        var prop = obj[i];
		        if (typeof prop == 'object') {
		           if (prop instanceof Array) {
		               c[i] = [];
		               for (var j = 0, l=prop.length; j < l; j++) {
		                   if (typeof prop[j] != 'object') c[i].push(prop[j]);
		                   else c[i].push(obj[prop[j]]);
		               }
		           } else {
		               c[i] = obj[prop];
		           }
		        } else {
		           c[i] = prop;
		        }
		    }
		    return c;
		}
		
		Utils.initialCap = function(str){
			return str.substr(0, 1).toUpperCase() + str.substr(1);
		}
		
		Utils.isAbsolutePath = function(url){
			return (url.indexOf('://') !== -1 || url.substr(0, 1) == '/');
		}
		
		Utils.makeAbsolutePath = function(url){
			return a5.cl.core.Utils.isAbsolutePath(url) ? (url.substr(0, 1) == '/' ? a5.cl.instance().appPath(true) + url:url):(a5.cl.instance().appPath() + url);
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
		
		Utils.testVersion = function(val, isMax){
			var parseVersionString = function(val) {
			    val = val.split('.');
			    return {
			        major: parseInt(val[0]) || 0,
			        minor: parseInt(val[1]) || 0,
			        build: parseInt(val[2]) || 0
			    }
			}
			
			isMax = isMax || false;
			var versionVal = parseVersionString(a5.version()),
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
		
		Utils.elementInDocument = function(elem){
			while(elem){
				if(elem === document)
					return true;
				elem = elem.parentNode;
			}
			return false;
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
			reqCount;
	
		this.RequestManager = function(){
			self.superclass(this, arguments);
			reqArray = [];
			reqCount = 0;
			defaultContentType = self.config().requestDefaultContentType;
			defaultMethod = self.config().requestDefaultMethod;
		}

		this.processItem = function(props, reqID){
			var req;
			try {	
				var reqComplete = function($req){
					var req = this;
					if (req.readyState == 4) {
						var response,
						retData,
						status = req.status;
						if (status !== 500) {
							if (props.isJson) {
								response = req.responseText;
								
								if (a5.cl.core.Utils.trim(response) !== "") {
									try {
										response = a5.cl.core.JSON.parse(response);
										retData = (props.dataProp && props.dataProp !== undefined) ? response[props.dataProp] : response;
									} catch (e) {
										status = 500;
										retData = "Error parsing JSON response from url: " + props.url + "\nresponse: " + response;
									}
								}
							} else if (props.isXML && req.responseXML) {
								response = req.responseXML;
							} else {
								response = req.responseText;
							}
							if (retData === undefined) 
								retData = response;
						}
						if (status == 200 || (status == 0)) {
							self.success(reqID, retData);
						} else {
							self.onError(reqID, status, retData || req.responseText);
						}
						self.reqComplete(reqID);
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
						if (props.isJson) {
							data = a5.cl.core.JSON.stringify(data);
						} else if (props.formData === true) {
							var fd = new FormData();
							for (var prop in data) 
								fd.append(prop, data[prop])
							data = fd;
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
			if((reqArray.length === 0 || isSilent()) && props.silent !== true)
				self.cl().dispatchEvent(im.CLEvent.ASYNC_START);
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
			var wasSilent = isSilent();
			unqueueItem(id);
			if((reqArray.length === 0 || isSilent()) && !wasSilent)
				self.cl().dispatchEvent(im.CLEvent.ASYNC_COMPLETE);
		}
		
		this.updateProgress = function(id, e){
			var props = getPropsForID(id);
			if(props.progress) props.progress.call(self, e);
		}
		
		this.onError = function(id, status, errorObj){
			if (status != 200 && status != 0) {
				var props = getPropsForID(id);
				if (props && props.error) props.error.call(self, status, errorObj);
				else self.redirect(status, errorObj);
			}
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


a5.Package('a5.cl.core')

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
			a5.cl.instance().redirect(500, 'JSON stringify error.');
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
		a5.cl.instance().redirect(500, new SyntaxError('JSON.parse'));
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
			_capable,
			_hadCacheAtLaunch,
			cacheKeys;
		
		this.DataCache = function(){
			self.superclass(this); 
			_enabled = a5.cl.instance().config().cacheEnabled;
			_capable = window.localStorage != undefined;
			_hadCacheAtLaunch = (this.isAvailable() && localStorage.length) ? true:false;
			cacheKeys = [];
		}
		
		this.isAvailable = function(){
			var plugin = getDataPlugin();
			if(plugin)
				_capable = plugin.isCapable.call(plugin);
			return _enabled && _capable;
		}
		
		this.cacheExists = function(){
			if(this.isAvailable()) return _hadCacheAtLaunch;
			else return false;
		}
		
		this.storeValue = function(key, value){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.storeValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				var stringVal = a5.cl.core.JSON.stringify(value),
				value = localStorage.setItem(key, stringVal);
				return value;
			} else {
				return false;
			}
		}
		
		this.getValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.getValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					var retValue = localStorage.getItem(key);
					return a5.cl.core.JSON.parse(retValue);
				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		}
		
		this.clearValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					return localStorage.removeItem(key);
				} 
				catch (e) {
					return false;
				}
			} else {
				return false;
			}
		}
		
		this.clearScopeValues = function(scope, $exceptions){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearScopeValues.apply(plugin, arguments);
			
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
		
		var getDataPlugin = function(){
			return self.plugins().getRegisteredProcess('dataStorage');
		}
	
	
});


a5.Package('a5.cl.core')
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
			shouldUseCache,
			requestManager,
			cacheTypes = [
				{type:'html', extension:'html'},
				{type:'html', extension:'htm'},
				{type:'js', extension:'js'},
				{type:'image', extension:'jpg'},
				{type:'image', extension:'gif'},
				{type:'image', extension:'png'},
				{type:'css', extension:'css'},
				{type:'xml', extension:'xml'}
			];
		
		
		this.ResourceCache = function(){
			this.superclass(this);
			requestManager = a5.cl.core.RequestManager.instance();
			cacheTypes = cacheTypes.concat(this.config().cacheTypes);
			resources = {};
		}
		
		this.initStorageRules = function(){
			var manifestBuild = this.cl().manifestBuild(),
				storedBuild = this.getValue('build') || -1;
			shouldUseCache = (this.cl().isOfflineCapable() && this.cl().environment() === 'PRODUCTION');
			if(manifestBuild && manifestBuild > storedBuild) this.clearScopeValues();
			if(shouldUseCache) this.storeValue('build', manifestBuild);
			else this.clearScopeValues();
		}
		
		this.include = function(value, callback, itemCallback, onerror, asXHR){
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
			if (self.config().xhrDependencies || asXHR) {	
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
				url = a5.cl.core.Utils.makeAbsolutePath(checkReplacements(url));
				
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
					if (self.config().xhrDependencies || asXHR) {
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
				if (type) {
					var cacheValue = checkCache(url);
					if (!cacheValue) {
						if (type === 'css') {
							var cssError = function(){
								if (onerror) onerror(url);
								else self.redirect(500, 'Error loading css resource at url ' + url);
							},
							headID = document.getElementsByTagName("head")[0],
							elem = document.createElement('link');
							elem.onerror = cssError;
							elem.href =  url;
							elem.rel = 'stylesheet';
							elem.media = 'screen';
							headID.appendChild(elem);
							updateCache(url, type, ResourceCache.BROWSER_CACHED_ENTRY);
							callback();
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
						} else if (type === 'js' && self.config().xhrDependencies === false && asXHR == false){
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
							reqObj.silent = self.config().silentIncludes === true;
							requestManager.makeRequest(reqObj)
						}
					} else {
						if(cacheValue === ResourceCache.BROWSER_CACHED_ENTRY)
							continueLoad(null);
						else
							continueLoad(cacheValue);
					}
				} else {
					throw 'Unknown include type for included file "' + url + '".';
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
						self.redirect(500, e)
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
			return url.replace('{CLIENT_ENVIRONMENT}', a5.cl.instance().clientEnvironment()).replace('{ENVIRONMENT}', a5.cl.instance().environment());
		}
	
})


a5.Package("a5.cl.core")

	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("GlobalUpdateTimer", 'singleton final', function(self, im){

		var timer,
		clInstance,
		interval,
		evtInstance = a5.Create(im.CLEvent, [im.CLEvent.GLOBAL_UPDATE_TIMER_TICK]);
		
		this.GlobalUpdateTimer = function(){
			self.superclass(this);
			interval = self.config().globalUpdateTimerInterval;
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
		_requestManager,
		_envManager,
		_globalUpdateTimer,
		_resourceCache,
		_instantiator,
		_pluginManager,
		_launchState,
		_manifestManager;
		
		this.Core = function($applicationPackage){
			self.superclass(this); 
			_instantiator = self.create(a5.cl.core.Instantiator, [$applicationPackage]);
		}
			
		this.resourceCache = function(){ return _resourceCache; }	
		this.instantiator = function(){ return _instantiator; }			
		this.cache = function(){	return _cache;	}
		this.envManager = function(){ return _envManager; }	
		this.manifestManager = function(){ return _manifestManager; }
		this.requestManager = function(){ return _requestManager;	}	
		this.pluginManager = function(){ return _pluginManager; }			
		this.globalUpdateTimer = function(){return _globalUpdateTimer;}
		this.launchState = function(){ return _launchState; }
		
		this.relaunch = function(){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_RELAUNCH);
			window.location.reload();
		}
		
		this.initializeCore = function($environment, $clientEnvironment){
			updateLaunchStatus('APPLICATION_INITIALIZING');
			_globalUpdateTimer = self.create(a5.cl.core.GlobalUpdateTimer);
			_manifestManager = self.create(a5.cl.core.ManifestManager);
			_requestManager = self.create(a5.cl.core.RequestManager);
			_envManager = self.create(a5.cl.core.EnvManager, [$environment, $clientEnvironment]);
			_resourceCache = self.create(a5.cl.core.ResourceCache);
			_pluginManager = self.create(a5.cl.core.PluginManager);
			_cache = self.create(a5.cl.core.DataCache);
			_resourceCache.initStorageRules();
			var loadPaths = self.config().dependencies;
			if(loadPaths.length) _resourceCache.include(loadPaths, dependenciesLoaded, function(e){
				updateLaunchStatus('DEPENDENCIES_LOADING', e);
			});
			else dependenciesLoaded();	
		}
		
		var dependenciesLoaded = function(){
			updateLaunchStatus('DEPENDENCIES_LOADED');
			_pluginManager.instantiatePlugins();
			updateLaunchStatus('PLUGINS_LOADED');
			_envManager.initialize();
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
 * @class Mixin class for providing data storage hooks. DataStore applies a uniqe ID prefix on key values, removing the need to assure uniqueness of keys in your application. Key prefixes are unique to the class in which they are referenced.
 * <br/><b>Abstract</b>
 * @name a5.cl.mixins.DataStore
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl.mixins')
	.Import('a5.cl.core.DataCache')
	.Mixin('DataStore', function(proto, im, DataStore){

		/**#@+
	 	 * @memberOf a5.cl.mixins.DataStore#
	 	 * @function
		 */	
		
		proto.DataStore = function(){
			this._cl_cacheKeyValidated = false;
			this._cl_prefix = null;
			this._cl_validatedPrefix = null;
		}
		
		/**
		 * Returns whether caching has previously been set by the application on the client and values are available for retrieval.
		 * @name cacheExists
		 * @returns {Boolean}
		 */
		proto.cacheExists = function(){
			return im.DataCache.cacheExists();
		}
		
		/**
		 * Stores a value uniquely keyed in the localStorage cache. 
		 * @name storeValue
		 * @returns {Boolean} success
		 */
		proto.storeValue = function(key, value){
			if(im.DataCache.isAvailable() && value !== undefined) 
				return im.DataCache.storeValue(this._cl_createCacheKey(key), value);
			else return false;
		}
		
		proto.keyPrefix = function(value){
			if(typeof value === 'string'){
				this._cl_prefix = value;
				return this;
			}
			return this._cl_prefix;
		}
		
		/**
		 * Retrieves a value for the specified key from the client data store.
		 * @name getValue
		 * @returns {*} False if failure
		 */
		proto.getValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.getValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Removes the value for the specified key from the client data store.
		 * @name clearValue
		 */
		proto.clearValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.clearValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Clears all key/value pairs associated with the class in which the method is called.
		 * @name clearScopeValues
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
 * @class Base class for service handlers in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLService
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLService#
	 	 * @function
		 */		
		
		proto.CLService = function(){
			proto.superclass(this);
			this._cl_url = null;
			this._cl_isJson = true;
		}
		

		proto.initialize = function(url){
			this._cl_url = url;
		}
		
		/**
		 * @name url
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * @name isJson
		 * @param {Boolean} [value]
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
		
		cls.Override.instanceProcess = function(rules, instance){
		
		}
})


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
		 * @param {String}Object} message
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


/**
 * @class Base class for Ajax handlers.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLAjax
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLAjax#
	 	 * @function
		 */	
		
		proto.CLAjax = function(){
			proto.superclass(this);
			this._cl_ajaxStruct = null;
			this._cl_cycledCalls = {};
			this._cl_silent = false;
		}
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @name initialize
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.Override.initialize = function(url, props){
			proto.superclass().initialize.call(this, url);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @name call
		 * @type Number
		 * @returns The request ID.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
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
				if(m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		proto.createCycledCall = function(m, data, delay, callback, props){
			
		}
		
		/*
		proto.cancelCycledCall = this.Attributes(["a5.Contracts", {id:'number'}], function(){
			
		})*/
		
		/**
		 * Aborts all calls associated with the service.
		 * @name abort
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Object} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('AjaxCall', function(cls, im, ServiceCall){
		
		cls.AjaxCall = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(rules, args, scope, method, callback){
			args = Array.prototype.slice.call(args);
			var data = null,
				rules = rules.length ? rules[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length) {
				data = args.shift();
				delete rules.takesData;
			}

			scope.call(method.getName(), data, function(response){
				args.unshift(response);
				callback(args);
			}, (rules && rules.length ? rules[0] : null));
			return a5.Attribute.ASYNC;
		}	
})


/**
 * @class 
 * @name a5.cl.CLPlugin
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLPlugin', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLPlugin#
	 	 * @function
		 */		
		
		proto.CLPlugin = function(){
			proto.superclass(this);
			this._cl_pluginConfig = null;
			this._cl_configDefaults = {};
			this._cl_requiredVersion = '0';
			this._cl_maxVerifiedVersion = null;
			this._cl_requires = [];
		}
		
		/**
		 * @name pluginConfig
		 */
		proto.pluginConfig = function(){
			return this._cl_pluginConfig;
		}
		
		/**
		 * @name requires
		 * @param {Object} val
		 */
		proto.requires = function(val){
			this._cl_requires.push(val);
		}
		
		/**
		 * @name requiredVersion
		 * @param {Object} value
		 */
		proto.requiredVersion = function(value){
			if(value !== undefined) this._cl_requiredVersion = value;
			return this._cl_requiredVersion;
		}
		
		/**
		 * @name maxVerifiedVersion
		 * @param {Object} value
		 */
		proto.maxVerifiedVersion = function(value){
			if(value !== undefined) this._cl_maxVerifiedVersion = value;
			return this._cl_maxVerifiedVersion;
		}
		
		/**
		 * @name configDefaults
		 */
		proto.configDefaults = function(value){
			 if(value !== undefined)
			 	this._cl_configDefaults = value;
			return this._cl_configDefaults;
		}
		
		
		/**
		 * @name initializePlugin
		 */
		proto.initializePlugin = function(){}
		
		/**
		 * @name registerForProcess
		 * @param {Object} type
		 */
		proto.registerForProcess = function(type){
			this.cl()._core().pluginManager().registerForProcess(type, this);
		}
		
		proto._cl_sourceConfig = function(){
			var cfg = a5.cl._cl_storedCfgs.pluginConfigs;
			var pkg = this.classPackage();
			if(String(pkg[pkg.length-1]).toLowerCase() != this.className().toLowerCase())
						pkg = pkg + '.' + this.constructor.className();
			for (var prop in cfg){
				var pluginCfg = cfg[prop];
				 if(pluginCfg.nm && pluginCfg.nm == pkg)
				 	return pluginCfg.obj;
			}
			return {};
		}
	
});


/**
 * @class 
 * @name a5.cl.CLAddon
 * @extends a5.cl.CLPlugin
 */
a5.Package('a5.cl')

	.Extends('CLPlugin')
	.Prototype('CLAddon', 'abstract', function(proto, im, CLAddon){
		
		CLAddon.INITIALIZE_COMPLETE = 'clAddonInitializeComplete';
		
		/**#@+
	 	 * @memberOf a5.cl.CLAddon#
	 	 * @function
		 */		
		
		proto.CLAddon = function(){
			proto.superclass(this);
		}
		
		proto.getCreateParams = function(){
			return a5.cl.instance()._cl_createParams();
		}
		
		proto.initializeAddOn = function(){
			return false;
		}
		
		proto.registerAutoInstantiate = function(){
			a5.cl.core.Instantiator.instance().registerAutoInstantiate.apply(null, arguments);
		}
		
		proto.defineRegisterableProcess = function(process){
			this.cl()._core().pluginManager().defineRegisterableProcess(process);
		}
	
});


a5.Package("a5.cl")

	.Extends('CLBase')
	.Class("CL", 'singleton', function(self, im){
		/**#@+
	 	 * @memberOf a5.cl.CL#
	 	 * @function
		 */
	
		var _params,
			_config,
			core;
		
		this._cl_plugins = {};

		this.CL = function(params){
			self.superclass(this);
			_params = params;
			core = self.create(a5.cl.core.Core, [params.applicationPackage]);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), params);
			_config = core.instantiator().createConfig(_config);
			core.initializeCore((params.environment || null), (params.clientEnvironment || null));
		}
		
		this.launchState = function(){ return core.launchState(); }
		
		/**
		 *
		 * @param {Boolean} [returnString]
		 */
		this.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(this, arguments); };
		
		/**
		 *
		 */
		this.Override.appParams = function(){	return a5.cl._cl_storedCfgs.appParams; }

		/**
		 *
		 * @type String
		 * @param {Boolean} [root]
		 */
		this.appPath = function(root){ return core.envManager().appPath(root); }
		
		/**
		 *
		 * @type Number
		 */
		this.browserVersion = function(){	return core.envManager().browserVersion();	}
		
		/**
		 * Defines A5 CL client environment types. One of 'DESKTOP', 'MOBILE', or 'TABLET'.
		 *
		 * @type String
		 */
		this.clientEnvironment = function(){	return core.envManager().clientEnvironment.apply(null, arguments);	}
		
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
		this.clientPlatform = function(){		return core.envManager().clientPlatform();	}
		
		/**
		 * 
		 */
		this.clientOrientation = function(){ return core.envManager().clientOrientation(); }
		
		/**
		 *
		 */
		this.Override.config = function(){		return _config; }		
		
		/**
		 * Defines AirFrame CL development environment types. One of 'DEVELOPMENT', 'TEST', or 'PRODUCTION'.
		 *
		 * @type String
		 */
		this.environment = function(){	return core.envManager().environment();	}
		
		
		/**
		 * Includes external content into the application.
		 *
		 * @param {String} value
		 * @param {function} callback
		 * @param {function} [itemCallback]
		 * @param {Boolean} [allowReplacements=true]
		 * @param {function} [onError]
		 */
		this.include = function(){ return core.resourceCache().include.apply(this, arguments); }	
		
		/**
		 * Returns whether the client environment supports manifest caching.
		 *
		 */
		this.isOfflineCapable = function(){		return core.manifestManager().isOfflineCapable();	}
		
		/**
		 * Returns whether the application is running on http:// or file://
		 *
		 */
		this.isLocal = function(){ return core.envManager().isLocal(); }
		
		/**
		 * Returns the current online state of the client browser, where supported.
		 *
		 */
		this.isOnline = function(){	return core.envManager().isOnline();	}	
		
		/**
		 *
		 */
		this.manifestBuild = function(){ return core.manifestManager().manifestBuild();	}
		
		/**
		 *
		 */
		this.Override.plugins = function(){ return this._cl_plugins; }
		
		/**
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeAllCaches = function(restartOnComplete){ core.resourceCache().purgeAllCaches(restartOnComplete); }
		
		/**
		 * Purges the manifest cache data in applicationStorage, if applicable.
		 *
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeApplicationCache = function(restartOnComplete){ core.manifestManager().purgeApplicationCache(restartOnComplete); }
		
		/**
		 * Restarts the application.
		 */
		this.relaunch = function(){ core.relaunch(); }
		
		this._core = function(){		return core; }
		
		this._cl_createParams = function(){ return _params; }
		
		this.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(this.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});


})(this);