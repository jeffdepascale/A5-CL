
a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(params){
			cls.superclass(this, arguments);
			cls.breakOnDestroyedMethods(true);
			cls.dependencies([
				'js/CLUnitTest.js'
			]);
		}
		
		cls.Override.applicationLaunched = function(){
			console.log('launched');
		}
})

a5.cl.CreateApplication();	
