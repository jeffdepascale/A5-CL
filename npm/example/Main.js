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