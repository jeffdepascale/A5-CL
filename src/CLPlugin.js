
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