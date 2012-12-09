#! /usr/bin/env node

require("a5")

a5.Package('a5.nodejs')
	.Import('a5.nodejs.helpers.*')
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
				switch(command){
					case "doc":
						new im.Doc(args);
						break;
					case "create":
						new im.Create(args);
						break;
					default:
						console.log("Invalid switch '" + command +'". Run a5 help to see options.');
						break;
				}
			}
		}
})

a5.cl.CreateApplication();	

