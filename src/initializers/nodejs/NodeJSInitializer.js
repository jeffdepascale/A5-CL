
var a5 = this.a5;

a5.Package('a5.cl.initializers.nodejs')

    .Extends('a5.cl.CLInitializer')
    .Class('NodeJSInitializer', function (cls, im) {
		
		var root,
			path,
			dependencies;
		
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
				require((arr[i].indexOf(root + "/") != -1 ? root + "/":"") + arr[i]);
			}
			complete();
		}

        cls.Override.initialize = function (props, callback) {
            gatherDependencies(callback);
        }
		
		cls.Override.applicationInitialized = function(inst){
			for(var i = 0, l = dependencies.length; i<l; i++)
				inst.config().dependencies.push(dependencies[i]);
		}
		
        var requireHandler = function (namespace) {
            return require(namespace);
        }
		
		var gatherDependencies = function(complete){
			var fs = require('fs'), walk = function(dir, done){
				var results = [];
				fs.readdir(dir, function(err, list){
					if (err) 
						return done(err);
					var i = 0;
					(function next(){
						var file = list[i++];
						if (!file) 
							return done(null, results);
						file = dir + '/' + file;
						fs.stat(file, function(err, stat){
							if (stat && stat.isDirectory()) {
								walk(file, function(err, res){
									results = results.concat(res);
									next();
								});
							}
							else {
								if(file.charAt(0) !== "_" && file.indexOf(".js") === file.length - 3)
									results.push(file);
								next();
							}
						});
					})();
				});
			};
			
			walk(root + "src", function(err, results){
				if (err) 
					throw err;
				else {
					dependencies = results;
					complete();
				}
			})
		}
});

a5.Create(a5.cl.initializers.nodejs.NodeJSInitializer);
