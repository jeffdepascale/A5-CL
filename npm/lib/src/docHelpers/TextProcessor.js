
a5.Package('a5.nodejs.helpers.docs')

	.Extends('a5.cl.CLBase')
	.Class('TextProcessor', function(self, im){
		
		var classTextObj = {},
			trim = a5.cl.core.Utils.trim,
			includePrivate = false,
			errorOnInvalid = false,
			skippedPackages = /core/,
			lineSplitRegex = /\n|\r|\) *\{|;/,
			pkgBreakers = ['a5.Package(', 'Package('];
		
		self.TextProcessor = function(){
			self.superclass(this);
		}
		
		self.processFiles = function(array){
			for (var i = 0, l = array.length; i < l; i++) {
				processPackages(array);
				var classArray = parseText(array[i]);
				processClasses(classArray);
			}
			return organizeOutput();
		}
		
		var parseText = function(parseString){
			var resp = splitClasses(parseString, pkgBreakers, true),
				str = null,
				isFirstPass = true,
				ret = [];
			if(resp === null){
				str = parseString;
			} else {
				while (resp) {
					if(resp.pre.length && !isFirstPass)
						ret.push(resp.pre);
					str = resp.post;
					isFirstPass = false;
					resp = splitClasses(str, pkgBreakers);
				}
			}
			if(str)
				ret.push(str)
			for(var i = 0; i<ret.length; i++){
				if (!ret[i].length) {
					ret.splice(i, 1);
					i--;
				}
			}
			return ret;
		}

		var splitClasses = function(str, identifiers, isFirstPass){
			var offset = 1;
			str = trim(str);
			if (str.indexOf('/*') == 0)
				offset = str.indexOf('Package', str.indexOf('*/'));
			for(var j = 0, k = identifiers.length; j<k; j++){
				var id = identifiers[j],
					index = str.indexOf(id, isFirstPass ? 0:offset);
				if(index !== -1 && (j == 0 || j==1 && str.charAt(index-1) !== '.')){
					var commentCheck = trim(str.slice(0, index));
					if (commentCheck.lastIndexOf('*/') == commentCheck.length - 2)
						index = str.substr(0, index).lastIndexOf('/*');
					return {pre:trim(str.slice(0, index)), post:trim(str.slice(index))}
				}
			}
			return null;
		}
		
		var processPackages = function(classArray){
			for(var i = 0, l = classArray.length; i<l; i++){
				var index = classArray[i].search(/\* *@package/g);
				if(index !== -1){
					//process package declarations
				}
			}
		}
		
		var processClasses = function(clsArray){
			for(var i = 0, l = clsArray.length; i<l; i++){
				var isValid = true,
					str = clsArray[i],
					pkg = str.substring(str.indexOf('(') +2, str.indexOf(')')-1),
					ext = null,
					mix = [],
					impl = [],
					imprt = null,
					clsComments = null,
					isAbstract = false,
					isFinal = false,
					isSingleton = false,
					stat = {},
					extIndex = str.indexOf('.Extends('),
					clsIndex = str.indexOf('.Class('),
					mixIndex = str.indexOf('.Mix('),
					importIndex = str.indexOf('.Import('),
					mixinIndex = str.indexOf('.Mixin('),
					interfaceIndex = str.indexOf('.Interface('),
					implementsIndex = str.indexOf('.Implements('),
					protoIndex = str.indexOf('.Prototype('),
					staticIndex = str.indexOf('.Static('),
					isStaticDeclaration = false,
					typeDelim = null,
					type,
					clsName;
				var commentIndex = str.indexOf('/**');
				if(commentIndex !== -1 && commentIndex < str.indexOf('('))
					clsComments = str.substring(commentIndex + 3, str.indexOf('*/')).replace(/\* /g, '\n*').split(lineSplitRegex);
				if (clsComments)
					clsComments = parseComments(clsComments, true);
				else
					clsComments = {description:null};
				if (clsIndex !== -1) {
					typeDelim = str.indexOf(',', clsIndex);
					clsName = str.substring(clsIndex + 8, typeDelim-1);
					isFinal = true;
					type = 'Class';
				} else if(protoIndex !== -1){
					typeDelim = str.indexOf(',', protoIndex);
					clsName = str.substring(protoIndex + 12, typeDelim-1);
					type = 'Prototype';
				} else if(mixinIndex !== -1){
					clsName = str.substring(mixinIndex + 8, str.indexOf(',', mixinIndex)-1);
					type = 'Mixin';
				} else if(interfaceIndex !== -1){
					clsName = str.substring(interfaceIndex + 12, str.indexOf(',', interfaceIndex)-1);
					type = 'Interface';
				} else if(staticIndex !== -1){
					if(str.substring(staticIndex, str.indexOf('{', staticIndex)).match(/,/)){
						isStaticDeclaration = true;
						clsName = str.substring(staticIndex + 9, str.indexOf(',', staticIndex)-1);
						type = 'Class';
					}				
					
				} else if(clsArray[i].substr(0, 2) !== '//' && 
						  clsArray[i].substr(0, 2) !== '/*'){
							if(errorOnInvalid)
								return self.throwError('invalid class: \n' + str);
							else
								isValid = false;
				}
				if (clsName && isValid) {
					if (extIndex !== -1) {
						ext = str.substring(extIndex + 10, str.indexOf(')', extIndex) - 1);
					}
					if (mixIndex !== -1) {
						var mixStr = str.substring(mixIndex + 6, str.indexOf(')', mixIndex) - 1).replace(/\s|'|"/g, "");
						mix = mixStr.split(",");
					}
					if(importIndex !== -1){
						imprt = str.substring(importIndex + 9, str.indexOf(')', importIndex) - 1);
					}
					if (implementsIndex !== -1) {
						var implStr = str.substring(implementsIndex + 13, str.indexOf(')', implementsIndex) - 1).replace(/\s|'|"/g, "");
						impl = implStr.split(',');
					}
					if(staticIndex != -1 && !isStaticDeclaration){
						var staticDefString = str.substring(str.indexOf('){', staticIndex), str.indexOf('})', staticIndex)),
							delimWord = str.substring(str.indexOf('function(', staticIndex)+9, str.indexOf('){', staticIndex));
						if(delimWord.indexOf(','))
							delimWord = delimWord.split(',')[0];
						stat = parsePropsAndMethods(staticDefString, clsName, pkg + '.' + clsName, delimWord);
					}
					if(typeDelim){
						var typeStr = trim(trim(str.substring(typeDelim+1, str.indexOf('function(', typeDelim+1))).replace(/'/g, "").replace(/"/g, "").replace(/,/g, ""));
						if(typeStr.length){
							var split = typeStr.split(" ");
							for(var j = 0, k = split.length; j<k; j++){
								if(split[j] == 'abstract')
									isAbstract = true;
								if(split[j] == 'singleton')
									isSingleton = true;
								if(split[j] == 'final')
									isFinal = true;
							}
						}
					}
					if (!pkg.match(skippedPackages)) {
						classTextObj[pkg + '.' + clsName] = {
							cls: str,
							clsName: clsName,
							ext: ext,
							mix: mix,
							imprt: imprt,
							impl: impl,
							pkg: pkg,
							isAbstract:isAbstract,
							isSingleton:isSingleton,
							isFinal:isFinal,
							nm: pkg + '.' + clsName,
							type: type,
							comments:clsComments,
							propsAndMethods: parseInstancePropsAndMethods(str, type, clsName, pkg + '.' + clsName)
						}
						var setObj = classTextObj[pkg + '.' + clsName].propsAndMethods;
						setObj.StaticMethods = stat.Methods || null;
						setObj.StaticProperties = stat.Properties || null;
						setObj.StaticPrivateMethods = stat.PrivateMethods || null;
						setObj.StaticPrivateProperties = stat.PrivateProperties || null;
					}
				}
			}
			/*classTextObj['TopLevel.Object'] = {
				cls:'',
				clsName:'Object',
				mix:[],
				impl:[],
				comments:{description:null},
				nm:'TopLevel.Object',
				pkg:'TopLevel',
				type:'Prototype',
				propsAndMethods:{
					StaticMethods:{
						classPackage:{details:{}},
						className:{details:{}},
						namespace:{details:{}},
						imports:{details:{}},
						doesImplement:{details:{}},
						doesExtend:{details:{}},
						doesMix:{details:{}},
						getAttributes:{details:{}},
						instance:{details:{}},
						superclass:{details:{}},
						instanceCount:{details:{}},
						isInterface:{details:{}},
						isFinal:{details:{}},
						isSingleton:{details:{}},
						isAbstract:{details:{}},
						isPrototype:{details:{}}
					},
					Methods:{
						superclass:{details:{}},
						getStatic:{details:{}},
						autoRelease:{details:{}},
						mixins:{details:{}},
						mix:{details:{}},
						getAttributes:{details:{}},
						getAttributeValue:{details:{}},
						getMethods:{details:{}},
						getProperties:{details:{}},
						classPackage:{details:{}},
						className:{details:{}},
						getClass:{details:{}},
						namespace:{details:{}},
						doesImplement:{details:{}},
						doesExtend:{details:{}},
						doesMix:{details:{}},
						imports:{details:{}},
						instanceCount:{details:{}},
						isInterface:{details:{}},
						isFinal:{details:{}},
						isSingleton:{details:{}},
						isAbstract:{details:{}},
						isPrototype:{details:{}},
						instanceUID:{details:{}},
						destroy:{details:{}},
						create:{details:{}},
						throwError:{details:{}},
						assert:{details:{}}
					}
				}
			}*/
			determineFullPackages();
			determineInherited();
		}
		
		var parseInstancePropsAndMethods = function(str, type, clsName, nm){
			str = str.replace(/function +/g, 'function');
			var delimIndex = str.indexOf('function(', str.indexOf('.' + type + '(')) + 9,
				endDelim = str.indexOf(')', delimIndex),
				delimWord = str.substring(delimIndex, endDelim),
				clsStr = str.substr(endDelim);
			if(delimWord.indexOf(','))
				delimWord = delimWord.split(',')[0];
			return parsePropsAndMethods(clsStr, clsName, nm, delimWord);
		}
		
		var parsePropsAndMethods = function(str, clsName, nm, delimWord){
			str = str.replace(/\* /g, '\n*');
			var strArray = str.split(lineSplitRegex);
			for(var i = 0; i<strArray.length; i++){
				if(trim(strArray[i]) == ""){
					strArray.splice(i, 1);
					i--;
				}
			}
			var retObj = {Properties:null, Methods:null, PrivateMethods:null, Constructor:null};
			for (var i = 0; i < strArray.length; i++) {
				var line = strArray[i] = trim(strArray[i]);
				var checkedDelimWord = delimWord;
				if(!(line.substr(0, checkedDelimWord.length + 1) === checkedDelimWord + '.'))
					checkedDelimWord = 'this';
				if(line.substr(0, checkedDelimWord.length + 1) === checkedDelimWord + '.' && line.indexOf('=') !== -1) {
					var isMethod = line.search(/function\(|this.Attributes\(/) !== -1,
						methodEndIndex = line.search(isMethod  ? /= *function\(|= *this.Attributes\(/:/=/),
						methodName = methodEndIndex !== -1 ? trim(line.substring(checkedDelimWord.length+1, methodEndIndex)):'',
						commentStart = -1,
						commentsObj = {};
					if (methodName.match(/^[a-zA-Z0-9_.]*$/)) {
						if (i > 0 && trim(strArray[i - 1]).substr(0, 2) === '*/') {
							for (var j = i - 1; j > -1; j--) {
								if (trim(strArray[j]).substr(0, 3) === '/**') {
									commentStart = j;
									break;
								}
							}
						}
						if (methodName && methodName !== 'dealloc') {
							var isFinal = false, isPrivate = false, isOverride = false;
							if(methodName.indexOf('Override.') === 0){
								isOverride = true;
								methodName = methodName.substr(9);
							}
							if (methodName.indexOf('Final.') === 0) {
								isFinal = true;
								methodName = methodName.substr(6);
							}
							if (methodName.substr(0, 1) === '_') 
								isPrivate = true;
							if (!isPrivate || includePrivate) {
								if (commentStart !== -1)
									commentsObj = parseComments(strArray.slice(commentStart + 1, i - 1));
								var funcIndex = line.search(/function\(/);
								if(funcIndex !== -1 && line.indexOf('(') !== line.length-1){
									var spl = line.substring(line.indexOf('(')+1).split(',');
									if(!commentsObj.params)
										commentsObj.params = {};
									for (var j = 0, k = spl.length; j < k; j++) {
										var paramName = trim(spl[j]);
										if (paramName && !commentsObj.params[paramName]) {
											commentsObj.params[paramName] = {
												optional: false,
												type: 'object',
												description: null
											}
										}
									}
								}
								var typeStr = isMethod ? (methodName === clsName ? 'Constructor' : 'Methods') : 'Properties';
								if (typeStr === 'Constructor') {
									if(!commentsObj.description)
										commentsObj.description = "Creates a new " + clsName + " instance.";
									retObj.Constructor = {
										name:clsName,
										details: commentsObj
									};
								} else {
									if(typeStr === 'Methods' && isPrivate)
										typeStr = 'PrivateMethods';
									else if(typeStr === 'Properties' && isPrivate)
										typeStr = 'PrivateProperties';
									var obj = retObj[typeStr];
									if (!obj) 
										obj = retObj[typeStr] = {};
									if(!obj[methodName])
										obj[methodName] = {
											isFinal: isFinal,
											isOverride:isOverride,
											definedBy:nm,
											details: commentsObj
										}
								}
							}
						}
					}
				}
			}
			return retObj;		
		}
		
		var parseComments = function(commentArray, isClass){
			var params = null,
				description = null,
				returns = null,
				foundFirstProp = false,
				isClass = isClass == true? true:false;
			for (var i = 0, l = commentArray.length; i<l; i++){
				var line = trim(trim(commentArray[i]).substr(1));
				if (isClass && line.indexOf('@class') == 0)
					line = line.substr(6);
				if (line.length) {
					if (line.charAt(0) === '@') {
						foundFirstProp = true;
						var tag = line.match(/@[a-z]*/)[0];
						if(tag)
							tag = tag.substr(1);
						if(isClass){
							switch (tag) {
								case 'author':
									
									break;
							}
						} else {
							switch(tag){
								case 'param':
									var testStr = trim(line.substr(6)), firstSpaceIndex = testStr.indexOf(' '), paramType = testStr.substr(0, firstSpaceIndex), noDesc = false;
									if (paramType.charAt(0) === '{' && paramType.charAt(paramType.length - 1) === '}') {
										paramType = paramType.substring(1, paramType.length - 1);
										var secondSpaceIndex = testStr.indexOf(' ', firstSpaceIndex + 1);
										if (secondSpaceIndex === -1) {
											secondSpaceIndex = testStr.length;
											noDesc = true;
										}
										if (firstSpaceIndex !== secondSpaceIndex) {
											var name = testStr.substring(firstSpaceIndex + 1, secondSpaceIndex), optional = false;
											if (name.charAt(0) === '[' && name.charAt(name.length - 1) === ']') {
												optional = true;
												name = name.substring(1, name.length - 1);
											}
											if (!params) 
												params = {};
											params[name] = {
												optional: optional,
												type: toEntities(paramType),
												description: noDesc ? null : toEntities(testStr.substr(secondSpaceIndex + 1))
											}
										}
									}
									break;
								case 'return':
									var testStr = trim(line.substr(7)), spaceIndex = testStr.indexOf(' '), noDesc = false;
									if (spaceIndex === -1) {
										spaceIndex = testStr.length;
										noDesc = true;
									}
									var paramType = null;
									if (testStr.charAt(0) === '{' && testStr.indexOf('}') !== -1) 
										paramType = testStr.substring(1, testStr.indexOf('}'));
									if (paramType || !noDesc) {
										returns = {
											type: paramType,
											description: noDesc ? null : toEntities(testStr.substr(spaceIndex + 1))
										}
									}
									break;
								case 'see':
								
									break;
							}
						}
					} else {
						if (description === null) 
							description = line;
						else 
							description += '\n' + line;
					}
				}
			}
			if(description && description.indexOf('{@link') !== -1){
				//
			}
			if (isClass) {
				return { description: description ? toEntities(trim(description)) : null };
			} else {
				return {
					params: params,
					description: description ? toEntities(trim(description)) : null,
					returns: returns
				}
			}
		}
		
		var toEntities = function(str){
			return str.replace(/'/g, '&apos;').replace(/"/g, '&quot;')
					.replace(/&/g, '&amp;').replace(/</g, '&lt;')
					.replace(/>/g, '&gt;').replace(/{/g, '&#123;')
					.replace(/}/g, '&#125;');
		}
		
		var determineFullPackages = function(){
			for (var cls in classTextObj) {
				var clz = classTextObj[cls];
				if(!classTextObj[clz.ext])
					clz.ext = determineFromImport(clz.ext, clz.pkg, clz.imprt);
				if(!classTextObj[clz.impl])
					clz.impl = determineFromImport(clz.impl, clz.pkg, clz.imprt);
				if(!classTextObj[clz.mix])
					clz.mix = determineFromImport(clz.mix, clz.pkg, clz.imprt);
			}
		}
		
		var determineFromImport = function(clsName, pkg, imports){
			if(classTextObj[pkg + '.' + clsName])
				return pkg + '.' + clsName;
			if(!imports)
				return clsName;
			for(var i = 0, l = imports.length; i<l; i++){
				var im = imports[i],
					substr = im.substring(im.lastIndexOf('.'));
				if(substr === '*'){
					var testStr = im.substr(0, im.length-1) + clsName;
					if(classTextObj[testStr])
						return str;
				} else {
					if(substr === clsName && classTextObj[im])
						return im;
				}
			}
			return clsName;
		}
		
		var determineInherited = function(){
			var obj = classTextObj;
			for(var cls in obj){
				var clz = classTextObj[cls];
				if(clz.ext && classTextObj[clz.ext]){
					var parentCls = classTextObj[clz.ext];
					clz.propsAndMethods.InheritedMethods = {};
					clz.propsAndMethods.InheritedProperties = {};
					do{
						if(parentCls.isSingleton)
							clz.isSingleton = true;
						for (var meth in parentCls.propsAndMethods.Methods)
							clz.propsAndMethods.InheritedMethods[meth] = parentCls.propsAndMethods.Methods[meth];
						for (var property in parentCls.propsAndMethods.Properties)
							clz.propsAndMethods.InheritedProperties[property] = parentCls.propsAndMethods.Properties[property];
						parentCls = classTextObj[parentCls.ext];
					} while (parentCls);
				}
			}
		}
		
		var organizeOutput = function(){
			var nmObj = {},
				retArray = [];
			for (var prop in classTextObj) {
				var obj = classTextObj[prop];
				if (!nmObj[obj.pkg]) 
					nmObj[obj.pkg] = {};
				nmObj[obj.pkg][obj.clsName] = classTextObj[prop];
			}
			
			//order namespaces
			retArray = organizeObj(nmObj);
			for (var i = 0, l = retArray.length; i < l; i++) {
				//order packages internally
				retArray[i].value = organizeObj(retArray[i].value);
				//order classes internally
				for(var j = 0, k = retArray[i].value.length; j<k; j++)
					retArray[i].value[j].value = organizeClass(retArray[i].value[j].value);
			}
			return retArray;
		}
		
		var organizeObj = function(obj){
			if(obj){
				var retArray = [];
				for(var prop in obj)
					retArray.push({name:prop, value:obj[prop]});
				return retArray.sort(function(a,b){ return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
			} else {
				return null;
			}
		}
		
		var organizeClass = function(cls){
			var subOrganizeArray = ['Properties', 'InheritedMethods', 'InheritedProperties', 
									'PrivateMethods', 'Methods', 'StaticMethods', 'StaticProperties',
									'StaticPrivateMethods', 'StaticPrivateProperties'];
			for (var i = 0, l = subOrganizeArray.length; i<l; i++)
				cls.propsAndMethods[subOrganizeArray[i]] = organizeObj(cls.propsAndMethods[subOrganizeArray[i]], subOrganizeArray[i]);
			return cls; 
		}
})
