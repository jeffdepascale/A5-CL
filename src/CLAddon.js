
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