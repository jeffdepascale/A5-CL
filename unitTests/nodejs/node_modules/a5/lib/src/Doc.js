
a5.Package('a5.nodejs.helpers')
	.Import('fs',
			'a5.nodejs.helpers.docs.*')
	.Extends('a5.cl.CLBase')
	.Class('Doc', function(cls, im){
		
		var textProcessor,
			generator,
			includeA5 = true;
		
		cls.Doc = function(args){
			cls.superclass(this);
			textProcessor = new im.TextProcessor();
			generator = new im.Generator();
			for(var i = 0, l = args.length; i<l; i++){
				switch(args[i]){
					case "-noa5":
						includeA5 = false;
						break;
				}
			}
			gatherFiles(function(arr){
				generate(arr);
			});
		}
		
		var generate = function(files){
			docArray = textProcessor.processFiles(files);
			var output = generator.generateOutput(docArray);
			im.fs.mkdir('./docs');
			im.fs.mkdir('./docs/views');
			im.fs.createReadStream(__dirname +'/../tmpl/html/index.html').pipe(im.fs.createWriteStream('./docs/index.html'));
			im.fs.createReadStream(__dirname +'/../tmpl/html/docsCode.js').pipe(im.fs.createWriteStream('./docs/docsCode.js'));
			im.fs.createReadStream(__dirname +'/../tmpl/html/views/MainView.xml').pipe(im.fs.createWriteStream('./docs/views/MainView.xml'));
			im.fs.writeFile('./docs/views/doc.xml', output);
		},
		
		gatherFiles = function(complete){
			var fs = require('fs'), 
				path = root = './src';
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
								if (file.charAt(0) !== "_" && file.indexOf(".js") === file.length - 3) {
									im.fs.readFile(file, 'utf8', function(err, data){
										results.push(data);
										next();
									});
								} else {
									next();
								}
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
						im.fs.readFile('./main.js', 'utf8', function(err, data){
							results.push(data);
							complete(results);
							im.fs.readFile(__dirname +'/../A5-CL-Node.js', 'utf8', function(err, data){
								if(includeA5)
									results.push(data);
								complete(results);
							});
						});
					}
				})
			} else {
				complete(null);
			}
		}
});