require("../../lib/A5.js");
require("../../src/main.js")
require("../../src/CLBase.js")
require("../../src/CLInitializer.js")
require("../../src/CLError.js")
require("../../src/CLEvent.js")
require("../../src/interfaces/IHTMLTemplate.js")
require("../../src/interfaces/ILaunchInterceptor.js")
require("../../src/interfaces/ILogger.js")
require("../../src/interfaces/IServiceURLRewriter.js")
require("../../src/interfaces/IDataCacheProvider.js")
require("../../src/interfaces/IBindableReceiver.js")
require("../../src/core/PluginManager.js")
require("../../src/core/Instantiator.js")
require("../../src/CLConfig.js")
require("../../src/core/Utils.js")
require("../../src/core/RequestManager.js")
require("../../src/core/JSON.js")
require("../../src/core/DataCache.js")
require("../../src/core/GlobalUpdateTimer.js")
require("../../src/core/Core.js")
require("../../src/mixins/DataStore.js")
require("../../src/mixins/BindableSource.js")
require("../../src/mixins/Binder.js")
require("../../src/CLService.js")
require("../../src/CLSocket.js")
require("../../src/CLAjax.js")
require("../../src/CLPlugin.js")
require("../../src/CLAddon.js")
require("../../src/CL.js")
require("../../src/CLMain.js")
require("../../src/initializers/commonjs/CommonJS.js")
require('./Server.js')


a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
			cls.setConfig({
				//breakOnDestroyedMethods:true,
				dependencies:[
					//'Server.js'
				]
			})
		}
		
		cls.Override.applicationLaunched = function(){
			cls.create('com.testpilot111.Server');
		}
})

a5.cl.CreateApplication();	