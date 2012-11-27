
a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
			cls.setConfig({
				//breakOnDestroyedMethods:true,
				dependencies:[
					'js/CLUnitTest.js'
					//'js/tests/ServiceTest.js'
				]
			})
		}
})

a5.cl.CreateApplication();	
