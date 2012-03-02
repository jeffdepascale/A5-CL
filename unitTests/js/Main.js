
a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);

			cls.setConfig({
				dependencies:[
					'js/Test.js'
				]
			})
		}
		
		cls.Override.applicationLaunched = function(e){
			cls.render();
		}
})

a5.cl.CreateApplication();	
