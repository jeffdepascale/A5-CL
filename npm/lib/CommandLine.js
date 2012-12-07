#! /usr/bin/env node

require("a5")

a5.Package('com.testpilot111')
	
	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls, im){
		
		cls.Main = function(){
			cls.superclass(this, arguments);
		}
		
		cls.Override.applicationLaunched = function(){
			if (process.argv.length < 3) {
				console.log('a5 requires parameters. Run a5 help to see options.');
			} else {
				var command = process.argv[2],
					args = [];
				if(process.argv.length >3)
					args = process.argv.splice(3);
				console.log(command, args);
			}
		}
})

a5.cl.CreateApplication();	

