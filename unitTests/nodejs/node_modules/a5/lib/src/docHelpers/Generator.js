
a5.Package('a5.nodejs.helpers.docs')
	
	.Import('fs')
	.Extends('a5.cl.CLBase')
	.Class('Generator', function(self, im, Generator){
		
		var classListTmpl,
			classTmpl,
			classListOutput,
			classOutputArray = [];
		
		self.Generator = function(){
			self.superclass(this);
			im.fs.readFile(__dirname +'/../../tmpl/classList.xml', 'utf8', function(err, data){
				classListTmpl = data;
			});
			im.fs.readFile(__dirname +'/../../tmpl/class.xml', 'utf8', function(err, data){
				classTmpl = data.replace('{{CLASS_BREAK}}', '<!--CL: id=views/<%=cls.nm.replace(/\\./g, "_")%> type=xml  :CL-->');
			});
		}
		
		self.generateOutput = function(docArray){
			var classListResult = self.plugins().TemplateEngine().populateTemplate(classListTmpl, {docArray:docArray});
			var classResult = self.plugins().TemplateEngine().populateTemplate(classTmpl, {docArray:docArray});
			return '<!--CL: id=views/ClassList.xml type=xml  :CL-->' + classListResult +  classResult;
		}
	

})