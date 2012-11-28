
a5.Package('com.testpilot111')

	.Extends('a5.cl.CLBase')
	.Class('Server', function(cls, im){
		
		cls.Server = function(){
			cls.superclass(this);
			require('http').createServer(function (req, res) {
			  res.writeHead(200, {'Content-Type': 'text/plain'});
			  res.end('Hello World\n');
			}).listen(8124, "127.0.0.1");
			console.log('Server running at http://127.0.0.1:8124/');
		}
});