require("a5")

a5.Package('com.testpilot111')
	
	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls, im){
		
		cls.Main = function(){
			cls.superclass(this, arguments);
		}
		
		cls.Override.applicationLaunched = function(){
			cls.create('com.testpilot111.Server');
		}
})

a5.cl.CreateApplication();	