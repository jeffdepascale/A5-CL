a5.Package('a5.cl.initializers.commonjs')

    .Extends('a5.cl.CLInitializer')
    .Class('CommonJSInitializer', function (cls, im) {
		
		var root,
			path;
		
        cls.CommonJSInitializer = function () {
            cls.superclass(this);
			GLOBAL.a5 = a5;
			try {
				path = require('path');
			} catch(e){
				throw "A5 for CommonJS requires 'path' module";
			}
			root = path.dirname(process.mainModule.filename);
            a5.RegisterNamespaceResolver(requireHandler);
            a5.RegisterClassCreateHandler(exportHandler);
			try {
				require('xmlhttprequest');
			} catch(e){
				throw "A5 for CommonJS requires 'xmlhttprequest' module";
			}
        }
		
		cls.Override.load = function(arr, complete, progress){
			for (var i = 0, l = arr.length; i < l; i++) {
				require(root + "/" + arr[i]);
			}
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
            return require(namespace);
        }
});

a5.Create(a5.cl.initializers.commonjs.CommonJSInitializer);