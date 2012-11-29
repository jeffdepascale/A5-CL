
var a5 = this.a5;

a5.Package('a5.cl.initializers.nodejs')

    .Extends('a5.cl.CLInitializer')
    .Class('NodeJSInitializer', function (cls, im) {
		
		var root,
			path;
		
        cls.NodeJSInitializer = function () {
            cls.superclass(this);
			GLOBAL.a5 = a5;
			root = process.mainModule.filename.substr(0, process.mainModule.filename.lastIndexOf('/') +1);
            a5.RegisterNamespaceResolver(requireHandler);
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
		
        var requireHandler = function (namespace) {
            return require(namespace);
        }
});

a5.Create(a5.cl.initializers.nodejs.NodeJSInitializer);
