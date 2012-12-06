
a5.Package('com.testpilot111')
	.Import('http')
	.Extends('a5.cl.CLBase')
	.Class('Server', function(cls, im){
		
		var server;
		
		cls.Server = function(){
			cls.superclass(this);
			server = im.http.createServer(serverReady);
			server.listen(process.env.PORT, process.env.IP);
			console.log('hello world');
		}
		
		var serverReady = function (req, res) {
		  res.writeHead(200, {'Content-Type': 'text/plain'});
		  res.end('Hello World\n');
		}
});