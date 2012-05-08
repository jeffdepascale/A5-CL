A5 CL (Core Layer) - Application Framework Library Built on A5(http://a5.testpilot111.com)

Licensed under GPL-3.0

Detailed release notes coming soon, along with wiki implementation guides.

A5 CL includes A5 directly, no separate script is required to run.

Quick Tutorial: Hello World 

a5.Package('testApp')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
		}	
		
		cls.Override.applicationLaunched = function(e){
			alert('Hello World!');
		}
})

a5.cl.CreateApplication()

