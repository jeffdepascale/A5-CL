a5.Package('a5.cl.initializers.commonjs')

    .Extends('a5.cl.CLInitializer')
    .Class('CommonJSInitializer', function (cls, im) {

        cls.CommonJSInitializer = function () {
            cls.superclass(this);
            a5.RegisterNamespaceResolver(requireHandler);
            a5.RegisterClassCreateHandler(exportHandler);
			//require('xmlhttprequest');
        }
		
		cls.Override.load = function(arr, complete, progress){
			for(var i = 0, l = arr.length; i<l; i++)
				require(arr[i]);
			complete();
		}

        cls.Override.initialize = function (callback) {
            callback();
        }

        var exportHandler = function (cls) {
            for (var prop in cls)
                if(prop.indexOf("_" != 0))
                    exports[prop] = cls[prop];
        }

        var requireHandler = function (namespace) {
			console.log(namespace);
            return require(namespace);
        }
});

a5.Create(a5.cl.initializers.commonjs.CommonJSInitializer);