
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