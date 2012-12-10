
a5.Package('a5.nodejs.helpers')
	.Extends('a5.cl.CLBase')
	.Class('Create', function(cls, im){
		
		var pkgName;
		
		cls.Create = function(args){
			parseArgs(args);
			cls.superclass(this);
			var fs = require('fs');
			fs.mkdir('./src');
			fs.writeFile('./main.js', mainFile.replace('{PKG}', pkgName));
		}
		
		var parseArgs = function(args){
			if(!args.length)
				throw "Create requires at least one argument stating the package name of the application.";
			pkgName = args.shift();
			for(var i = 0, l = args.length; i<l; i++){
				
			}
		}
		
		var mainFile = 
	
'require(\'a5\')\n\
\n\
a5.Package(\'{PKG}\')\n\
	\n\
	.Extends(\'a5.cl.CLMain\')\n\
	.Class(\'Main\', function(cls, im){\n\
	\n\
		cls.Main = function(props){\n\
			cls.Super(props);\n\
		}\n\
		\n\
		cls.Override.applicationLaunched = function(){\n\
		\n\
		}\n\
});\n\
\n\
a5.cl.CreateApplication();';
		
});