
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
		
		proto.createMainConfigMethod = function(type){
			a5.cl.CLMain.prototype['set' + type.substr(0, 1).toUpperCase() + type.substr(1)] = function(){
				a5.cl.CLMain._cl_storedCfgs[type] = Array.prototype.slice.call(arguments);
			}
		}
		
		proto.getMainConfigProps = function(type){
			return a5.cl.CLMain._cl_storedCfgs[type];
		}
		
		proto.registerAutoInstantiate = function(){
			a5.cl.core.Instantiator.instance().registerAutoInstantiate.apply(null, arguments);
		}
		
		proto.defineRegisterableProcess = function(process){
			this.cl()._core().pluginManager().defineRegisterableProcess(process);
		}
	
});