a5.Package('a5.cl')

    .Extends('a5.cl.CLBase')
    .Prototype('CLInitializer', function (cls, im) {
		
        cls.CLInitializer = function () {
            cls.superclass(this);
            a5.cl.RegisterInitializer(this);
        }

        cls.initialize = function (callback) {
            throw "Classes extending CLInitializer must override initialize method without calling super.";
        }
		
		cls.load = function(arr, complete, progress){
			return false;
		}
		
		cls.applicationInitialized = function(inst){
		}
});