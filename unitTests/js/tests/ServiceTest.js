
a5.Package('com.testpilot111.tests')

	.Extends('a5.cl.CLUnitTest')
	.Class('ServiceTest', function(cls){
		
		cls.ServiceTest = function(){
			cls.superclass(this);
		}
		
		cls.Override.runTest = function(){
			a5.Package('testApp.services')
				
				.Import('a5.cl.AjaxCallAttribute')
				.Extends('a5.cl.CLAjax')
				.Class('TestService', function(cls, im){
					
					cls.TestService = function(){
						cls.superclass(this, ['']);
					}
					
			})
		}
})