require('a5')

a5.Package('{PKG}')
	
	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls, im){
	
		cls.Main = function(props){
			cls.Super(props);
		}
		
		cls.Override.applicationLaunched = function(){
			
		}
});

a5.cl.CreateApplication();