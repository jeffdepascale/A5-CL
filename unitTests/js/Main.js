
a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
			cls.setConfig({
				dependencies:[
					'js/CLUnitTest.js',
					'js/Test.js'
				]
			})
		}
})

a5.cl.CreateApplication();	
