/*require("a5")

a5.Package('com.testpilot111')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls){
		
		cls.Main = function(app){
			cls.superclass(this);
			cls.setConfig({
				dependencies:[
					'Server.js'
				]
			})
		}
		
		cls.Override.applicationLaunched = function(){
			cls.create('com.testpilot111.Server');
		}
})

a5.cl.CreateApplication();*/
require("a5")

a5.Package('testApp')

.Extends('a5.cl.CLMain')
.Class('Main', function(cls){

    cls.Main = function(app){
        cls.superclass(this);
    }    

    cls.Override.applicationLaunched = function(e){
        console.log('Hello World!');
    }

})

a5.cl.CreateApplication() 	