
a5.Package('a5.nodejs.helpers')
	.Extends('a5.cl.CLBase')
	.Class('Create', function(cls, im){
		
		var pkgName;
		
		cls.Create = function(args){
			parseArgs(args);
			cls.superclass(this);
			var fs = require('fs');
			fs.mkdir('./src');
			fs.readFile(__dirname + '/../fileTmpl/main.js', 'utf8', function(err, data){
				fs.writeFile('./main.js', data.replace('{PKG}', pkgName));
			})
			fs.writeFile('./.a5project', pkgName);
		}
		
		var parseArgs = function(args){
			if (!args.length) {
				console.log("Create requires at least one argument stating the package name of the application.");
				process.exit(0);
			}
			pkgName = args.shift();
			for(var i = 0, l = args.length; i<l; i++){
				
			}
		}
});