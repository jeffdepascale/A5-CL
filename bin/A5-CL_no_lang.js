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
			return a5.cl.instance();
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
		
		proto.Override.throwError = function(error){
			proto.superclass().throwError(error, a5.cl.CLError);
		}
		
		/**
		 * Returns a reference to the configuration object for the A5 CL application instance.
		 * @return {a5.cl.CLConfig}
		 */
		proto.config = function(){
			return this.cl().config();
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



/**
 * Worker class instance, performs a task on a worker thread when available or in the browser thread when not.
 */
a5.Package('a5.cl')
	
	.Extends('CLBase')
	.Prototype('CLWorker', 'abstract', function(proto, im){
		
		this.Properties(function(){
			this._cl_communicator = null;
			this._cl_JSON = null;
			this._cl_isWorker = false;
		})
		
		proto.CLWorker = function(isWorker){
			proto.superclass(this);
			if(this.isSingleton())
				this.throwError("Workers cannot be singletons.");
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
						self.throwError(obj.error);
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
				self.throwError('Cannot call createWorker from worker methods.');
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

	.Extends('a5.Attribute')
	.Class('WorkerMethod', function(cls, im, WorkerMethod){
		
		cls.WorkerMethod = function(){
			cls.superclass(this);
		}		
		
		cls.Override.before = function(){
			
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
	.Interface('IDataStorage', function(IDataStorage){
		
		IDataStorage.isCapable = function(){};
		IDataStorage.storeValue = function(){};
		IDataStorage.getValue = function(){};
		IDataStorage.clearValue = function(){};
		IDataStorage.clearScopeValues = function(){};
		
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
				clsInstance = (cls._a5_instance === null) ? this.create(cls) : cls.instance();
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
	 * @type String
	 * @default null
	 */
	applicationBuild:null,
	
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
	 * @type Boolean
	 * @default false
	 */
	cacheBreak:false,
	
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
	 * @default 10
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
	
	staggerDependencies:true,
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
			asyncRunning = false,
			reqCount;
	
		this.RequestManager = function(){
			self.superclass(this, arguments);
			reqArray = [];
			reqCount = 0;
			defaultContentType = self.config().requestDefaultContentType;
			defaultMethod = self.config().requestDefaultMethod;
		}
		
		this.asyncRunning = function(){
			return asyncRunning;
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
			var wasSilent = isSilent();
			unqueueItem(id);
			if ((reqArray.length === 0 || isSilent()) && !wasSilent) {
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
		
		
		this.ResourceCache = function(){
			this.superclass(this);
			requestManager = a5.cl.core.RequestManager.instance();
			cacheTypes = cacheTypes.concat(this.config().cacheTypes);
			if(self.config().cacheBreak && typeof self.config().applicationBuild === 'string'){
				var trimVal = im.Utils.trim(self.config().applicationBuild);
				if(trimVal !== "")
					cacheBreakValue = trimVal;
			}
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
			if (self.config().staggerDependencies || self.config().xhrDependencies || asXHR) {	
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
					if (self.config().staggerDependencies || self.config().xhrDependencies || asXHR) {
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
						url = a5.cl.core.Utils.makeAbsolutePath(checkReplacements(url));
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
			updateLaunchStatus('APPLICATION_PREPARED')
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
				if(m.charAt(0) !== '/')
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

	.Extends('a5.Attribute')
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
		 * Returns a direct reference to parameters passed to the a5.cl.CreateApplication call.
		 * @returns {Object}
		 */
		proto.getCreateParams = function(){
			return a5.cl.instance()._cl_createParams();
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
	.Class("CL", 'singleton', function(self, im){
	
		var _params,
			_config,
			_main,
			core;
		
		this._cl_plugins = {};
		
		/**
		 * 
		 * @param {Object} params
		 */
		this.CL = function(params){
			self.superclass(this);
			_params = {};
			if(a5.cl.CLMain._extenderRef.length)
				_main = self.create(a5.cl.CLMain._extenderRef[0], [params]);
			_params.applicationPackage = _main.classPackage();
			core = self.create(a5.cl.core.Core, [_params.applicationPackage]);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), _params);
			_config = core.instantiator().createConfig(_config);
			core.initializeCore((params.environment || null), (_params.clientEnvironment || null));
		}
		
		/**
		 * Returns the current launch state of the application, a value from TODO
		 */
		this.launchState = function(){ return core.launchState(); }
		
		/**
		 * Returns a reference to the application package.
		 * @param {Boolean} [returnString=false] If true is passed, returns the string value of the namespace of the application package.
		 */
		this.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(this, arguments); };
		
		/**
		 *
		 */
		this.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }

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
		
		this.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
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


a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {config:[], appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		/**
		 * @param {Object} [params=null] An optional object of parameters to pass into the application instance. Must be passed as a parameter to a5.cl.CreateApplication.
		 */
		proto.CLMain = function(){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.']))
			if(this.getStatic().instanceCount() > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"']));
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
		}
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setConfig = function(obj){ CLMain._cl_storedCfgs.config = obj; }
		
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