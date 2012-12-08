
a5.Package('a5.cl.initializers.nodejs')

    .Extends('a5.cl.CLInitializer')
    .Class('NodeJSInitializer', function (cls, im) {
		
		var root,
			path;
		
        cls.NodeJSInitializer = function () {
            cls.superclass(this);
			root = process.mainModule.filename.substr(0, process.mainModule.filename.lastIndexOf('/') +1);
			a5.RegisterNamespaceResolver(requireHandler);
        }
		
		cls.Override.load = function(arr, complete, progress){
			for (var i = 0, l = arr.length; i < l; i++) {
				require((arr[i].indexOf(root + "/") != -1 ? root + "/":"") + arr[i]);
			}
			complete();
		}

        cls.Override.initialize = function (props, callback) {
            gatherDependencies(function(dependencies){
				if (dependencies !== null) {
					if(props.dependencies === undefined)
						props.dependencies = dependencies;
					else
						for (var i = 0, l = dependencies.length; i < l; i++) 
							props.dependencies.push(dependencies[i]);
					
				}
				callback();
			});
        }
		
        var requireHandler = function (namespace) {
            return require(namespace);
        }
		
		var gatherDependencies = function(complete){
			var fs = require('fs'), 
				path = root + "src",
				walk = function(dir, done){
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
			
			if (fs.existsSync(path)) {
				walk(path, function(err, results){
					if (err) 
						throw err;
					else {
						complete(results);
					}
				})
			} else {
				complete(null);
			}
		}
});

new a5.cl.initializers.nodejs.NodeJSInitializer();
