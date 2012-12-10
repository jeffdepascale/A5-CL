
/*
Simple JavaScript Templating
John Resig - http://ejohn.org/ - MIT Licensed
*/
a5.Package('a5.cl.plugins.htmlTemplate')

	.Import('a5.cl.CLPlugin',
			'a5.cl.interfaces.IHTMLTemplate')
	
	.Extends('CLPlugin')
	.Implements('IHTMLTemplate')
	.Class('TemplateEngine', function(self){
		
		this.TemplateEngine = function(){
			self.superclass(this);
		}
		
		this.Override.initializePlugin = function(){
			//self.registerForProcess('htmlTemplate');
		}
	  	
		this.populateTemplate = function tmpl(str, data){
			str = str.replace(/'/g, "[SEMI_REPLACE]");//.replace(/</g,"&lt;").replace(/>/g,"&gt;");
			var fn = new Function("obj",
			"var p=[];" +
			"with(obj){p.push('" +
			str
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/((^|%>)[^\t]*)'/g, "$1\r")
			.replace(/\t=(.*?)%>/g, "',$1,'")
			.split("\t").join("');")
			.split("%>").join("p.push('")
			.split("\r").join("\\'")
			+ "');}return p.join('');");	
				var str = fn(data);
				str = str.replace(/\[SEMI_REPLACE\]/g, "'");
				return unescape(str);
		};
  
});