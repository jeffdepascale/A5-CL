
a5.Package('a5.nodejs.helpers')
	.Extends('a5.cl.CLBase')
	.Class('CreateClass', function(cls, im){
		
		var pkgName,
			clsType,
			clsName;
		
		cls.CreateClass = function(_clsType, args){
			clsType = _clsType;
			parseArgs(args);
			cls.superclass(this);
			var fs = require('fs');
			fs.readFile('./.a5project', 'utf8', function(err, pkg){
				var dirPkgAndName = clsName.substr(pkg.length+1),
					dirPkg = dirPkgAndName.substr(0, dirPkgAndName.lastIndexOf('.'));
					cls = dirPkgAndName.substr(dirPkgAndName.lastIndexOf('.')+1);
				mkdirParent('src/' + dirPkg.replace('.', '/'));
				var clsCap = cls.substr(0, 1).toUpperCase() + cls.substr(1);
				fs.readFile(__dirname + '/../fileTmpl/' + clsType + '.js', 'utf8', function(err, data){
					fs.writeFile('src/' + dirPkg + '/' + clsCap + '.js', data.replace('{PKG}', pkg + '.' + dirPkg).replace(/{NAME}/g, clsCap));
				})
			})
		}
		
		var parseArgs = function(args){
			if (!args.length) {
				console.log("Create " + clsType + " requires at least one argument stating the full name of the " + clsType + ".");
				process.exit(0);
			}
			clsName = args.shift();
			for(var i = 0, l = args.length; i<l; i++){
				
			}
		}
		
		var mkdirParent = function(dirPath, mode, callback) {
			var path = require('path'),
				fs = require('fs');
		  fs.mkdir(dirPath, mode, function(error) {
		    if (error && error.errno === 34) {
		      mkdirParent(path.dirname(dirPath), mode, callback);
		      mkdirParent(dirPath, mode, callback);
		    }
		    callback && callback(error);
		  });
};
});