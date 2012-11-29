
a5.Package('com.testpilot111.tests')

	.Extends('a5.cl.CLUnitTest')
	.Class('SampleTest', function(cls){
		
		cls.SampleTest = function(){
			cls.superclass(this);
		}
		
		cls.Override.runTest = function(){
		}
})