
//A5, Copyright (c) 2012, Jeff dePascale http://www.a5js.com
(function(global) {

	"use strict";
	
    var globalItemList = null,
        namespaceResolver = null,
		ES5 = (function(){ "use strict"; return !this; })(),
	
	Async = function(func, args, delay, onComplete){
		var self = this,
			delay = delay || 0,
			isA5 = this.isA5,
			intervalInst = setTimeout(function(){
				if (!isA5 || self._a5_initialized) {
					var result = func.apply(self, args || []);
					if (onComplete) 
						onComplete.call(self, result);
				}
			}, delay);
		return{
			cancel:function(){ clearTimeout(intervalInst); }
		}
	},
	
	Cycle = function(func, args, interval, maxCycles, onCycle, onComplete){
		var self = this,
			isA5 = this.isA5,
			cycleCount = 0,
			maxCycles = maxCycles || 0, 
			intervalInst = setInterval(function(){
				if (!isA5 || self._a5_initialized) {
					var result = func.apply(self, args || []);
					if (onCycle) 
						onCycle.call(self, result);
					cycleCount++;
					if(cycleCount == maxCycles){
						clearInterval(intervalInst);
						if(onComplete)
							onComplete.call(self, result);
					}				
				}
			}, interval);
		return{
			cancel:function(){ clearInterval(intervalInst); }
		}
	},
	
	GetNamespace = function(namespace, imports, allowGenericReturns){
		var splitNM, i, l, context;
		if(!namespace)
			return null;
		allowGenericReturns = allowGenericReturns || false;
		if(typeof namespace === 'object')
			return namespace;
		splitNM = namespace.split('.');
		context = global;
		if(splitNM.length === 1 && imports && imports[namespace])
			return imports[namespace];
		for(i= 0, l=splitNM.length; i<l; i++){
			context = context[splitNM[i]];
			if (context === undefined) {
				if (namespaceResolver) {
					try {
						var result = namespaceResolver(namespace, imports);
						if (result) 
							return result;
					} catch(e){
						return null;
					}
				}
				else 
					return null;
			}
		}
		if (allowGenericReturns || context.namespace !== undefined)
		    return context;
		return null;
	},
	SetNamespace = function(namespace, arg1, arg2){
		var hasBool = typeof arg1 === 'boolean',
			autoCreate = hasBool ? arg1:false,
			splitNM,
			placedObject = (hasBool ? arg2:arg1) || {},
			splitNM = namespace.split('.'),
			property = splitNM.pop(),
			object;
		if(!namespace.match(/^[A-Za-z0-9.]*$/))
			return a5.ThrowError(100, null, {namespace:namespace});
		object = splitNM.length ? objectQualifier(splitNM) : global
		if (object[property] !== undefined)
			return object[property]; 
		return object[property] = autoCreate ? new placedObject() : placedObject;
	},	
	
	objectQualifier = function(nmArr){
		var context = global,
			i, l;
		for(i = 0, l=nmArr.length; i<l; i++){
			if(!context[nmArr[i]]) context[nmArr[i]] = {};
			context = context[nmArr[i]];
		}
		return context;
	},
	
	TrackGlobalStrays = function(){
		globalItemList = {};
		for(var prop in global)
			globalItemList[prop] = '';
	},
	
	GetGlobalStrays = function(purge){
		if(!globalItemList)
			a5.ThrowError(101);
		else {
			var retList = [], prop
			for(prop in global)
				if(globalItemList[prop] === undefined)
					retList.push(prop);
			if(purge === true)
				TrackGlobalStrays();
			return retList;
		}	
	}
	
	global.a5 = {
		Version:function(){ return '0.5.{BUILD_NUMBER}'; },	
		GetNamespace:GetNamespace,	
		SetNamespace:SetNamespace,
		ES5:ES5,	
		Async:Async,
		Cycle:Cycle,
		TrackGlobalStrays:TrackGlobalStrays,
		GetGlobalStrays:GetGlobalStrays,
		RegisterNamespaceResolver: function (resolver) { namespaceResolver = resolver; },
		CreateGlobals:function(){
			global.Create = a5.Create;
			global.Async = a5.Async;
			global.Cycle = a5.Cycle;
			global.Package = a5.Package;
			global.GetNamespace = a5.GetNamespace;
			global.SetNamespace = a5.SetNamespace;
		}
	}


a5.SetNamespace('a5.core.reflection', true, function(){
	
	var proxyMethods = {
		getName:function(){	return this._a5_methodName;	},
		getClass:function(){ return this._a5_ownerClass; },
		getClassInstance:function(){ return this._a5_ownerInstance; },
		getAttributes:function(){ return this._a5_attributes ? this._a5_attributes : null; }
	},
	
	setReflection = function(cls, clsInstance, method, obj){
		obj = obj || clsInstance[method];
		obj._a5_ownerInstance = clsInstance;
		obj._a5_ownerClass = cls;
		obj._a5_methodName = method;
		obj.getName = proxyMethods.getName;
		obj.getClass = proxyMethods.getClass;
		obj.getClassInstance = proxyMethods.getClassInstance;
		obj.getAttributes = proxyMethods.getAttributes;
	}
	
	return {
		setReflection:setReflection
	}
});


a5.SetNamespace('a5.core.attributes', true, function(){
	
	var createAttribute = function(scope, args){
		var attributes = Array.prototype.slice.call(args),
			method, i, j, k, l, t,
			attrObj = {},
			isAspect = false;
		if(!attributes.length)
			return a5.ThrowError(305);
		method = typeof attributes[attributes.length-1] === 'function' ? attributes.pop() : null;
		if(method !== null && typeof method !== 'function')
			return a5.ThrowError(300);
		if (!attributes.length)
			return a5.ThrowError(301);
		for(i = 0, l = attributes.length; i<l; i++){
			var attrDef = attributes[i];
			if(Object.prototype.toString.call(attrDef) !== '[object Array]')
				return a5.ThrowError(302);
			for(j = 0, k = attrDef.length; j <k; j++){
				var attr = attrDef[j],
					t = typeof attr;
				if(j == 0){
					var isError = false,
						clsDef = null;
					if(t !== 'string'){
						if(t === 'function'){
							clsDef = attr;
						} else
							isError = true;
					} else {
						var cls = a5.GetNamespace(attr, scope.imports());
						if(!cls)
							cls = a5.GetNamespace(attr + 'Attribute', scope.imports());
						if(cls)
							clsDef = attrDef[j] = cls;
						else
							isError = true;
					}
					if(!isError && (!clsDef.isA5 || !clsDef.doesExtend(a5.Attribute)))
						isError = true;
					else if(!isError && clsDef.doesExtend(a5.AspectAttribute))
						isAspect = true;
					if (isError) {
						return a5.ThrowError(303);
					}
				} else {
					if(t !== 'object' || Object.prototype.toString.call(attr) === '[object Array]')
						return a5.ThrowError(304);
				}
				//validate all arrays, length at least one, first is string, all remaining are objects, not arrays
			}
		}
		for (i = 0, l = attributes.length; i < l; i++) {
			var arr = attributes[i],
				vals = [];
			for(var j = 1, k = arr.length; j<k; j++)
				vals.push(arr[j]);
			attributes[i] = [arr[0], vals];
			attrObj[arr[0].className()] = vals;
		}
		
		if (!isAspect) {
			if(!method)
				method = function(){};
			method._a5_attributes = attrObj;
			return method;
		}

		attrObj.wrappedMethod = method;
			
		var proxyFunc = function(){
			var prop,
				attrClasses = [], 
				executionScope = this,
				count = 0;
			if(method)
				for(var prop in proxyFunc)
					method[prop] = proxyFunc[prop];
			for(var i = 0, l = attributes.length; i<l; i++){
				var cls = attributes[i][0],
					clsInst = cls.instance(true),
					props = attributes[i][1];
				attrClasses.push({cls:clsInst, props:props});
			}
			
			var processCB = function(args, isAfter, beforeArgs){
				processAttribute(count, args, isAfter, beforeArgs);
			},
			
			processAttribute = function(id, args, isAfter, beforeArgs){
				if (args) {
					if (Object.prototype.toString.call(args) !== '[object Array]') 
						args = [args];
				} else {
					args = [];
				}
				if(!beforeArgs)
					beforeArgs = args;
				if (id >= attrClasses.length) {
					if (isAfter) {
						return args[0];
					} else 						
						return processAfter(args, beforeArgs);
				}
				var ret, 
					isAfter = isAfter || false,
					isAround = false,
					isAsync = false,
					callback = function(_args){
						processCB.call(this, _args || args, isAfter, beforeArgs);	
					}	
					var argsObj = new a5.AspectCallArguments(attrClasses[id].props, args, executionScope, proxyFunc, callback, beforeArgs);
					ret = attrClasses[id].cls.around(argsObj);
					if(ret === a5.AspectAttribute.NOT_IMPLEMENTED)
						ret = attrClasses[id].cls[(isAfter ? "after" : "before")](argsObj);
					else
						isAround = true;
				if (ret !== null && ret !== undefined) {
					switch(ret){
						case a5.AspectAttribute.NOT_IMPLEMENTED:
						case a5.AspectAttribute.SUCCESS:
							ret = args;
							break;
						case a5.AspectAttribute.ASYNC:
							isAsync = true;
							break;
						case a5.AspectAttribute.RETURN_NULL:
							ret = null;
							break;
						case a5.AspectAttribute.FAILURE:
							return;
					}
				} else {
					return a5.ThrowError(308, null, {prop:prop, method:isAround ? 'around' : (isAfter ? 'after' : 'before')});
				}
				count = id+1;
				if(!isAsync)
					return processAttribute(count, ret, isAfter, args, beforeArgs);
			},
			
			processAfter = function(args, beforeArgs){
				count = 0;
				var postRet = method ? method.apply(executionScope, args) : undefined;
				if(postRet !== undefined)
					postRet = [postRet];
				else
					postRet = args;
				return processAttribute(0, postRet, true, beforeArgs);
			}			
			return processAttribute(count, Array.prototype.slice.call(arguments));
		}
		proxyFunc._a5_attributes = attrObj;
		return proxyFunc;
	},
	
	createAttribs = function(){
		for(i = 0, l=a5.Attribute._extenderRef.length; i<l; i++)
			new a5.Attribute._extenderRef[i]();
	},
	
	validMName = function(methodName, str){
		var split = str.split('|');
		for(var i = 0, l=split.length; i<l; i++){
			var r = split[i],
				beginW = r.charAt(0) === '*',
				endW = r.charAt(r.length-1) === '*',
				index = methodName.indexOf(r),
				isMatch = index !== -1;
			if (isMatch)
				return true;
			if(beginW && methodName.indexOf(r.substr(1)) === 0)
				return true;
			if(endW && methodName.indexOf(r.substr(0, r.length-1)) > -1)
				return true;
		}
		return false;
	},
	
	applyClassAttribs = function(cls, attribs){
		var methods = cls.getMethods(),
			slice = Array.prototype.slice;
		for (var i = 0, l = methods.length; i < l; i++) {
			var methodName = methods[i],
					method = cls[methodName],
					appliedAttribs = [];
			for(var j = 0, k=attribs.length; j<k; j++){	
				var attr = slice.call(attribs[j]);
				if (attr.length > 1) {
					var ruleObj = attr[attr.length-1],
						validRuleObj = false,
						validMethod = true,
						incl = ruleObj.include,
						excl = ruleObj.exclude;
					if(incl !== undefined){
						validRuleObj = true;
						if(typeof incl === 'object')
							validMethod = methodName.match(incl).length > 0;
						else
							validMethod = validMName(methodName, incl);
					}
					if(excl !== undefined){
						validRuleObj = true;
						if(typeof excl === 'object')
							validMethod = methodName.match(excl);
						else
							validMethod = validMName(methodName, excl);
					}
					if(validRuleObj)
						attr.pop();
					if(validMethod)
						appliedAttribs.push(attr);
				} else {
					appliedAttribs.push(attr);
				}
			}
			if (appliedAttribs.length) {
				appliedAttribs.push(method);
				cls[methodName] = a5.core.attributes.createAttribute(cls, appliedAttribs);
				a5.core.reflection.setReflection(cls.constructor, cls, methodName, cls[methodName]);
			}
		}
	}
	
	return {
		createAttribute:createAttribute,
		applyClassAttribs:applyClassAttribs
	}
});



a5.SetNamespace('a5.core.classBuilder', true, function(){
	
	var packageQueue = [], 
		delayProtoCreation = false, 
		queuedPrototypes = [], 
		queuedImplementValidations = [], 
		prop, 
		FROM_CREATE = '_a5_constructFromCreate', 
		BASE_CONSTRUCT = "_a5_baseConstruct", 
		INTERFACE_TEST = '_a5_interfaceTest',
		watchImports = {},
		
	Create = function(classRef, args){
		var ref, retObj;
		if (typeof classRef === 'string') {
			ref = a5.GetNamespace(classRef);
			if (ref === null) 
				return a5.ThrowError(207, null, { className: classRef });
		} else 
			ref = classRef;
		if (typeof ref !== 'function') 
			return a5.ThrowError(207, null, { className: classRef });
		return new ref(FROM_CREATE, args);
	}, 
	
	updateWatches = function(pkg, clsName, obj){
		var i, l, pkgName = pkg.replace(/\./g, '_');
		if(watchImports[pkgName]){
			var arr = watchImports[pkgName];
			for(var i = 0, l = arr.length; i<l; i++)
				if(!arr[i][clsName])
					arr[i][clsName] = obj;
		}
		if(watchImports[pkgName + "_" + clsName]){
			var arr = watchImports[pkgName + "_" + clsName];
			for(i = 0, l = arr.length; i<l; i++)
				if(!arr[i][clsName])
					arr[i][clsName] = obj;
			delete watchImports[pkgName + "_" + clsName];
		}
	},
	
	processDeclaration = function(owner, scope, obj, imports, stRef, isProto){
		if (isProto)
			scope.Properties = function(propFunc){ obj.constructor._a5_protoProps = propFunc; }
		scope.Attributes = function(){ return a5.core.attributes.createAttribute.call(obj, scope, arguments); }
		obj.Override = {};
		obj.Final = {};
		owner.call(scope, obj, imports, stRef);
		a5.core.mixins.prepareMixins(obj);
		processMethodChangers(obj);
		delete scope.Attributes;	
		if (isProto)
			delete scope.Properties;
		delete obj.Final;
		delete obj.Override;
		for (prop in obj) {
			if (({}).hasOwnProperty.call(obj, prop) &&
			typeof obj[prop] === 'function' &&
			(stRef._a5_namespace === 'a5.Object' || a5.core.classProxyObj.instance[prop] === undefined)) {
				if (prop === obj.className()) {
					obj.constructor._a5_instanceConst = obj[prop];
					a5.core.reflection.setReflection(stRef, obj, prop, obj.constructor._a5_instanceConst);
					delete obj[prop];
				} else {
					a5.core.reflection.setReflection(stRef, obj, prop);
				}
			}
		}
	}, 
	
	processMethodChangers = function(obj){
		var sc = obj.superclass(), mixinRef = obj.constructor._a5_mixedMethods;
		if (!sc) 
			sc = {};
		for (prop in obj) {
			if (obj.hasOwnProperty(prop) && typeof obj[prop] === 'function') {
				if (prop !== 'Final' && prop !== 'Override' && prop !== 'constructor' && prop !== 'prototype' && prop !== 'dealloc' && prop !== '_a5_initialized') {
					if (sc[prop] && sc[prop].toString().indexOf('[native code]') === -1) {
						if (sc[prop].Final == true) 
							return a5.ThrowError(201, null, { prop: prop, namespace: obj.namespace() });
						return a5.ThrowError(200, null, { prop: prop, namespace: obj.namespace() });
					} else {
						var mixMethod = mixinRef[prop];
						if (mixinRef[prop] !== undefined && mixMethod !== obj[prop]) {
							return a5.ThrowError(220, null, { prop: prop, namespace: obj.namespace() });
						}
					}
				}
			}
		}
		obj.constructor._a5_superMethods = {};
		for (prop in obj.Override) {
			if (sc[prop] === undefined && mixinRef[prop] === undefined) 
				return a5.ThrowError(202, null, { prop: prop, namespace: obj.namespace() });
			if (sc[prop] && sc[prop].Final !== undefined && sc[prop].Final === true || mixinRef[prop] && mixinRef[prop].Final !== undefined && mixinRef[prop].Final === true) 
				return a5.ThrowError(203, null, { prop: prop, namespace: obj.namespace() });
			obj[prop] = obj.Override[prop];
			obj.constructor._a5_superMethods[prop] = (function(method){
				return function(){
					var args = [].slice.call(arguments, 1), context = this;
					return function(){ return method.apply(context, args); };
				}
			})(sc[prop]);
		}
		for (prop in obj.Final) {
			obj[prop] = obj.Final[prop];
			obj[prop].Final = true;
		}
	}, 
	
	Package = function(pkg){
		var imports, clsName, cls, base, type, proto, implement, mixins, attribs = null, staticMethods = false, isMixin = false, isInterface = false, enumDeclaration = false, isProto = false, 
			process = function(){
				var pkgObj = {
					pkg: pkg,
					imports: processImports(imports, pkg),
					clsName: clsName,
					cls: cls,
					base: base,
					attribs: attribs,
					type: type,
					proto: proto,
					implement: implement,
					mixins: mixins,
					staticMethods: staticMethods,
					isInterface: isInterface,
					isMixin: isMixin,
					enumDeclaration: enumDeclaration,
					isProto: isProto
				}, validationResult = a5.core.verifiers.validateClassDependencies(base, pkgObj.imports, mixins, implement, isInterface, isMixin);
				if (validationResult === true) 
					processClass(pkgObj);
				else 
					packageQueue.push({
						pkg: pkgObj,
						reason: validationResult.reason,
						reasonNM: validationResult.reasonNM
					});
				process = Import = Extends = Implements = Static = Interface = Class = Prototype = Mixin = Mix = Enum = null;
			}, 
			Import = function(){
				imports = Array.prototype.slice.call(arguments);
				return {
					Prototype: Prototype,
					Static: Static,
					Mixin: Mixin,
					Mix: Mix,
					Extends: Extends,
					Implements: Implements,
					Interface: Interface,
					Class: Class
				};
			}, 
			Extends = function(str){
				base = str;
				return {
					Prototype: Prototype,
					Static: Static,
					Import: Import,
					Mix: Mix,
					Implements: Implements,
					Interface: Interface,
					Class: Class
				};
			}, 
			Mix = function(){
				mixins = Array.prototype.slice.call(arguments);
				return {
					Prototype: Prototype,
					Static: Static,
					Extends: Extends,
					Implements: Implements,
					Interface: Interface,
					Class: Class
				};
			}, 
			Implements = function(arr){
				implement = Array.prototype.slice.call(arguments);
				return {
					Prototype: Prototype,
					Static: Static,
					Mix: Mix,
					Import: Import,
					Extends: Extends,
					Class: Class
				};
			}, 
			Static = function(name, func){
				if (typeof name === 'string') {
					clsName = name;
					staticMethods = func;
					process();
				} else {
					staticMethods = name;
					return {
						Prototype: Prototype,
						Implements: Implements,
						Mix: Mix,
						Mixin: Mixin,
						Import: Import,
						Extends: Extends,
						Class: Class
					};
				}
			}, 
			Interface = function(str, $cls){
				clsName = str;
				cls = $cls;
				isInterface = true;
				process();
			}, 
			Mixin = function(){
				isMixin = true;
				var args = Array.prototype.slice.call(arguments);
				clsName = args[0];
				for (var i = 1, l = args.length; i < l; i++) {
					switch (typeof args[i]) {
						case 'string':
							type = args[i];
							break;
						case 'object':
							if (Object.prototype.toString.call(args[i]) === '[object Array]') {
								if (!attribs) 
									attribs = [];
								attribs.push(args[i]);
							}
							break;
						case 'function':
							cls = args[i];
							break;
					}
				}
				process();
			}, 
			Enum = function(name, func){
				clsName = name;
				enumDeclaration = func;
				process();
			}, 
			Class = function(){
				var args = Array.prototype.slice.call(arguments);
				clsName = args[0];
				for (var i = 1, l = args.length; i < l; i++) {
					switch (typeof args[i]) {
						case 'string':
							type = args[i];
							break;
						case 'object':
							if (Object.prototype.toString.call(args[i]) === '[object Array]') {
								if (!attribs) 
									attribs = [];
								attribs.push(args[i]);
							}
							break;
						case 'function':
							cls = args[i];
							break;
					}
				}
				process();
			}, 
			Prototype = function(){
				isProto = true;
				var args = Array.prototype.slice.call(arguments);
				clsName = args[0];
				for (var i = 1, l = args.length; i < l; i++) {
					switch (typeof args[i]) {
						case 'string':
							type = args[i];
							break;
						case 'object':
							if (Object.prototype.toString.call(args[i]) === '[object Array]') {
								if (!attribs) 
									attribs = [];
								attribs.push(args[i]);
							}
							break;
						case 'function':
							proto = args[i];
							break;
					}
				}
				process();
			}
		
			a5.SetNamespace(pkg);
		
			return { Enum: Enum, Static: Static, Import: Import, Extends: Extends, Mixin: Mixin, Mix: Mix, Implements: Implements, Class: Class, Prototype: Prototype, Interface: Interface };
	}, 
	
	Initialize = function(args, createArgs){
		if (!this._a5_initialized) {
			if (this.constructor.isInterface()) 
				return a5.ThrowError(208, null, { nm: ref.namespace() });
			if (this.constructor.isAbstract()) 
				return a5.ThrowError(216, null, { nm: this.constructor.namespace() });
			if (this.constructor.isSingleton() && this.constructor._a5_instance !== null) 
				return a5.ThrowError(217, null, { nm: this.constructor.namespace() });
			var self = this, descenderRef = this, _args = args || [], protoPropRef = [], cs, i, l, mixinRef;
			this._a5_initialized = true;
			this._a5_instanceUID = this.namespace().replace(/\./g, '_') + '__' + this.constructor.instanceCount();
			if (this.instanceCount() === 0) 
				this.constructor._a5_instance = this;
			this.constructor._instanceCount++;
			var self = this, descenderRef = this, _args = args || [], protoPropRef = [], cs, i, l, mixinRef; 
			
			(function(self){
				self.Super = function(){
					if (!self.constructor._a5_superclass.className)
						return a5.ThrowError(210);
					var sclConst = self.constructor._a5_superclass.prototype.constructor._a5_instanceConst;
					if (sclConst) 
						sclConst.apply(self, arguments);
					else a5.ThrowError(211, null, {nm:self.constructor._a5_superclass.className()});
				};			
				for (var prop in self.constructor._a5_superMethods) 
					self.Super[prop] = self.constructor._a5_superMethods[prop].call(self);
			})(this);
			if (typeof this.constructor._a5_instanceConst !== 'function') 
				return a5.ThrowError(218, null, { clsName: this.className() });
			while (descenderRef !== null) {
				var dConst = descenderRef.constructor;
				if (dConst._a5_attribs) 
					a5.core.attributes.applyClassAttribs(this, dConst._a5_attribs);
				if (dConst._a5_protoProps !== undefined) 
					protoPropRef.unshift(dConst._a5_protoProps);
				
				descenderRef = dConst.superclass &&
				dConst.superclass().constructor.namespace ? dConst.superclass() : null;
			}
			a5.core.mixins.initializeMixins(this);
			for (i = 0, l = protoPropRef.length; i < l; i++) 
				protoPropRef[i].call(this);
			if (args == FROM_CREATE) 
				this.constructor._a5_instanceConst.apply(this, createArgs || []);
			else 
				this.constructor._a5_instanceConst.apply(this, arguments);
			a5.core.mixins.mixinsReady(this);
		}
	},
	
	Extend = function(namespace, base, clsDef, type, isInterface, isProto, imports, mixins, attribs){
		if(isInterface){
			if (base && !base.isInterface())
				return a5.ThrowError('Interface "' + namespace + '" cannot extend "' + base.namespace() + '", base class is not an interface.');
			base = null;		
		}
		var genBaseFunc = function(){},
			isFinal = isProto === false || false,
			isSingleton = false,
			isAbstract = false,
			superclass = null,
			nmi = namespace.lastIndexOf('.'),
			pkg = nmi > -1 ? namespace.substring(0, nmi):"",
			clsName = nmi > -1 ? namespace.substring(nmi+1):namespace,
			typeSplit,
			extender,
			eProto,
			eProtoConst, i, l;

		
		
		if (!base || base === undefined) base = (namespace == 'a5.Object' ? genBaseFunc : a5.Object);
		extender = function(args, createArgs){
				var self = this;
				if (this.constructor._a5_clsDef) 
					processDeclaration(this.constructor._a5_clsDef, this, this, this.constructor.imports(), this.constructor);
				if(args !== INTERFACE_TEST && args !== BASE_CONSTRUCT)
					Initialize.apply(this, arguments);
				//if(a5.ES5)
				//	Object.freeze(this);
			}
		
		if (type) {
			typeSplit = type.split(/[ |]/);
			for (i = 0, l = typeSplit.length; i<l; i++) {
				if (typeSplit[i] == 'final') isFinal = true;
				else if (typeSplit[i] == 'singleton') isSingleton = true;
				else if (typeSplit[i] == 'abstract') isAbstract = true;
			}
		}
		if (a5.core.verifiers.checkNamespaceValid(namespace)) {
			if (!base.isFinal || (base.isFinal() != true)) {
				if(base === Error){
					var proxy = {};
					proxy.prototype = new base();
					extender.prototype = proxy;
					proxy = null;	
				} else
					extender.prototype = new base(BASE_CONSTRUCT);
				superclass = base;
			} else
				return a5.ThrowError('Cannot extend ' + base.namespace() + ', class marked as final.');
		} else
			return a5.ThrowError('Cannot create new class in namespace ' + namespace + ', definition already exists.');
		
		eProto = extender.prototype;
		eProtoConst = eProto.constructor = extender;
		if (base.prototype.constructor._extenderRef)
			base.prototype.constructor._extenderRef.push(extender);
		eProtoConst._a5_superclass = superclass;
		eProtoConst._a5_pkg = pkg;
		eProtoConst._a5_clsDef = clsDef;
		eProtoConst._a5_clsName = clsName;
		eProtoConst._a5_namespace = namespace;
		eProtoConst._a5_imports = imports;
		eProtoConst._a5_isFinal = isFinal;
		eProtoConst._a5_isAbstract = isAbstract;
		eProtoConst._a5_isSingleton = isSingleton;
		eProtoConst._a5_isInterface = isInterface;
		eProtoConst._a5_isPrototype = isProto || false;
		eProtoConst._a5_attribs = attribs;
		eProtoConst._mixinRef = base.prototype.constructor._mixinRef ? base.prototype.constructor._mixinRef.slice(0) : [];
		eProtoConst._implementsRef =  base.prototype.constructor._implementsRef ? base.prototype.constructor._implementsRef.slice(0) : [];
		eProtoConst._a5_mixedMethods = {};
		eProtoConst._a5_instance = null;
		eProtoConst._instanceCount = 0;
		eProtoConst._extenderRef = [];
		eProto._a5_initialized = false;
			
		for(prop in a5.core.classProxyObj.construct)
			eProtoConst[prop] = a5.core.classProxyObj.construct[prop];
		if (base.namespace === undefined) {
			for (prop in a5.core.classProxyObj.instance) 
				eProto[prop] = a5.core.classProxyObj.instance[prop];
		}
		if(mixins)
			a5.core.mixins.applyMixins(eProto, mixins, imports);
		
		return a5.SetNamespace(namespace, extender);
	},
	
	processQueue = function(){
		var shouldReprocess = false, i, l;
		for(i = 0; i < packageQueue.length; i++){
			var pkgObj = packageQueue[i].pkg,
				validationResult = a5.core.verifiers.validateClassDependencies(pkgObj.base, pkgObj.imports, pkgObj.mixins, pkgObj.implement);		
			if (validationResult === true){
				processClass(pkgObj, true);
				packageQueue.splice(i, 1);
				i--;
				shouldReprocess = true;
			} else {
				packageQueue[i].reason = validationResult.reason;
				packageQueue[i].reasonNM = validationResult.reasonNM;
			}
		}	
		if(shouldReprocess) processQueue();
	},
	
	processProtoClass = function(queued){
		var obj = queued.obj,
			pkgObj = queued.pkgObj;
		processDeclaration(pkgObj.proto, obj, obj.prototype, obj.imports(), obj, true)
	},
	
	processClass = function(pkgObj, $fromQueue){
		var base = (typeof pkgObj.base === 'function') ? pkgObj.base : a5.GetNamespace(pkgObj.base, pkgObj.imports),
			obj = Extend(pkgObj.pkg + '.' + pkgObj.clsName, base, pkgObj.cls, pkgObj.type, pkgObj.isInterface, pkgObj.isProto, pkgObj.imports, pkgObj.mixins, pkgObj.attribs),
			fromQueue = $fromQueue || false,
			isValid = true, i, l;
		if(pkgObj.staticMethods)
			pkgObj.staticMethods(obj, pkgObj.imports);
		if (pkgObj.proto && delayProtoCreation) {
			queuedPrototypes.push({obj:obj, pkgObj:pkgObj});
			if(pkgObj.implement)
				queuedImplementValidations.push({pkgObj:pkgObj, obj:obj});
		} else {
			if(pkgObj.proto)
				processProtoClass({obj:obj, pkgObj:pkgObj});
			if(pkgObj.implement)
				isValid = a5.core.verifiers.validateImplementation(pkgObj, obj);
		}	
		if(!isValid)
			return;
		if(pkgObj.enumDeclaration){
			var index = 0,
				values = [];
			pkgObj.enumDeclaration({
				startIndex:function(value){
					index = value;
				},
				addValue:function(value){
					values.push(value);
				}
			})
			
			for (i = 0, l = values.length; i < l; i++)
				obj[values[i]] = index++;
				
			obj.addValue = function(value){
				if (obj[value] === undefined) 
					obj[value] = index++;
			}
			obj.getValue = function(id){
				for (prop in obj) 
					if (obj[prop] === id) 
						return prop;
				return null;
			}
		}
		if (pkgObj.isInterface) {
			obj.interfaceVals = {};
			if (pkgObj.base !== null && pkgObj.base !== undefined) {
				var cls = a5.GetNamespace(pkgObj.base, pkgObj.imports);
				if (cls.isInterface()) {
					for (prop in cls.interfaceVals) 
						if(obj.interfaceVals[prop] === undefined)
							obj.interfaceVals[prop] = cls.interfaceVals[prop];
				} else
					a5.ThrowError(204, null, {objNM:obj.namespace(), clsNM:cls.namespace()});
			}
			pkgObj.cls.call(obj.interfaceVals, obj.interfaceVals);
		}
		if(pkgObj.isMixin){
			obj._mixinDef = {
				Properties: function(propFunc){
					obj.prototype.constructor._a5_mixinProps = propFunc;
				},
				MustExtend:function(){
					obj.prototype.constructor._a5_mixinMustExtend = arguments;
				},
				MustMix:function(){
					obj.prototype.constructor._a5_mixinMustMix = arguments;
				}
			}
			pkgObj.cls.call(obj._mixinDef, obj._mixinDef, pkgObj.imports, obj);
			if(typeof obj._mixinDef[obj.className()] === 'function'){
				obj._a5_instanceConst = obj._mixinDef[obj.className()];
				delete obj._mixinDef[obj.className()];
			} else
				a5.ThrowError(205, null, {nm:obj.namespace()});
			delete obj._mixinDef.Properties;
			delete obj._mixinDef.Contract;
			delete obj._mixinDef.MustExtend;
			delete obj._mixinDef.MustMix;
		}
		updateWatches(pkgObj.pkg, pkgObj.clsName, obj);
		if (!fromQueue) processQueue();
	},
	
	processImports = function(array, pkg, $isRebuild){
		var retObj = {},i, l, str, pkg, clsName, isWC, dotIndex, pkgName, obj;
		if(array == undefined) array = [];
		array.push(pkg + '.*');
		for (i = 0, l = array.length; i < l; i++) {
			str = array[i], isWC = false, dotIndex = str.lastIndexOf('.');
			pkgName = str.substr(0, str.length - 2);
			if (str.charAt(str.length - 1) == '*') isWC = true;
			if (isWC) {
				pkgName = str.substr(0, str.length - 2);
				pkg = a5.GetNamespace(pkgName, null, true);
				if (pkg) {
					for (prop in pkg) {
						obj = pkg[prop];
						if ((typeof obj === 'function' || typeof obj === 'object') && retObj[prop] === undefined) retObj[prop] = obj;
					}
				}
				var pkgWatchName = pkgName.replace(/\./g, '_');
				if(!watchImports[pkgWatchName])
					watchImports[pkgWatchName] = [];
				watchImports[pkgWatchName].push(retObj);
			} else {
				clsName = dotIndex > -1 ? str.substr(dotIndex + 1) : str;
				pkgName = str.substr(0, dotIndex);
				var obj = a5.GetNamespace(str, null, true);
				if (obj) {
					if (retObj[clsName] === undefined)
						retObj[clsName] = obj;
				} else{
					var clsWatchName = pkgName.replace(/\./g, '_') + "_" + clsName;
					if(!watchImports[clsWatchName])
						watchImports[clsWatchName] = [];
					watchImports[clsWatchName].push(retObj);
				}	
			}
		}
		return retObj;
	}
	
	/**
	* @name Create
	* Instantiates a new instance of an object defined by {@link cl.Package}
	* @type Object
	* @param {Object} classRef
	* @param {Object} args
	*/
	a5.Create = Create;
	/**
	* @name Package
	* @param {Object} pkg
	*/
	a5.Package = Package;

	a5._a5_verifyPackageQueueEmpty = function(){
	    if(packageQueue.length){
	        var clsString = '', i, l;
	        for(i = 0, l = packageQueue.length; i < l; i++)
	            clsString += '"' + packageQueue[i].pkg.pkg + '.' + packageQueue[i].pkg.clsName + '", ' + packageQueue[i].reason  + ' class missing: "' + packageQueue[i].reasonNM + '"' + (packageQueue.length > 1 && i < packageQueue.length-1 ? ', \n':'');
	        a5.ThrowError(206, null, {classPlural:packageQueue.length == 1 ? 'class':'classes', clsString:clsString});
	    }
	}
	
	a5._a5_delayProtoCreation = function(value){
	    delayProtoCreation = value;
	}
	
	a5._a5_createQueuedPrototypes = function(){
	    for (var i = 0, l = queuedPrototypes.length; i < l; i++)
	        processProtoClass(queuedPrototypes[i]);
	    queuedPrototypes = [];
	    for(i = 0, l = queuedImplementValidations.length; i<l; i++)
	        a5.core.verifiers.validateImplementation(queuedImplementValidations[i].pkgObj, queuedImplementValidations[i].obj); 
	    queuedImplementValidations = [];
	}
	
	a5._a5_processImports = processImports;
})


/**
 * @name TopLevel
 * @namespace  
 */
a5.SetNamespace('a5.core.classProxyObj',{
	
	construct:{
		classPackage:function(getObj){ return getObj ? a5.GetNamespace(this._a5_pkg, null, true) : this._a5_pkg; },
		className:function(){ return this._a5_clsName; },
		namespace:function(){return this._a5_namespace; },
		imports:function(){ return this._a5_imports; },
		doesImplement:function(cls){ return a5.core.verifiers.checkImplements(this, cls); },
		doesExtend:function(cls){ return a5.core.verifiers.checkExtends(this, cls); },
		doesMix:function(cls){ return a5.core.verifiers.checkMixes(this, cls); },
		getAttributes:function(){ return this._a5_attributes; },
		instance:function(autoCreate, args){
			if (autoCreate === true)
				return this._a5_instance || a5.Create(this, args);
			else
				return this._a5_instance;
		},
		superclass:function(scope, args){
			if (scope !== undefined){
				if (typeof scope === 'object' && scope.isA5 === true) {
					if (typeof args !== 'object') 
						args = [];
					if (!this._a5_superclass.className)
						return a5.ThrowError(210);
					var sclConst = this._a5_superclass.prototype.constructor._a5_instanceConst;
					if (sclConst) 
						sclConst.apply(scope, args);
					else a5.ThrowError(211, null, {nm:this._a5_superclass.className()});
				} else {
					a5.ThrowError(212, null, {nm:this.namespace()});
				}	
			} else {
				return this._a5_superclass.prototype;
			}	
		},
		instanceCount:function(){ return this._instanceCount; },
		isInterface:function(){ return this._a5_isInterface; },
		isFinal:function(){ return this._a5_isFinal; },
		isSingleton:function(){	return this._a5_isSingleton; },
		isAbstract:function(){ return this._a5_isAbstract; },
		isPrototype:function(){ return this._a5_isPrototype; },
		isA5ClassDef:function(){ return true },
		isA5:true
	},
	instance:{
		
		isA5:true,
		isA5ClassDef:function(){ return false },
		
		getStatic:function(){ return this.constructor; },
		
		/**
		 * Returns a reference to the parent class of the object. Returns null if calling class is final parent.
		 * @name superclass
		 * @param {Object} scope
		 * @param {Object} args
		 */
		superclass:function(scope, args){ 
			return this.constructor.superclass(scope, args); 
		},
		
		async:function(func, args){
			return a5.Async.apply(this, arguments);
		},
		
		cycle:function(){
			return a5.Cycle.apply(this, arguments);
		},
		
		getAttributes:function(){
			return this.constructor.getAttributes();
		},
		
		getAttributeValue:function(value){
			return this.constructor.getAttributeValue(value);
		},
		
		getMethods:function(includeInherited, includePrivate){
			var retArray = [];
			for(var prop in this)
				if((includeInherited || ({}).hasOwnProperty.call(this, prop)) && 
					typeof(this[prop]) === 'function' && 
					a5.core.classProxyObj.instance[prop] === undefined && 
					prop.substr(0, 4) !== '_a5_' &&
					(includePrivate || prop.substr(0, 1) !== '_'))
						retArray.push(prop);
			return retArray;
		},
		getProperties:function(includeInherited, includePrivate){
			var retArray = [],
			checkInAncestor = function(obj, prop){
				var descenderRef = obj;
				while (descenderRef !== null) {
					var dConst = descenderRef.constructor;
					if (dConst._a5_protoProps !== undefined) {
						var ref = {};
						dConst._a5_protoProps.call(ref);
						if (ref[prop] !== undefined)
							return true;
					}
					descenderRef = dConst.superclass && 
									dConst.superclass().constructor.namespace ? 
									dConst.superclass() : null;
				}
				return false;
			}
			for(var prop in this)
				if((includeInherited || !checkInAncestor(this, prop)) && 
					typeof(this[prop]) !== 'function' && 
					a5.core.classProxyObj.instance[prop] === undefined && 
					prop.substr(0, 4) !== '_a5_' &&
					(includePrivate || prop.substr(0, 1) !== '_'))
						retArray.push(prop);
			return retArray;
		},
		
		/**
		 * @name classPackage
		 */
		classPackage:function(getObj){ return this.constructor.classPackage(getObj); },
		
		/**
		 * @name className
		 */
		className:function(){ return this.constructor.className(); },
		
		/**
		 * @name getClass
		 */			
		getClass:function(){ return this.constructor; },
		
		/**
		 * Returns the namespace of the class.
		 * @name namespace
		 * @type String
		 */
		namespace:function(){return this.constructor.namespace(); },
		
		/**
		 * @name doesImplement
		 * @param {Object} cls
		 */
		doesImplement:function(cls){ return this.constructor.doesImplement(cls) },
		
		/**
		 * @name doesExtend
		 * @param {Object} cls
		 */
		doesExtend:function(cls){ return this.constructor.doesExtend(cls) },
		
		/**
		 * @name doesMix
		 * @param {Object} cls
		 */
		doesMix:function(cls){ return this.constructor.doesMix(cls) },
		
		/**
		 * @name imports
		 */
		imports:function(){ return this.constructor.imports() },
		
		/**
		 * Called automatically upon {@link TopLevel#destroy} being called. This method should be implemented on the class level to properly deallocate.
		 * @name dealloc
		 */
		dealloc:function(){ },
		
		/**
		 * Returns the number of instances of the object.
		 * @name instanceCount
		 */
		instanceCount:function(){ return this.constructor.instanceCount(); },
		
		/**
		 * @name isInterface
		 */
		isInterface:function(){ return this.constructor.isInterface(); },
		
		/**
		 * @name isFinal
		 */
		isFinal:function(){ return this.constructor.isFinal();	},
		
		/**
		 * @name isSingleton
		 */
		isSingleton:function(){	return this.constructor.isSingleton(); },
		
		/**
		 * @name isAbstract
		 */
		isAbstract:function(){ return this.constructor.isAbstract(); },
		
		/**
		 * @name isPrototype
		 */
		isPrototype:function(){ return this.constructor.isAbstract(); },
		
		/**
		 * Returns a unique identifier for the class instance comprised of the namespace and the instanceCount for the class instance.
		 * @name instanceUID
		 */
		instanceUID:function(){
			return this._a5_instanceUID;
		},
		
		/**
		 * Destroys an instance of an object and removes it from its ancestor instance chains and fires the destroy chain through the instances prototype chain {@link TopLevel#dealloc} methods. This method should not be overriden.
		 * @name destroy
		 */
		destroy:function(){
			if (this._a5_initialized === true) {
				var descenderRef = this,
					instanceRef,
					nextRef,
					mixinRef,					
					prop,
					i, l;
				while (descenderRef !== null) {
					var dConst = descenderRef.constructor;
					mixinRef = dConst._mixinRef;
					if(mixinRef && mixinRef.length){
						for (i = 0, l = mixinRef.length; i < l; i++)
							if(mixinRef[i]._mixinDef.dealloc != undefined)
								mixinRef[i]._mixinDef.dealloc.call(this);
					}
					if (dConst.namespace) {
						nextRef = dConst.superclass ? dConst.superclass() : null;
						if (nextRef && nextRef.dealloc !== undefined && nextRef.dealloc !== descenderRef.dealloc) descenderRef.dealloc.call(this);
						descenderRef = nextRef;
					} else {
						descenderRef = null;
					}
				}	
				if(this.constructor._a5_instance === this)
					this.constructor._a5_instance = null;
				for (prop in this)
					if(typeof this[prop] === 'object') 
						this[prop] = null;
				this._a5_initialized = false;
			}
		}
	}
})


a5.SetNamespace('a5.core.verifiers', {
	namespaceArray:[],
	validateImplementation:function(pkgObj, obj){
		var i, l, prop, implNM, testInst, impl, hasProp,
			compareObjs = function(obj1, obj2){
				for(var prop in obj1)
					if(obj1[prop] !== obj2[prop])
						return false;
				return true;
			};
		for (i = 0, l = pkgObj.implement.length; i<l; i++) {
			implNM = pkgObj.implement[i];
			try {
				testInst = new obj('_a5_interfaceTest');
				testInst.Override = {};
				testInst.Final = {};
				testInst.Attributes = function(){
					var args = Array.prototype.slice.call(arguments);
					var func = args.pop();
					for(var i = 0, l = args.length; i<l; i++){
						var attr = args[i][0];
						if(attr === 'Contract' || attr === 'ContractAttribute' || attr === a5.ContractAttribute)
							func.attributes = args[i];
					}
					return func;
				}
				impl = a5.GetNamespace(implNM, obj.imports());
				if(obj._a5_clsDef)
					obj._a5_clsDef.call(testInst, testInst, obj.imports(), obj);
			} 
			catch (e) {
				throw e;
				return false;
			}
			if (!impl.isInterface())
				return a5.ThrowError(213, null, {implNM:impl.namespace(), objNM:obj.namespace()});
			for (prop in impl.interfaceVals) {
				hasProp = testInst[prop] !== undefined;
				var intProp = impl.interfaceVals[prop],
					testInstProp = testInst[prop];
				if(hasProp && 
					typeof intProp === 'object' && 
					testInstProp.attributes && 
					(testInstProp.attributes[0] === 'Contract' || 
						testInstProp.attributes[0] === 'ContractAttribute' || 
							testInstProp.attributes[0] === a5.ContractAttribute)){
					var isValid = true;
					for (var i = 0, l = intProp.length; i < l; i++)
						isValid = isValid && testInstProp.attributes.length >=(i+1) ? compareObjs(intProp[i], testInstProp.attributes[i+1]) : false;
					if(!isValid)
						return a5.ThrowError(601, null, {intNM:impl.namespace(), implNM:obj.namespace(), method:prop});
				}else if (!hasProp || (hasProp && typeof impl.interfaceVals[prop] !== typeof testInst[prop]))
					return a5.ThrowError(214, null, {implNM:impl.namespace(), objNM:obj.namespace()});
			}
			obj._implementsRef.push(impl);
			testInst.destroy();
		}
		return true;
	},
	
	checkNamespaceValid:function(namespace){
		for(var i = 0, l=this.namespaceArray.length; i<l; i++)
			if(this.namespaceArray[i] == namespace) 
				return false;
		this.namespaceArray.push(namespace);
		return true;
	},
	
	checkImplements:function(cls, implement){
		if(typeof implement === 'string')
			implement = a5.GetNamespace(implement);
		var imRef = cls._implementsRef, i, j, k, l;
		while (imRef) {
			for (i = 0, l = imRef.length; i < l; i++) 
				if (imRef[i] === implement) 
					return true;
			imRef = cls.superclass() ? cls.superclass().getStatic()._implementsRef : null;
		}
		return false;
	},
	
	checkExtends:function(cls, extend){
		var clsCheck = cls._a5_superclass && cls._a5_superclass.prototype.className ? cls._a5_superclass : null;
		if(!clsCheck) return false;
		var extendCheck = (typeof extend === 'string') ? a5.GetNamespace(extend) : extend;
		if(!extendCheck) return false;
		while(clsCheck){
			if(clsCheck === extendCheck) return true;
			clsCheck = clsCheck._a5_superclass && clsCheck._a5_superclass.prototype.className ? clsCheck._a5_superclass : null;
		}
		return false;
	},
	
	checkMixes:function(cls, mix){
		if(typeof mix === 'string')
			mix = a5.GetNamespace(mix);
		if(!mix)
			return false;
		for(var i = 0, l = cls._mixinRef.length; i<l; i++)
			if(cls._mixinRef[i] === mix)
				return true;
		return false;
	},
	
	validateClassDependencies:function(base, im, mixins, implement, isInterface, isMixin){
		var canCreate,
			reason,
			reasonNM,
			baseCls = null,
			prop, m, nm, i;
		if (base !== undefined) {
			if(typeof base === 'function') baseCls = base;
			else baseCls = a5.GetNamespace(base, im);
		}
		canCreate = true;
		if(base !== undefined && !baseCls){
			canCreate = false;
			reason = 'base';
			reasonNM = base;
		} 
		if(canCreate && mixins !== undefined){
			for(prop in mixins){
				m = mixins[prop];
				if(typeof m === 'string')
					nm = a5.GetNamespace(m, im);
				if (typeof nm !== 'function') {
					canCreate = false;
					reason = 'mixin';
					reasonNM = m;
				}
			}	
		}
		if(canCreate && implement !== undefined){
			for(prop in implement){
				i = implement[prop];
				if(typeof i === 'string')
					nm = a5.GetNamespace(i, im);
				if (typeof nm !== 'function') {
					canCreate = false;
					reason = 'interface';
					reasonNM = i;
				}
			}
		}	
		return canCreate ? true : {reason:reason, reasonNM:reasonNM};
	}
})


a5.SetNamespace('a5.core.mixins', {
	
	prepareMixins:function(inst){
		var scope = inst,
			mixinRef = inst.constructor._mixinRef,
			i, l, prop, cls;
		if(mixinRef.length){
			for (i = mixinRef.length - 1, l = -1; i > l; i--) {
				if(mixinRef[i]._a5_mixinMustExtend !== undefined){
					for (prop in mixinRef[i]._a5_mixinMustExtend) {
						cls = mixinRef[i]._a5_mixinMustExtend[prop];
						if (!inst.doesExtend(a5.GetNamespace(cls, inst.imports())))
							return a5.ThrowError(400, null, {mixinNM:mixinRef[i].namespace(), instNM:inst.namespace(), clsNM:cls.namespace()});
					}
				}			
			}						
		}	
	},
	
	initializeMixins:function(inst){
		var scope = inst,
			mixinRef = inst.constructor._mixinRef,
			i, l, prop, cls;
		if (mixinRef.length) {
			for (i = mixinRef.length - 1, l = -1; i > l; i--)
				if (mixinRef[i]._a5_mixinProps !== undefined) 
					mixinRef[i]._a5_mixinProps.call(scope);
			for(i = 0, l = mixinRef.length; i<l; i++)
				mixinRef[i]._a5_instanceConst.call(scope);
		}
	},
	
	mixinsReady:function(scope){
		var mixinRef = scope.constructor._mixinRef,
			i, l, prop, cls;
		if (mixinRef.length) {
			for (i = mixinRef.length - 1, l = -1; i > l; i--) {
				if(mixinRef[i]._a5_mixinMustMix !== undefined){
					for (prop in mixinRef[i]._a5_mixinMustMix) {
						cls = mixinRef[i]._a5_mixinMustMix[prop];
						if (!inst.doesMix(a5.GetNamespace(cls)))
							return a5.ThrowError(401, null, {nm:mixinRef[i].namespace(), cls:cls});
					}
				}
				if (typeof mixinRef[i]._mixinDef.mixinReady === 'function') 
					mixinRef[i]._mixinDef.mixinReady.call(scope);
			}
		}
	},
	
	applyMixins:function(sourceObj, mixins, imports, inst){
		var usedMethods = {},
			mixins = typeof mixins === 'string' ? [mixins] : mixins,
			mixinInsts = [],
			i, j, k, l, mixin;
			
		for (i = 0, l = mixins.length; i < l; i++) {
			mixin = a5.GetNamespace(mixins[i], typeof imports === 'function' ? imports() : imports);
			if(!mixin)
				return a5.ThrowError(404, null, {mixin:mixins[i]});
			mixinInsts.push(mixin);
			for (j = 0, k=sourceObj.constructor._mixinRef.length; j<k; j++)
				if (sourceObj.constructor._mixinRef[j] === mixin)
					return a5.ThrowError(402, null, {nm:mixin.namespace()});
			for (var method in mixin._mixinDef) {
				if (method !== 'dealloc' && method !== 'Properties' && method !== 'mixinReady' && method !== 'MustExtend' && method !== 'Contract') {
					if (usedMethods[method] === undefined) {
						if(inst === undefined)
							sourceObj.constructor._a5_mixedMethods[method] = mixin._mixinDef[method];
						sourceObj[method] = mixin._mixinDef[method];
						usedMethods[method] = 'mixed';
					} else
						return a5.ThrowError(403, null, {method:method});
				}
			}
			if(inst)
				a5.core.mixins.initializeMixins(inst, mixinInsts, inst);
			else
				sourceObj.constructor._mixinRef.push(mixin);
		}
	}
})


a5.SetNamespace('a5.core.errorHandling', true, function(){
	
	var thrownError = null;
	
	this.ThrowError = function(error, type, replacements){
		var t = typeof error,
			errorStr;
		if (t === 'string')
			errorStr = error;			
		else if (t === 'number'){
			if (a5.GetNamespace('a5.ErrorDefinitions', null, true)) {
				var errorStr = a5.ErrorDefinitions[error];
				if(!errorStr)
					errorStr = 'Invalid error id ' + error + ' thrown: error not defined.';
			} else
				errorStr = 'Error id ' + error + ' thrown. Include a5.ErrorDefinitions for verbose information.';
			error = a5.Create(type || a5.Error, [errorStr, a5.Error.FORCE_CAST_ERROR]);
		}
		if(errorStr)
			error = a5.Create(type || a5.Error, [(replacements ? runReplacements(errorStr, replacements) : errorStr), a5.Error.FORCE_CAST_ERROR]);
		thrownError = error;
		throw error;
	}
	
	this._a5_getThrownError = function(){
		var err = thrownError;
		thrownError = null;
		return err;
	}
	
	var runReplacements = function(str, replacements){
		for(var prop in replacements)
			str = str.replace(new RegExp('{' + prop + '}', 'g'), replacements[prop]);
		return str;
	}
})

/**
 * @name ThrowError
 */
a5.ThrowError = a5.core.errorHandling.ThrowError;
a5._a5_getThrownError = a5.core.errorHandling._a5_getThrownError;

a5.Package('a5')

	.Prototype('Object', function(cls, im){
		cls.Object = function(){
			
		}	
		
		cls.mixins = function(namespace){
			if (namespace !== undefined)
				return a5.GetNamespace(namespace, this.imports());
			else
				return this.constructor._a5_mixedMethods;
		}
})


/**
 * Decorates classes and methods with meta information, accessible through reflection.
 */
a5.Package('a5')

	.Prototype('Attribute', 'singleton', function(proto, im, Attribute){
		
		proto.Attribute = function(){
		}

})

/**
 * Decorates methods with cross cutting logic.
 */
a5.Package('a5')

	.Extends('Attribute')
	.Prototype('AspectAttribute', function(cls, im, AspectAttribute){
		
		/**
		 * Returned from aspect methods where an explicit null is the return value.
		 */
		AspectAttribute.RETURN_NULL = '_a5_aspectReturnsNull';
		
		/**
		 * Returned from aspect methods when the test passes with no modification to the passed params.
		 */
		AspectAttribute.SUCCESS = '_a5_aspectSuccess';
		
		/**
		 * Returned from aspect methods when a test method requires asynchronous processing. The callback param must be called to continue the aspect chain.
		 */
		AspectAttribute.ASYNC = '_a5_aspectAsync';
		
		/**
		 * Returned from aspect methods when a test method fails processing.
		 */
		AspectAttribute.FAILURE = '_a5_aspectFailure';
		
		/**
		 * Returned from aspect methods by default when a method is not overriden.
		 */
		AspectAttribute.NOT_IMPLEMENTED = '_a5_notImplemented';
		
		cls.AspectAttribute = function(){
			cls.superclass(this);
		}
		
		/**
		 * Override to specify logic that should occur before the attributed method block is executed.
		 * @param {a5.AspectCallArguments} Arguments for the context of the aspect;
		 */
		cls.before = function(rules, args, scope, method, callback, callOriginator){ return AspectAttribute.NOT_IMPLEMENTED; }
		
		/**
		 * Override to specify logic that should occur after the attributed method block is executed.
		 * @param {a5.AspectCallArguments} Arguments for the context of the aspect;
		 */
		cls.after = function(rules, args, scope, method, callback, callOriginator, beforeArgs){ return AspectAttribute.NOT_IMPLEMENTED; }
		
		/**
		 * Override to specify logic that should occur both before and after the attributed method block is executed.
		 * @param {a5.AspectCallArguments} Arguments for the context of the aspect;
		 */
		cls.around = function(){ return AspectAttribute.NOT_IMPLEMENTED; }
});

a5.Package('a5')

	.Class('AspectCallArguments', function(cls, im, AspectCallArguments){
		
		var _rules, _args, _scope, _method, _callback, _beforeArgs;
		
		cls.AspectCallArguments = function(rules, args, scope, method, callback, beforeArgs){
			_rules = rules;
			_args = args;
			_scope = scope;
			_method = method;
			_callback = callback;
			_beforeArgs = beforeArgs;
		}
		
		/**
		 * Returns the rule parameters defined when the attribute was applied.
		 * @returns {Array}
		 */
		cls.rules = function(){ return _rules; }
		
		/**
		 * Returns the arguments being passed to the method.
		 * @returns {Array}
		 */
		cls.args = function(){ return _args; }
		
		/**
		 * Returns the scope of the method.
		 * @returns {a5.Object}
		 */
		cls.scope = function(){ return _scope; }
		
		/**
		 * Returns the definition of the wraped method, accessible for reflection purposes.
		 * @returns {Function}
		 */
		cls.method = function(){ return _method; }
		
		/**
		 * Returns a method that must be invoked with a return status when returning {@link AspectAttribute.ASYNC}.
		 * @return {Function}
		 */
		cls.callback = function(){ return _callback; }
		
		/**
		 * On after methods and after phase of around methods, returns the args passed to the before chain of the aspect.
		 */
		cls.beforeArgs = function(){ return _beforeArgs; }
})

/**
 * Strictly defines parameters for a method, and optionally overloaded parameter options.
 */
a5.Package('a5')

	.Extends('AspectAttribute')
	.Class('ContractAttribute', function(cls, im, ContractAttribute){
		
		cls.ContractAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectParams){
			var retObj = null,
				foundTestRule = false,
				processError = function(error){
					error.message = 'Contract type failure on method "' + aspectParams.method().getName() + '" ' + error.message;
					return error;
				}
				
			//TODO: validate structure of passed rules. 
			//checkIsValid for datatypes, default vals should still fail out via error
			if(aspectParams.rules().length > 1){
				for (i = 0, l = aspectParams.rules().length; i < l; i++) {
					retObj = runRuleCheck(aspectParams.rules()[i], aspectParams.args());
					if (retObj instanceof a5.ContractException) {
						cls.throwError(processError(retObj));
						return a5.AspectAttribute.FAILURE;
					}
					if (retObj !== false) {
						foundTestRule = true;
						retObj.overloadID = i;
						break;
					}
				}
			} else {
				foundTestRule = true;
				retObj = runRuleCheck(aspectParams.rules()[0], aspectParams.args(), true);
				if (retObj instanceof a5.ContractException) {
					cls.throwError(processError(retObj));
					return a5.AspectAttribute.FAILURE;
				}
			}
			if (!foundTestRule || retObj === false) {
				cls.throwError(processError(new a5.ContractException('no matching overload found')));
				return a5.AspectAttribute.FAILURE;
			} else {
				return retObj;
			}
		}
		
		var runRuleCheck = function(rule, args){
			var retObj = {},
				count = 0,
				testResult,
				prop, type;
			for (prop in rule) {
				type = rule[prop];
				testResult = validate((count < args.length ? args[count] : undefined), type, count);
				if(testResult instanceof a5.ContractException)
					return testResult;
				retObj[prop] = testResult;
				count++;
			}
			if(args.length > count)
				return false;
			if(args.length === 0){
				if(count === 0) return retObj;
				return false;
			}
			return retObj;
		},	
		
		validate = function(arg, type, count){
			var kind = 'type',
				foundOptionals = false,
				defaultVal = null,
				split, clsDef;
			if(type.indexOf('=') != -1){
				split = type.split('=');
				type = split[0];
				foundOptionals = true;
				defaultVal = split[1];
			} else {
				if(foundOptionals)
					return new a5.ContractException('for argument ' + count + ', required values cannot be defined after optional values');
			}
			if(type.indexOf('.') !== -1) kind = 'class';
			if(type === 'array') kind = 'array';
			if(type === 'object') kind = 'object';
			if(kind !== 'class') type = type.toLowerCase();
			if (arg === undefined) {
				if (foundOptionals) arg = discernDefault(type, kind, defaultVal, count);
				else return new a5.ContractException('for argument ' + count + ', missing required argument of type "' + type + '"');
			}
	
			if (arg !== undefined && arg !== null) {
				switch (kind) {
					case 'class':
						clsDef = a5.GetNamespace(type);
						if(clsDef.isInterface()){
							if(!(arg.doesImplement(clsDef)))
								return new a5.ContractException('for argument ' + count + ', must implement interface ' + type);
						} else {
							if (!(arg instanceof clsDef))
								return new a5.ContractException('for argument ' + count + ', must be an instance of type ' + type);
						}
						break;
					case 'type':
						if(arg !== null && typeof arg !== type)
							return new a5.ContractException('for argument ' + count + ', must be of type ' + type);
						break;
					case 'array':
						if (Object.prototype.toString.call(arg) !== '[object Array]')
							return new a5.ContractException('for argument ' + count + ', must be an array');
						break;
					case 'object':
						if(arg._a5_initialized !== undefined || typeof arg !== 'object' || arg instanceof Array)
							return new a5.ContractException('for argument ' + count + ', must be a generic object');
						break;
				}
			}
			return arg;
		},
		
		discernDefault = function(type, kind, defaultVal, count){
			var retVal, invalid = false;
			if (type === 'string') {
				var zChar = defaultVal.charAt(0);
				if (zChar === defaultVal.charAt(defaultVal.length - 1)) {
					if(zChar === '"' || zChar === "'") retVal = defaultVal.substr(1, defaultVal.length - 2);
					else invalid = true;
				} else
					invalid = true;
			} else if (type === 'number'){
				if(!isNaN(defaultVal))
					retVal = parseInt(defaultVal);
				else
					invalid = true;
			} else if (kind === 'class'){
				if(defaultVal === 'null')
					retVal = null;
				else 
					invalid = true;
			} else if(	type === 'boolean' 	|| 
						type === 'array' 	|| 
						type === 'function' ||
						type === 'object'){
				switch (defaultVal){
					case '{}':
						if(type === 'object')
							retVal = {};
						else 
							invalid = true;
						break;
					case '[]':
						if(type === 'array')
							retVal = [];
						else 
							invalid = true;
						break;
					case 'null':
						retVal = null;
						break;
					case 'true':
						if(type === 'boolean')
							retVal = true;
						else 
							invalid = true;
						break;
					case 'false':
						if(type === 'boolean')
							retVal = false;
						else
							invalid = true;
						break;
					default:
						invalid = true;
				}
			} else
				invalid = true;
			if(invalid)
				return new a5.ContractException('for argument ' + count + ', invalid default value for data type "' + type + '"');
			 else 
			 	return retVal;
		}

})


/**
 * Applies cross cutting logic to a method to wrap getter and setter like functionality to a property in a Prototype class.
 */
a5.Package('a5')

	.Extends('AspectAttribute')
	.Class('PropertyMutatorAttribute', function(cls){
		
		cls.PropertyMutatorAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			if(aspectArgs.args().length){
				var typeVal = aspectArgs.rules()[0].validate,
					isCls = false;
				if(typeVal){
					if (typeVal.indexOf('.') !== -1) {
						isCls = true;
						var typeVal = a5.GetNamespace(typeVal);
						if(!typeVal)
							return a5.AspectAttribute.FAILURE;
					}
					var isValid = isCls ? (aspectArgs.args()[0] instanceof typeVal) : (typeof aspectArgs.args()[0] === typeVal);
					if(!isValid)
						return a5.AspectAttribute.FAILURE;
				}
				aspectArgs.scope()[aspectArgs.rules()[0].property] = aspectArgs.args()[0];
				return a5.AspectAttribute.SUCCESS;
			}
			var retVal = aspectArgs.scope()[aspectArgs.rules()[0].property] || null;
			return retVal === null || retVal === undefined ? a5.AspectAttribute.RETURN_NULL : retVal;
		}	
		
		cls.Override.after = function(aspectArgs){
			if (aspectArgs.beforeArgs().length) 
				return aspectArgs.scope();
			else 				
				return a5.AspectAttribute.SUCCESS;
		}
})


/**
 * Base Event object in A5.
 */
a5.Package('a5')

	.Static(function(Event){
		
		Event.DESTROYED = 'Destroyed';
		
	})
	.Prototype('Event', function(proto){
		
		this.Properties(function(){
			this._a5_type = null;
			this._a5_data = null;
			this._a5_target = null;
			this._a5_currentTarget = null;
			this._a5_phase = 1;
			this._a5_bubbles = false;
			this._a5_canceled = false;
			this._a5_cancelPending = false;
			this._a5_shouldRetain = false;
		})
		
		/**
		 * 
		 * @param {String} type The type identifier for the event.
		 * @param {Boolean} [bubbles=false] Whether or not the event should use the bubbling phase.
		 * @param {Object} [data] an optional data object to pass along with the event to registered listeners.
		 */
		proto.Event = function(type, bubbles, data){
			this._a5_type = type;
			this._a5_data = data || null;
			this._a5_bubbles = bubbles !== false;
		}
		
		
		/**
		 * Cancels the propagation of the event. Once this method is called, any event listeners that have not yet processed this event instance will be ignored.
		 * @param {Boolean} finishCurrentPhase If true, the event is allowed to finish dispatching in the current phase, but will be cancelled before the next phase begins.
		 */
		proto.cancel = function(finishCurrentPhase){
			if(finishCurrentPhase === true)
				this._a5_cancelPending = true;
			else
				this._a5_canceled = true;
		}
		
		/**
		 * The object that dispatched this event.
		 * @return {a5.Object} The object that dispatched this event.
		 */
		proto.target = function(){ return this._a5_target; };
		
		/**
		 * The object that is currently processing this event.
		 * @return {a5.Object} The object that is currently processing this event.
		 */
		proto.currentTarget = function(){ return this._a5_currentTarget; };
		
		/**
		 * The event type.
		 * @return {String} The event type.
		 */
		proto.type = function(){ return this._a5_type; };
		
		/**
		 * The data object passed along with the event dispatch, if present.
		 * @return {Object}
		 */
		proto.data = function(){ return this._a5_data; };
		
		/**
		 * The phase this event is currently in. (a5.Event.CAPTURING, a5.Event.AT_TARGET, or a5.Event.BUBBLING)
		 * @return {Number} The phase this event is currently in.
		 */
		proto.phase = function(){ return this._a5_phase; };
		
		
		/**
		 * Whether this event should use the bubbling phase.  All events use capture and target phases.
		 */
		proto.bubbles = function(){ return this._a5_bubbles; };
		
		/**
		 * When shouldRetain is set to true, the event instance will not be destroyed after it has finished being dispatched.
		 * This defaults to false, and it is recommended that you do NOT set this to true unless the same event is being
		 * dispatched on a timer, and the instance can be reused.
		 * 
		 * @param {Boolean} [value] If set to true, the event instance will not be destroyed after it has finished being dispatched.
		 */
		proto.shouldRetain = function(value){
			if(typeof value === 'boolean'){
				this._a5_shouldRetain = value;
				return this;
			}
			return this._a5_shouldRetain;
		}
		
		proto.dealloc = function(){
			this._a5_target = this._a5_currentTarget = null;
		}
});

/**
 * Defines event phases for an {@link a5.Event}.
 */
a5.Package('a5')

	.Static('EventPhase', function(EventPhase){
		
		EventPhase.CAPTURING = 1;
		
		EventPhase.AT_TARGET = 2;
		
		EventPhase.BUBBLING = 3;
});


/**
 * Defines a custom A5 Error.
 */
a5.Package('a5')

	.Extends(Error)
	.Prototype('Error', function(proto, im, Error){
		
		Error.FORCE_CAST_ERROR = '_a5_forceCastError';
		
		this.Properties(function(){
			this.stack = [];
			this.message = "";
			this.name = this.type = this.className();
		})
		
		proto.Error = function(message, error) {
			if(typeof message === 'string')
				this.message = message;
			else
				error = message;
			if(error instanceof Error){
				if(error.stack)
					this.stack = error.stack.split('\n');
				this.line = error.lineNumber;
				this.url = error.fileName;
				if(error.message && this.message === "")
					this.message = error.message;
			}
		}
		
		proto.Override.toString = function () {
		  return this.type + ': ' + this.message;
		}
})


/**
 * Exceptions thrown from assert statements.
 */
a5.Package('a5')
	.Extends('Error')
	.Prototype('AssertException', function(proto){
		
		proto.AssertException = function(){
			proto.superclass(this, arguments);
			this.type = 'AssertException';
		}
		
});

/**
 * Exceptions thrown from contract attributes.
 */
a5.Package('a5')
	.Extends('Error')
	.Prototype('ContractException', function(proto){
		
		proto.ContractException = function(){
			proto.superclass(this, arguments);
			this.type = 'ContractException';
		}
		
});


/**
 * Handles event listeners and dispatches events.
 */
a5.Package("a5")

	.Static(function(EventDispatcher){
		
		EventDispatcher.ADD = 'eventDispatcherAdd';
		
		EventDispatcher.REMOVE = 'eventDispatcherRemove';
		
	})
	.Prototype('EventDispatcher', 'abstract', function(proto, im, EventDispatcher){
		
		this.Properties(function(){
			this._a5_autoPurge = false;
			this._a5_listeners = {};
		})
		
		proto.EventDispatcher = function(){
			
		}
		
		/**
		 * Returns whether autoPurge is enabled for the dispatcher. If enabled, event listeners will be removed automatically after a valid event is dispatched.
		 * @param {Boolean} [value] If passed, sets the value for autoPurge.
		 */
		proto.autoPurge = function(value){
			if(typeof value === 'boolean'){
				this._a5_autoPurge = value;
				return this;
			}
			return this._a5_autoPurge;
		}
		
		/**
		 * Adds an event listener to the object.
		 * @param {String} type The event type to be added.
		 * @param {Function} method The associated listener method to be added.
		 * @param {Boolean} [useCapture=false] If set to true, the listener will process the event in the capture phase.  Otherwise, it will process the event bubbling or target phase.
		 * @param {a5.Object} [scope=null] Applies a scope value for the listener method. This is important when listening from a prototype.
		 */
		proto.addEventListener = function(type, method, useCapture, scope){
			this._a5_addEventListener(type, method, useCapture, scope);
		}
		
		/**
		 * Adds an event listener to the object that fires only once, then is removed.
		 * @param {String} type The event type to be added.
		 * @param {Function} method The associated listener method to be added.
		 * @param {Boolean} [useCapture=false] If set to true, the listener will process the event in the capture phase.  Otherwise, it will process the event bubbling or target phase.
		 * @param {a5.Object} [scope=null] Applies a scope value for the listener method. This is important when listening from a prototype.
		 */
		proto.addOneTimeEventListener = function(type, method, useCapture, scope){
			this._a5_addEventListener(type, method, useCapture, scope, true);
		}
		
		/**
		 * Returns whether the object has a valid listener for the associated type, and optionaly a specified listener method.
		 * @param {String} type The event type to check.
		 * @param {Function} [method] A listener method reference.
		 * @return {Boolean}
		 */
		proto.hasEventListener = function(type, method){
			var types = type.split('|'),
				scope = this.cl(),
				i, l, listArray, j, m;
			for (i = 0, l = types.length; i < l; i++) {
				listArray = this._a5_getListenerArray(types[i]);
				if (listArray) {
					for (j = 0, m = listArray.length; j < m; j++) 
						if (listArray[j].type == types[i] && (typeof method === 'function' ? (listArray[j].method == method) : true))
							return true;
				}
			}
			return false;
		}
		
		/**
		 * Remove a listener from the parent object.
		 * @param {String} type The event type to be removed.
		 * @param {Function} method The associated listener method to be removed.
		 * @param {Boolean} [useCapture=false] Whether the listener to remove is bound to the capture phase or the bubbling phase.
		 * @param {a5.Object} [scope]
		 * @param {Boolean} [isOneTime=false]
		 */
		proto.removeEventListener = function(type, method,  useCapture, scope, isOneTime){
			var types = type.split('|'),
				shouldPush = true,
				i, l, listArray, j, m;
			scope = scope || null;
			isOneTime = isOneTime || false;
			useCapture = useCapture === true;
			for (i = 0, l = types.length; i < l; i++) {
				listArray = this._a5_getListenerArray(types[i]);
				if (listArray) {
					for (j = 0, m = listArray.length; j < m; j++) {					
						if (listArray[j].method === method && 
							listArray[j].type === types[i] && 
							listArray[j].useCapture === useCapture && 
							listArray[j].isOneTime === isOneTime) {
								listArray.splice(j, 1);
								m = listArray.length;
						}
					}
					this.eListenersChange({
						type: types.length > 1 ? types:types[0],
						method: method,
						useCapture: useCapture,
						changeType: EventDispatcher.REMOVE
					});
				}
			}
		}
		
		/**
		 * Removes all existing listeners.
		 */
		proto.removeAllListeners = function(){
			if(this._a5_listeners)
				this._a5_listeners = {};
		}
		
		/**
		 * Returns the total number of listeners attached to the parent object.
		 */
		proto.getTotalListeners = function(type){
			if (typeof type === 'string') {
				var arr = this._a5_getListenerArray(type);
				if(arr)
					return arr.length;
				else
					return 0;
			} else {
				var count = 0;
				for(var prop in this._a5_listeners)
					count += this._a5_listeners[prop].length;
				return count;
			}
		} 
		
		/**
		 * Sends an event object to listeners previously added to the event chain. By default an event object with a target property is sent pointing to the sender. If a custom object is sent with a target property, this property will not be overridden.
		 * @param {String|a5.Event} event The event object to dispatch.  Or, if a string is passed, the 'type' parameter of the event to dispatch. 
		 */
		proto.dispatchEvent = function(event, data, bubbles, sync){
			var e = this._a5_createEvent(event, data, bubbles);
			//target phase only
			e._a5_phase = a5.EventPhase.AT_TARGET;
			if (sync === false)
				this.async(this._a5_dispatchEvent, [e]);
			else
				this._a5_dispatchEvent(e);
			if(!e.shouldRetain()) e.destroy();
			e = null;
		}
		
		/**
		 * Override this method to be notified of listener addition or removal.
		 * @param {Object} e The event object
		 * @param {String} e.type - The event type associated with the change.
		 * @param {Object} e.method - The listener method associated with the change.
		 * @param {String} e.changeType - Specifies what the type the change was, either EventDispatcher.ADD or EventDispatcher.REMOVE. 
		 */
		proto.eListenersChange = function(e){}
		
		//private methods
		
		proto._a5_addEventListener = function(type, method, $useCapture, $scope, $isOneTime){
			var scope = $scope || null,
				types = type.split('|'),
				isOneTime = $isOneTime || false,
				useCapture = $useCapture === true,
				shouldPush = true,
				i, l, listArray, j, m;
			if (types.length != 0 && method != undefined) {
				for (i = 0, l = types.length; i < l; i++) {
					listArray = this._a5_getListenerArray(types[i], true);
					for (j = 0, m = listArray.length; j < m; j++) {
						if (listArray[j].method === method && 
							listArray[j].type === types[i] && 
							listArray[j].useCapture === useCapture && 
							listArray[j].scope === scope && 
							listArray[j].isOneTime === isOneTime) {
								shouldPush = false;
								break;
						}
					}
					if (shouldPush) {
						listArray.push({
							type: types[i],
							method: method,
							scope: scope,
							useCapture: useCapture === true,
							isOneTime:isOneTime
						});
					}
				}
				this.eListenersChange({
					type: types.length > 1 ? types : types[0],
					method: method,
					changeType: EventDispatcher.ADD
				});
			} else
				throw 'invalid listener: type- ' + type + ', method- ' + method;
		}
		
		proto._a5_createEvent = function(event, data, bubbles){
			//if event was passed as a string, create a new Event object
			var e = (typeof event === 'string') ? new a5.Event(event, bubbles) : event;
			if(e instanceof a5.Event || e.doesExtend && e.doesExtend(a5.Error)){
				e._a5_target = this;
				if(data)
					e._a5_data = data;
				return e;
			}
			throw 'Invalid event type.';
		}
		
		proto._a5_dispatchEvent = function(e){
			e._a5_currentTarget = this;
			if (this._a5_listeners) {
				var typeArray = this._a5_getListenerArray(e.type()),
					i, l, thisListener, validPhase, validListener;
				if (typeArray) {
					for (i = 0, l = typeArray.length; i < l; i++) {
						thisListener = typeArray ? typeArray[i] : null;
						if (e._a5_canceled || !thisListener) return; //if the event has been canceled (or this object has been destroyed), stop executing
						validPhase = (e.phase() === a5.EventPhase.CAPTURING && thisListener.useCapture) || (e.phase() !== a5.EventPhase.CAPTURING && !thisListener.useCapture), validListener = typeof thisListener.method === 'function' && (thisListener.scope && thisListener.scope.namespace ? thisListener.scope._a5_initialized : true);
						if (validPhase && validListener && (thisListener.scope == null || thisListener.scope._a5_initialized)) thisListener.method.call(thisListener.scope, e);
						if (thisListener.isOneTime === true || (!validListener && this._a5_autoPurge)) {
							typeArray.splice(i, 1);
							i--;
							l--;
						}							
					}
				}
			}
		}
		
		proto._a5_getListenerArray = function(type, create){
			if (this._a5_listeners[type] === undefined) {
				if (create === true) {
					this._a5_listeners[type] = [];
					return this._a5_listeners[type];
				}
				return null;
			}
			return this._a5_listeners[type];
		}
		
		proto.dealloc = function(){
			this.dispatchEvent(new a5.Event(a5.Event.DESTROYED));
			this.removeAllListeners();
			this._a5_listeners = null;
		}
		
});


a5.SetNamespace('a5.ErrorDefinitions', {
	//100: root level
	100:'invalid namespace "{namespace}", namespaces must contain only letters, numbers, or periods.',
	101:'TrackWindowStrays must be called prior to GetWindowStrays.',
	//200: class processing
	200:'Invalid attempt to define new method "{prop}" in class "{namespace}", without calling override, method exists in superclass.',
	201:'Invalid attempt to override method "{prop}" in class "{namespace}", method marked as Final in superclass.',
	202:'Invalid attempt to override method "{prop}" in class "{namespace}", method not defined in superclass.',
	203:'Invalid attempt to override method "{prop}" in class "{namespace}", method marked as Final in superclass.',
	204:'Interface "{objNM}" cannot extend the non interface class "{clsNM}"',
	205:'Mixin "{nm}" doesn not specify a constructor.',
	206:'Class definitions not found for the following expected {classPlural}: \n {clsString}',
	207:'Error creating new class instance: cannot find object {className}.',
	208:'Cannot instantiate class {nm} , interfaces must be associated by the Implements directive.',
	209:'Error creating class instance {nm} ({errorStr})',
	210:'Superclass called on an object without a superclass.',
	211:'Constructor not defined on class "{nm}"',
	212:'invalid scope argument passed to superclass constructor on class "{nm}".',
	213:'Cannot implement "{implNM}" on class "{objNM}", class is not an interface.',
	214:'Invalid implementation of interface "{implNM}" , on class "{objNM}".',
	215:'Destroy called on core object "{nm}"',
	216:'Cannot directly instantiate class "{nm}", class marked as abstract.',
	217:'Cannot create new instance of class "{nm}", class marked as singleton already exists.',
	218:'Constructor not defined on class "{clsName}"',
	219:'Class "{currClass}" requires "{checkedClass}"',
	220:'Invalid attempt to define new method "{prop}" in class "{namespace}", without calling override, method exists in mixin.',
	
	//300: attributes
	300:'Invalid attribute definition: "Attributes" call must take a function as its last parameter.',
	301:'Invalid attribute definition: No attributes were defined.',
	302:'Attribute error: Attributes call accepts only arrays as attribute annotations.',
	303:'Attribute error: First parameter must be a reference to a class that extends a5.Attribute.',
	304:'Attribute error: invalid parameter specified for Attribute, params must be key/value pair objects.',
	305:'Attribute error: no parameters passed to Attribute call.',
	308:'Error processing attribute "{prop}", "{method}" must return a value.',
	
	//400: mixins
	400:'Mixin "{mixinNM}" requires mixing object "{instNM}" to extend class "{clsNM}" .',
	401:'Mixin "{nm}" requires owner class to mix "{cls}".',
	402:'Mixin "{nm}" already mixed into ancestor chain.',
	403:'Invalid mixin: Method "{method}" defined by more than one specified mixin.',
	404:'Invalid mixin: Mixin "{mixin}" does not exist.',
	
	//600: Contract
	601:'Invalid implementation of Contract on interace {intNM} in class {implNM} for method {method}.'
})



})(typeof global !== 'undefined' ? global : this);
(function(global) {

	"use strict";
a5.SetNamespace('a5.cl', true, function(){

    var initializer = null,
		inst,
        createCalled = false,
        createCallbacks = [];

    var Instance = function () {
        return inst;
    },

    /**
     * @function
     * Initializes an instance of the A5 CL framework.
     * @param {Object} props
     * @type Function
     * @returns A function that returns the singleton instance of the application framework.
     */
     CreateApplication = function(props, callback){
         if (!createCalled) {
             createCalled = true;

             if (a5.cl.CLMain._extenderRef.length === 0) {
                 var str = 'A5 CL requires a class that extends a5.cl.CLMain.';
                 throw str;
             } else {
                 if (typeof props === 'function') {
                     callback = props;
                     props = undefined;
                 }
                 if (props === undefined)
                     props = {};
                 if (callback && typeof callback === 'function')
                     CreateCallback(callback);
                 var initializeComplete = function () {
                    inst = new a5.cl.CL(props || {}, initializer);
                    for (var i = 0, l = createCallbacks.length; i < l; i++)
                        createCallbacks[i](inst);
                    createCallbacks = null;
					if(initializer !== null)
						initializer.applicationInitialized(inst);
					inst._cl_launch();
                 }

                 if (initializer !== null)
                     initializer.initialize(props, initializeComplete);
                 else
                     initializeComplete();

                 return function () {
                     return a5.cl.CL.instance();
                 }
             }
        } else {
            throw "Error: a5.cl.CreateApplication can only be called once.";
        }
     },

     RegisterInitializer = function(_initializer){
         if (initializer == null)
             initializer = _initializer;
         else
             throw "initializer error";
     },

     CreateCallback = function(callback){
         createCallbacks.push(callback);
     }

     return {
         Instance:Instance,
         CreateApplication:CreateApplication,
         RegisterInitializer: RegisterInitializer,
         CreateCallback:CreateCallback
     }
});



/**
 * Base class for all classes in an A5 CL application. 
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns a reference to the CL application instance.
		 * @return {a5.cl.CL}
		 */
		proto.cl = function(){
			return a5.cl.CL.instance();
		}
		
		/**
		 * Returns an instance of the class defined by the specified parameters
		 * @param {String} type A string value representing the type of class to instantiate. 'Service' is available by default, add-ons may register additional type names for instantiation. 
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooService', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * Sends a log value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		/**
		 * Sends a warn value to any registered logging plugins, or the console if available.
		 * @param {Object} value
		 */
		proto.warn = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.warn.apply(this, arguments);
			else
				if ('console' in window) 
					console.warn.apply(console, arguments);
		}
		
		/**
		 * Returns a reference to the plugins object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns a reference to the appParams object for the A5 CL application instance.
		 * @return {Object}
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
		
});

a5.Package('a5.cl')

    .Extends('a5.cl.CLBase')
    .Prototype('CLInitializer', function (cls, im) {
		
        cls.CLInitializer = function () {
            cls.superclass(this);
            a5.cl.RegisterInitializer(this);
        }

        cls.initialize = function (props, callback) {
            throw "Classes extending CLInitializer must override initialize method without calling super.";
        }
		
		cls.load = function(arr, complete, progress){
			return false;
		}
		
		cls.applicationInitialized = function(inst){
		}
});


/**
 * Defines an error in A5 CL.
 */
a5.Package('a5.cl')

	.Extends('a5.Error')
	.Prototype('CLError', function(proto, im){
		
		proto.CLError = function(){
			proto.superclass(this, arguments);
			this.type = 'CLError';
		}
})



a5.Package('a5.cl')

	.Enum('CLLaunchState', function(cls){
		
		cls.addValue('APPLICATION_INITIALIZING');
		cls.addValue('DEPENDENCIES_LOADING');
		cls.addValue('DEPENDENCIES_LOADED');
		cls.addValue('AUTO_INSTANTIATION_COMPLETE');
		cls.addValue('PLUGINS_LOADED');
		cls.addValue('LAUNCH_INTERCEPTED');
		cls.addValue('APPLICATION_WILL_LAUNCH');
		cls.addValue('APPLICATION_LAUNCHED');
})


a5.Package('a5.cl')
	
	.Extends('a5.Event')
	.Static(function(CLEvent){
		
		/**
		 * @event
		 * @param {Boolean} online Specifies whether the browser is currently online.
		 * @description Dispatched when a change in the online status of the application occurs (HTML5 only).
		 */
		CLEvent.ONLINE_STATUS_CHANGE = 'onlineStatusChange';
		
		CLEvent.ERROR_THROWN = 'errorThrown';
		
		/**
		 * @event
		 * @description Dispatched when the dom has completely loaded, the framework has been successfully loaded to the dom, and the framework is starting instatiation. 
		 * */
		CLEvent.APPLICATION_INITIALIZING = "applicationInitializing";
		
		
		CLEvent.CORE_LOADED = "coreLoaded";
		/**
		 * @event
		 * @param {Number} count
		 * @param {Number} total
		 * @description Dispatched while dependencies are loading to the DOM.
		 */
		CLEvent.DEPENDENCIES_LOADING = "dependenciesLoading";
		
		/**
		 * @event
		 * @description Dispatched when all dependencies specified in the configuration file have been successfully loaded to the DOM.
		 */
		CLEvent.DEPENDENCIES_LOADED = 'dependenciesLoaded';
		
		/**
		 * @event
		 * @description Dispatched when auto detected classes have been successfully instantiated.
		 */
		CLEvent.AUTO_INSTANTIATION_COMPLETE = 'autoInstantiationComplete';
		
		/**
		 * @event
		 * @description Dispatched when all plugins have successfully loaded, if any.
		 */
		CLEvent.PLUGINS_LOADED = 'pluginsLoaded';
		
		/**
		 * 
		 */
		CLEvent.APPLICATION_PREPARED = 'applicationPrepared';
		
		/**
		 * @event
		 * @param {a5.cl.interfaces.ILaunchInterceptor} e.interceptor The plugin that has intercepted the launch.
		 * @description Dispatched when the application launch has been intercepted by a plugin that has registered to stall the application launch.
		 */
		CLEvent.LAUNCH_INTERCEPTED = 'launchIntercepted';
		
		/**
		 * @event
		 * @description Dispatched when the application is ready to initialize.
		 */
		CLEvent.APPLICATION_WILL_LAUNCH = 'applicationWillLaunch';
		
		/**
		 * @event
		 * @description Dispatched when the application has successfully initialized.
		 */
		CLEvent.APPLICATION_LAUNCHED = 'applicationLaunched';
		
		/**
		 * @event
		 * @description Dispatched when the window is about to be closed.
		 */
		CLEvent.APPLICATION_WILL_CLOSE = 'applicationWillClose';
		
		/**
		 * @event
		 * @description Dispatched when the window is closing.
		 */
		CLEvent.APPLICATION_CLOSED = 'applicationClosed';
		
		/**
		 * @event
		 * @param {Number} width
		 * @param {Number} height
		 * @description Dispatched when the window is resized.
		 */
		CLEvent.WINDOW_RESIZED = 'windowResized';
		
		/**
		 * @event
		 * @description Dispatched when the application is about to relaunch.
		 */
		CLEvent.APPLICATION_WILL_RELAUNCH = 'applicationWillRelaunch';
		
		
		/**
		 * @event
		 * @description Dispatched repeatedly at the specified update rate from {@link a5.cl.CLConfig#globalUpdateTimerInterval}.
		 */
		 CLEvent.GLOBAL_UPDATE_TIMER_TICK = 'globalUpdateTimerTick';
		
		/**
		 * @event
		 * @description Dispatched when async service requests start
		 */
		CLEvent.ASYNC_START = 'asyncStart';
		
		/**
		 * @event
		 * @description Dispatched when async service requests complete
		 */
		CLEvent.ASYNC_COMPLETE = 'asyncComplete';
		
		 /**
		 * @event
		 * @description Dispatched when the client orientation has changed. This is only dispatched for mobile or tablet client environments.
		 */
		CLEvent.ORIENTATION_CHANGED = 'orientationChanged';
		
		/**
		 * @event
		 * @description Dispatched when the client environment has switched. This is only relevant when the configuration flag 'clientEnvironmentOverrides' is set to true.
		 */
		CLEvent.CLIENT_ENVIRONMENT_UPDATED = 'clientEnvironmentUpdated';
		 /**
		 * @event
		 * @param {Number} errorType
		 * @description Dispatched when an application error occurs.
		 * 
		 */
		CLEvent.APPLICATION_ERROR = 'applicationError';
		
	})
	.Prototype('CLEvent', function(proto, im){
		
		proto.CLEvent = function(){
			proto.superclass(this, arguments);
		}	
});


a5.Package('a5.cl.interfaces')

	.Interface('IHTMLTemplate', function(cls){
		
		cls.populateTemplate = function(){}
})




a5.Package('a5.cl.interfaces')

	.Interface('ILogger', function(cls){
		
		cls.log = function(){}
})




a5.Package('a5.cl.interfaces')

	.Interface('IServiceURLRewriter', function(cls){
		
		cls.rewrite = function(){}
})



a5.Package('a5.cl.interfaces')

	.Interface('ILaunchInterceptor', function(cls){
		
		cls.interceptLaunch = function(){}
});


a5.Package('a5.cl.interfaces')
	.Interface('IDataCacheProvider', function(IDataCacheProvider){
		
		IDataCacheProvider.isAvailable = function(){};
		IDataCacheProvider.cacheExists = function(){};
		IDataCacheProvider.storeValue = function(){};
		IDataCacheProvider.getValue = function(){};
		IDataCacheProvider.clearValue = function(){};
		IDataCacheProvider.clearScopeValues = function(){};
		
});



a5.Package('a5.cl.interfaces')
	
	.Interface('IBindableReceiver', function(cls){
		
		cls.receiveBindData = function(){}
		
		cls.bindCallInitialize = function(){}
});


a5.Package('a5.cl.core')

	.Extends('a5.cl.CLBase')
	.Class('PluginManager', 'singleton final', function(self){
	
		var plugins = [],
			addOns = [],
			processes = {
				animation:null,
				htmlTemplate:null,
				serviceURLRewriter:null,
				logger:null,
				dataCacheProvider:null,
				launchInterceptor:null,
				presentationLayer:null
			}
		
		this.PluginManager = function(){
			self.superclass(this);
			self.plugins()['getRegisteredProcess'] = this.getRegisteredProcess;
		}
		
		this.instantiatePlugins = function(){
			var classes = [], i, l, plugin, pi, cfg, obj;
			for(i = 0, l=a5.cl.CLPlugin._extenderRef.length; i<l; i++)
				if(a5.cl.CLPlugin._extenderRef[i] !== a5.cl.CLAddon)
					classes.push(a5.cl.CLPlugin._extenderRef[i]);
			for (i = 0, l = a5.cl.CLAddon._extenderRef.length; i < l; i++) {
				addOns.push(a5.cl.CLAddon._extenderRef[i]);
				classes.push(a5.cl.CLAddon._extenderRef[i]);
			}
			for(i = 0, l=classes.length; i<l; i++){
				plugin = classes[i];
				if (!plugin.isAbstract()) {
					pi = plugin.instance(true);
					cfg = pi._cl_sourceConfig(); 
					obj = a5.cl.core.Utils.mergeObject(cfg || {}, pi.configDefaults());
					pi._cl_isFinal = pi._cl_isSingleton = true;
					if (!a5.cl.core.Utils.testVersion(pi.requiredVersion())) {
						throw 'Error - plugin "' + plugin.className() + '" requires at least CL version ' + pi.requiredVersion();
						return;
					}
					if (pi.maxVerifiedVersion() && !self.config().allowUntestedPlugins && !a5.cl.core.Utils.testVersion(pi.maxVerifiedVersion(), true)) {
						throw 'Error - untested version';
						return;
					}
					pi._cl_pluginConfig = obj;
					
					if (pi instanceof a5.cl.CLAddon) {
						if (a5.cl.CLBase.prototype[plugin.className()] === undefined) {
							a5.cl.CLBase.prototype[plugin.className()] = function(){
								var p = pi;
								return function(){
									return p;
								}
							}()
							
						}
					} else {
						if (self.plugins()[plugin.className()] == undefined) {
							self.plugins()[plugin.className()] = function(){
								var p = pi;
								return function(){
									return p;
								}
							}()
						}
					}
					plugins.push(pi);
				}
			}
			for(var i = 0, l=plugins.length; i<l; i++){
				var checkResult = checkRequires(plugins[i]);
				if(checkResult){
					throw 'Error: plugin "' + plugins[i].className() + '" requires plugin "' + checkResult;
					return;
				}
				plugins[i].initializePlugin();
					
			}
			a5.cl.PluginConfig = function(){
				throw new a5.cl.CLError('Invalid call to MVC pluginConfig method: method must be called prior to plugin load.');
			}
		}
		
		this.defineRegisterableProcess = function(process){
			processes[process] = null;
		}
		
		this.registerForProcess = function(type, instance){
			var val = processes[type];
			if(val === null)
				processes[type] = instance;
			else if (val === undefined)
				self.redirect(500, "Error registering process for type '" + type + "', type does not exist.");
			else
				self.warn("Multiple plugins trying to register for process '" + type + "'.");
		}
		
		this.getRegisteredProcess = function(type){
			return processes[type];
		}
		
		this.processAddons = function(callback){
			var count = 0,
			processAddon = function(){
				if (count >= addOns.length) {
					callback();
					return;
				} else {
					var addOn = addOns[count].instance(),
						isAsync = addOn.initializeAddOn() === true;
					count++;
					if (isAsync) addOn.addOneTimeEventListener(a5.cl.CLAddon.INITIALIZE_COMPLETE, processAddon);
					else processAddon();
				}
			} 
			processAddon();
		}
		
		var checkRequires = function(plugin){
			var r = plugin._cl_requires;
			for(var i = 0, l = r.length; i<l; i++){
				if(!a5.GetNamespace(r[i], null, true))
					return r[i];	
			}
			return false;
		}
});


a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLBase') 
	.Class('Instantiator', 'singleton final', function(self, im){
	
		var applicationPackage,
		_applicationPackageInstance,
		namespaceArray = [['services', [a5.cl.CLService, a5.cl.CLSocket, a5.cl.CLAjax]]];
		
		this.Instantiator = function($applicationPackage){
			self.superclass(this);
			applicationPackage = $applicationPackage;
			_applicationPackageInstance = a5.SetNamespace(applicationPackage);
		}
		
		this.applicationPackage = function(returnString){
			if(returnString) return applicationPackage;
			else return _applicationPackageInstance;
		}
		
		this.registerAutoInstantiate = function(name, clsArray){
			namespaceArray.push([name, clsArray]);
		}
		
		this.Override.getClassInstance = function(type, className, instantiate){
			var instance = null,
			namespace = null;
			if(className.indexOf('.') !== -1)
				namespace = a5.GetNamespace(className);
			else 
				namespace = getClassNamespace(type, className);
			if(namespace)
				instance = namespace.instance(!!instantiate);
			return instance;
		}
		
		this.createClassInstance = function(clsName, type){
			var cls = getClassNamespace(type, clsName),
			instance,
			clsPath = null;
			if (cls) {
				var clsInstance;
				clsInstance = (cls._a5_instance === null) ? new cls() : cls.instance();
				clsInstance._cl_setMVCName(clsName);
				return clsInstance;
			} else {
				return null;
			}
		}
		
		this.beginInstantiation = function(){
			for(var i = 0, l=namespaceArray.length; i<l; i++){
				var liveNamespace = a5.GetNamespace(applicationPackage + '.' + namespaceArray[i][0], null, true);
				if(liveNamespace && typeof liveNamespace == 'object'){
					for (var prop in liveNamespace) 
						if (typeof liveNamespace[prop] === 'function') {
							var instance = new liveNamespace[prop];
							liveNamespace[prop]._cl_isFinal = true;
							if (namespaceArray[i][0] === 'domains') {
								instance._name = prop;
								liveNamespace[prop]._a5_isSingleton = true;
							} else {
								instance._name = prop.substr(0, prop.toLowerCase().indexOf(namespaceArray[i][0].substr(0, namespaceArray[i][0].length - 1)));
							}
							var isValid = false;
							for(var j = 0, m=namespaceArray[i][1].length; j<m; j++)
								if(instance instanceof namespaceArray[i][1][j])
									isValid = true;
							if(!isValid)
								self.redirect(500, 'Error instantiating ' + namespaceArray[i][0] + ' class ' + instance.namespace() + ', must extend ' + namespaceArray[i][1].namespace());
						}
				}
			}
			self.cl().dispatchEvent(im.CLEvent.AUTO_INSTANTIATION_COMPLETE);
		}
		
		var getClassNamespace = function(type, clsName){							   
			return a5.GetNamespace(applicationPackage + '.' + type.toLowerCase() + 's.' + clsName + (type == 'domain' ? '':(type.substr(0, 1).toUpperCase() + type.substr(1))));
		}
})


a5.Package('a5.cl.core')
	.Static('Utils', function(Utils){
		
		Utils.isAbsolutePath = function(url){
			return (url.indexOf('://') !== -1 || url.substr(0, 1) == '/');
		}
		
		Utils.makeAbsolutePath = function(url){
			return Utils.isAbsolutePath(url) ? (url.substr(0, 1) == '/' ? a5.cl.Instance().initializer().environmentManager().appPath(true) + url:url):(a5.cl.Instance().initializer().environmentManager().appPath() + url);
		}
		
		
		Utils.trim = function(str){
			if(!str) return str;
			return str.replace(/(^\s+)|(\s+$)/g, "").replace(/\s{2,}/, " ");
		}
		
		Utils.mergeObject = function(mergeObj, sourceObj, $setSourceObj){
			var setSourceObj = $setSourceObj || false,
				retObj, prop;
			if(mergeObj == null) return sourceObj;
			if(sourceObj == null) return mergeObj;
			function recursiveMerge(sourceObj, mergeObj){
				for(prop in mergeObj){
					if(prop !== 'prototype' && prop !== 'constructor'){
						if (sourceObj[prop] !== undefined && sourceObj[prop] !== null && sourceObj[prop] !== sourceObj) {
							if (typeof sourceObj[prop] === 'object') {
								if (Object.prototype.toString.call(sourceObj[prop]) === '[object Array]') {
									if (Object.prototype.toString.call(mergeObj[prop]) === '[object Array]') 
										sourceObj[prop] = sourceObj[prop].concat(mergeObj[prop]);
								} else {
									sourceObj[prop] = recursiveMerge(sourceObj[prop], mergeObj[prop]);
								}
							} else {
								sourceObj[prop] = mergeObj[prop];
							}
						}  else {
							sourceObj[prop] = mergeObj[prop];
						}
					}
				}
				return sourceObj;
			}
			retObj = recursiveMerge(sourceObj, mergeObj);
			if(setSourceObj) sourceObj = retObj;
			return retObj;
		}
		
		Utils.deepClone = function(obj){
              if (typeof obj !== 'object' || obj == null) {
                  return obj;
              }
              var c = Utils.isArray(obj) ? [] : {};
              for (var i in obj) {
                  var value = obj[i];
                  if (typeof value == 'object') {
                     if (Utils.isArray(value)) {
                         c[i] = [];
                         for (var j = 0, l=value.length; j < l; j++) {
                             if (typeof value[j] != 'object') c[i].push(value[j]);
                             else c[i].push(Utils.deepClone(value[j]));
                         }
                     } else {
                         c[i] = Utils.deepClone(value);
                     }
                  } else {
                     c[i] = value;
                  }
              }
              return c;
          }

		
		Utils.initialCap = function(str){
			return str.substr(0, 1).toUpperCase() + str.substr(1);
		}
		
		Utils.validateHexColor = function(color){
			return /^#(([a-fA-F0-9]){3}){1,2}$/.test(color);
		}
		
		Utils.expandHexColor = function(color){
			if(a5.cl.core.Utils.validateHexColor(color)){
				if(color.length === 4)
					return '#' + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);
				else
					return color;
			} else {
				return '#000000';
			}
		}
		
		Utils.arrayIndexOf = function(array, value){
			for(var x = 0, y = array.length; x < y; x++){
				if(array[x] === value) return x;
			}
			return -1;
		}
		
		Utils.arrayContains = function(array, value){
			return Utils.arrayIndexOf(array, value) !== -1;
		}
		
		Utils.isArray = function(array){
			return Object.prototype.toString.call(array) === '[object Array]';
		}
		
		Utils.testVersion = function(val, isMax){
			var parseVersionString = function(val) {
			    val = val.split('.');
			    return {
			        major: parseInt(val[0]) || 0,
			        minor: val.length > 1 && parseInt(val[1]) || 0,
			        build: val.length > 2 && parseInt(val[2]) || 0
			    }
			}
			
			isMax = isMax || false;
			var versionVal = parseVersionString(a5.Version()),
			testVal = parseVersionString(String(val));
			if (versionVal.major !== testVal.major)
		        return isMax ? (versionVal.major < testVal.major) : (versionVal.major > testVal.major);
		    else if (versionVal.minor !== testVal.minor)
	            return isMax ? (versionVal.minor < testVal.minor) : (versionVal.minor > testVal.minor);
	        else if (versionVal.build !== testVal.build)
                return isMax ? (versionVal.build < testVal.build) : (versionVal.build > testVal.build);
            else
                return true;
		}
		
		Utils.viewInStack = function(view){
			var appView = a5.cl.mvc.core.AppViewContainer.instance();
			while(view){
				if(view === appView)
					return true;
				view = view.parentView();
			}
			return false;
		}
});



/**
 * @class Handles all xhr/ajax requests.
 * @name a5.cl.core.RequestManager
 */
a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("RequestManager", 'final', function(self, im){
		
		var defaultContentType,
			defaultMethod,
			reqArray,
			asyncRunning = false,
			JSON = 'JSON' in global ? global.JSON : a5.cl.core.JSON,
			reqCount;
	
		this.RequestManager = function(defMethod, defType){
			self.superclass(this, arguments);
			reqArray = [];
			reqCount = 0;
			defaultContentType = defType;
			defaultMethod = defMethod;
		}
		
		this.asyncRunning = function(){
			return asyncRunning;
		}

		this.processItem = function(props, reqID){
			var req;
			var reqComplete = function($req){
				if (getPropsForID(reqID)) {
					var req = this;
					if (req.readyState == 4) {
						var response, retData, status = req.status;
						if (status !== 500) {
							if (props.isJson) {
								response = req.responseText;
								
								if (a5.cl.core.Utils.trim(response) !== "") {
									response = JSON.parse(response);
									retData = (props.dataProp && props.dataProp !== undefined) ? response[props.dataProp] : response;
								}
							}
							else 
								if (props.isXML && req.responseXML) {
									response = req.responseXML;
								}
								else {
									response = req.responseText;
								}
							if (retData === undefined) 
								retData = response;
						}
						if (status == 200 || (status == 0)) {
							self.success(reqID, retData);
						}
						else {
							self.onError(reqID, status, retData || req.responseText);
						}
						self.reqComplete(reqID);
					}
				}
			},
			
			updateProgress = function(e){
				self.updateProgress(reqID, e);
			},
			
			onError = function(e){
				self.onError(reqID, req.status, e);
			},
			
			createAppend = function(data, isGet){
				var retString = isGet ? '?':'';
				for(var prop in data)
					retString += prop + '=' + data[prop] + '&';
				return retString.substr(0, retString.length-1);
			},
			
			contentType = null;
				req = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('MSXML2.XMLHTTP.3.0');
			if (req !== undefined) {
				var method = props.method || defaultMethod,
					data = props.data || null,
					urlAppend = method == "GET" ? createAppend(props.data, true) : '';
				if (data) {
					if (props.formData === true) {
						contentType = "multipart/form-data";
						var fd = new FormData();
						for (var prop in data) 
							fd.append(prop, data[prop])
						data = fd;
					} else if (props.isJson) {
						data = JSON.stringify(data);
					} else {
						contentType = 'application/x-www-form-urlencoded';
						data = createAppend(data, false);
					}
				}
				if(contentType === null)
					 contentType = defaultContentType;
				if(props.contentType)
					contentType = props.contentType;
				props.isJson = props.isJson !== undefined ? props.isJson:(contentType && contentType.toLowerCase().indexOf('json') != -1 ? true : false);
				props.isXML = (!props.isJson && contentType.toLowerCase().indexOf('xml')) != -1 ? true : false;
				props.charSet = props.charSet || null;
				if (req.addEventListener != undefined) req.addEventListener("progress", updateProgress, false);
				if (XMLHttpRequest) req.onerror = onError;
				req.onreadystatechange = reqComplete;
				req.open(method, props.url + urlAppend, true);
				if(props.formData !== true)
					req.setRequestHeader("Content-type", contentType);
				if(!props.allowCache && method == "POST")
					req.setRequestHeader("cache-control", "no-cache");
				if (props.charSet) req.setRequestHeader("charset", props.charSet);
				req.send(data);
			} else {
				if (props.error) props.error('client does not support XMLHTTPRequests');
			}
		}
		
		this.abortRequest = function(id){
			for (var i = 0; i < reqArray.length; i++) {
				if (reqArray[i].id === id) {
					reqArray[i].abort();
					reqArray.splice(i, 1);
					return;
				}
			}
			self.redirect(500, 'Cannot abort request; invalid identifier sent to abortRequest method.');
		}
		
		/**
		 * @function
		 * @name a5.cl.core.RequestManager#makeRequest
		 */
		this.makeRequest = function(props){
			if ((reqArray.length === 0 || isSilent()) && props.silent !== true) {
				asyncRunning = true;
				self.cl().dispatchEvent(im.CLEvent.ASYNC_START);
			}
			var reqID = reqCount++;
			props.url = a5.cl.core.Utils.makeAbsolutePath(props.url);
			var obj = {props:props,
				id:reqID,
				abort:function(){
						self.abortRequest(this.id);
					}
				};
			reqArray.push(obj);
			self.processItem(props, reqID);
			return obj;
		}
		
		this.success = function(id, data){
			var props = getPropsForID(id);
			if(props.success) props.success.call(self, data);
		}
		
		this.reqComplete = function(id){
			unqueueItem(id);
			if (reqArray.length === 0 || checkSilentReq()) {
				asyncRunning = false;
				self.cl().dispatchEvent(im.CLEvent.ASYNC_COMPLETE);
			}
		}
		
		this.updateProgress = function(id, e){
			var props = getPropsForID(id);
			if(props.progress) props.progress.call(self, e);
		}
		
		this.onError = function(id, status, errorObj){
			if (status != 200 && status != 0) {
				var props = getPropsForID(id);
				if (props && props.error) props.error.call(self, status, errorObj);
				else throw errorObj;
			}
		}
		
		var checkSilentReq = function(){
			for(var i =0, l = reqArray.length; i<l; i++)
				if(reqArray[i].props.silent !== true)
					return false;
			return true;
		}
		
		var getPropsForID = function(id){
			for(var i = 0, l=reqArray.length; i<l; i++)
				if(reqArray[i].id == id)
					return reqArray[i].props;
		}
		
		var unqueueItem = function(value){
			var isNumber = typeof value == 'number';
			for (var i = 0, l=reqArray.length; i < l; i++) {
				if ((isNumber && reqArray[i].id == value) || reqArray[i] == value) {
					reqArray.splice(i, 1);
					return;
				}
			}
		}
		
		var isSilent = function(){
			for (var i = 0, l = reqArray.length; i < l; i++) {
				if(reqArray[i].props.silent === true)
					return true;
			}
			return false;
		}
	
});


/**
 * @class An implementation of JSON2 by Douglas Crockford 
 * @see <a href="http://www.json.org">www.json.org</a>
 * @name a5.cl.core.JSON
 */
a5.cl.core.JSON = function(){
		
	var self = this;
		
	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = { // table of character substitutions
		'\b': '\\b',
		'\t': '\\t',
		'\n': '\\n',
		'\f': '\\f',
		'\r': '\\r',
		'"': '\\"',
		'\\': '\\\\'
	}, rep;
	
	var init = function(){
		if (typeof Date.prototype.toJSON !== 'function') {
			Date.prototype.toJSON = function(key){
				return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' +
				f(this.getUTCMonth() + 1) +
				'-' +
				f(this.getUTCDate()) +
				'T' +
				f(this.getUTCHours()) +
				':' +
				f(this.getUTCMinutes()) +
				':' +
				f(this.getUTCSeconds()) +
				'Z' : null;
			};
			String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key){
				return this.valueOf();
			};
		}
	}
	
	/**
	 * @memberOf a5.cl.core.JSON
	 * @param {Object} value
	 * @param {Object} replacer
	 * @param {Object} space
	 */
	var stringify = function(value, replacer, space){
		var i;
		gap = '';
		indent = '';
		
		if (typeof space === 'number') {
			for (i = 0; i < space; i += 1) {
				indent += ' ';
			}
		}
		else 
			if (typeof space === 'string') {
				indent = space;
			}
		
		rep = replacer;
		if (replacer && typeof replacer !== 'function' &&
		(typeof replacer !== 'object' ||
		typeof replacer.length !== 'number')) {
			throw 'JSON stringify error.';
		}
		return str('', {
			'': value
		});
	};
	
	/**
	 * @memberOf a5.cl.core.JSON
	 * @param {Object} text
	 * @param {Object} reviver
	 */
	var parse = function(text, reviver){
		var j;
		function walk(holder, key){
			var k, v, value = holder[key];
			if (value && typeof value === 'object') {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) {
							value[k] = v;
						}
						else {
							delete value[k];
						}
					}
				}
			}
			return reviver.call(holder, key, value);
		}
		
		text = String(text);
		cx.lastIndex = 0;
		if (cx.test(text)) {
			text = text.replace(cx, function(a){
				return '\\u' +
				('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			});
		}
		if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
			j = eval('(' + text + ')');
			return typeof reviver === 'function' ? walk({
				'': j
			}, '') : j;
		}
		throw new SyntaxError('JSON.parse');
	};
	
	var f = function(n){
		return n < 10 ? '0' + n : n;
	}
	
	function quote(string){
		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' +
		string.replace(escapable, function(a){
			var c = meta[a];
			return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) +
		'"' : '"' + string + '"';
	}
	
	function str(key, holder){
		var i, k, v, length, mind = gap, partial, value = holder[key];
		
		if (value && typeof value === 'object' &&
		typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}
		
		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}
		
		switch (typeof value) {
			case 'string':
				return quote(value);
			case 'number':
				return isFinite(value) ? String(value) : 'null';
			case 'boolean':
			case 'null':
				return String(value);
			case 'object':
				if (!value) {
					return 'null';
				}
				gap += indent;
				partial = [];
				if (Object.prototype.toString.apply(value) === '[object Array]') {
					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}
					v = partial.length === 0 ? '[]' : gap ? '[\n' + gap +
					partial.join(',\n' + gap) +
					'\n' +
					mind +
					']' : '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}
				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						k = rep[i];
						if (typeof k === 'string') {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}
				else {
					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}
				v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
				mind +
				'}' : '{' + partial.join(',') + '}';
				gap = mind;
				return v;
		}
	}
	
	init();
	
	return {
		stringify:stringify,
		parse:parse			
	}
}();



a5.Package("a5.cl.core")
	.Static(function(DataCache){
		
		DataCache.enabled = function(){
			return DataCache.instance().enabled();
		}
		
		DataCache.cacheExists = function(){
			return DataCache.instance().cacheExists();
		}
		
		DataCache.isAvailable = function(){
			return DataCache.instance().isAvailable();
		}
		
		DataCache.storeValue = function(key, value){
			return DataCache.instance().storeValue(key, value);
		}
		
		DataCache.getValue = function(key){
			return DataCache.instance().getValue(key);
		}
		
		DataCache.clearValue = function(key){
			return DataCache.instance().clearValue(key);
		}
		
		DataCache.clearScopeValues = function(scope, exceptions){
			return DataCache.instance().clearScopeValues(scope, exceptions);
		}
		
		DataCache.validateCacheKeyPrefix = function(key){
			return DataCache.instance().validateCacheKeyPrefix(key);
		}
		
		DataCache.removeCacheKeyPrefix = function(key){
			return DataCache.instance().removeCacheKeyPrefix(key);
		}
	})
	.Extends("a5.cl.CLBase")
	.Class("DataCache", 'singleton final', function(self, im){
		
		var _enabled,
			cacheKeys,
			provider;
		
		this.DataCache = function(cacheEnabled){
			self.superclass(this); 
			_enabled = cacheEnabled;
			cacheKeys = [];
		}
		
		this.enabled = function(){
			return _enabled;
		}

		this.isAvailable = function(){
			getCacheProvider().isAvailable();
		}
		
		this.cacheExists = function(){
			return getCacheProvider().cacheExists();
		}
		
		this.storeValue = function(key, value){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().storeValue(key);
			else
				return false;
		}
		
		this.getValue = function(key){			
			if (self.isAvailable() && checkCacheKey(key)) 
				return getCacheProvider().getValue(key);
		}
		
		this.clearValue = function(key){
			if (self.isAvailable() && checkCacheKey(key))
				return getCacheProvider().clearValue(key);
		}
		
		this.clearScopeValues = function(scope, $exceptions){		
			return getCacheProvider().clearScopeValues(scope, $exceptions);
		}		
		
		this.validateCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++)
				if(cacheKeys[i] == key)
					return false;
			cacheKeys.push(key);
			return true;
		}
		
		this.removeCacheKeyPrefix = function(key){
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if(cacheKeys[i] == key){
					cacheKeys.splice(i, 1);
					return;
				}
			}
		}
		
		var checkCacheKey = function(key){
			var isInCache = false;
			for (var i=0, l=cacheKeys.length; i<l; i++){
				if (key.substr(cacheKeys[i]) != -1) {
					isInCache = true;
					break;
				}
			}
			return isInCache;
		}
		
		var getCacheProvider = function(){
			if (!provider) 
				provider = self.plugins().getRegisteredProcess('dataCacheProvider');
			return provider;
		}
	
	
});


a5.Package("a5.cl.core")

	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("GlobalUpdateTimer", 'singleton final', function(self, im){

		var timer,
		clInstance,
		interval,
		evtInstance = new im.CLEvent(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK);
		
		this.GlobalUpdateTimer = function(_interval){
			self.superclass(this);
			interval = _interval;
			clInstance = self.cl();
			evtInstance.shouldRetain(true);
		}
		
		this.startTimer = function(){
			if(!timer)
				timer = setInterval(update, interval);
		}
		
		this.stopTimer = function(){
			this._cl_killTimer();
		}
		
		var update = function(){
			clInstance.dispatchEvent(evtInstance);
		}
		
		this._cl_killTimer = function(){
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		}		
});


a5.Package('a5.cl.core')
	
	.Import('a5.cl.CLEvent', 'a5.cl.CLLaunchState')
	.Extends('a5.cl.CLBase')
	.Class("Core", 'singleton final', function(self, im){
	
		var _cache,
			_params,
			_requestManager,
			_globalUpdateTimer,
			_instantiator,
			_pluginManager,
			_launchState;
		
		this.Core = function(params){
			self.superclass(this); 
			_params = params;
			_instantiator = new im.Instantiator(params.applicationPackage);
		}
			
		this.instantiator = function(){ return _instantiator; }			
		this.cache = function(){	return _cache;	}
		this.requestManager = function(){ return _requestManager;	}	
		this.pluginManager = function(){ return _pluginManager; }			
		this.globalUpdateTimer = function(){return _globalUpdateTimer;}
		this.launchState = function(){ return _launchState; }
		
		this.relaunch = function(){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_RELAUNCH);
			window.location.reload();
		}
		
		this.config = function(){ return _params; }
		
		this.initializeCore = function($environment, $clientEnvironment){
			updateLaunchStatus('APPLICATION_INITIALIZING');
			_globalUpdateTimer = new im.GlobalUpdateTimer(_params.globalUpdateTimerInterval);
			_requestManager = new im.RequestManager(_params.requestDefaultMethod, _params.requestDefaultContentType);
			_pluginManager = new im.PluginManager();
			_cache = new im.DataCache(_params.cacheEnabled);
			updateLaunchStatus('CORE_LOADED');
			var loadPaths = self.config().dependencies;
			if(loadPaths.length){
				if(self.cl().initializer()){
					var implemented = self.cl().initializer().load(loadPaths, dependenciesLoaded, function(e){
						updateLaunchStatus('DEPENDENCIES_LOADING', e);
					});
					if(implemented == false)
						dependenciesLoaded();
				} else
					dependenciesLoaded();
			}
			else dependenciesLoaded();	
		}
		
		var dependenciesLoaded = function(){
			updateLaunchStatus('DEPENDENCIES_LOADED');
			_pluginManager.instantiatePlugins();
			updateLaunchStatus('PLUGINS_LOADED');
			updateLaunchStatus('APPLICATION_PREPARED')
			_instantiator.beginInstantiation();
			var plgn = _pluginManager.getRegisteredProcess('launchInterceptor');
			if(plgn){
				var intercept = plgn.interceptLaunch(launchApplication);
				if(intercept) updateLaunchStatus('LAUNCH_INTERCEPTED', {interceptor:plgn});
				else launchApplication();
			} else {
				launchApplication();
			}
		}
		
		var launchApplication = function(){		
			_pluginManager.processAddons(addOnsLoaded);		
		}
		
		var addOnsLoaded = function(){
			updateLaunchStatus('APPLICATION_WILL_LAUNCH');
			updateLaunchStatus('APPLICATION_LAUNCHED');	
		}
		
		var updateLaunchStatus = function(type, e){
			_launchState = im.CLLaunchState[type];
			self.cl().dispatchEvent(im.CLEvent[type], e);
		}
});



/**
 * Mixin class for providing data storage hooks. DataStore applies a uniqe ID prefix on key values, removing the need to 
 * assure uniqueness of keys in your application. Key prefixes are unique to the class in which they are referenced.
 */
a5.Package('a5.cl.mixins')
	.Import('a5.cl.core.DataCache')
	.Mixin('DataStore', function(proto, im, DataStore){
		
		this.Properties(function(){
			this._cl_cacheKeyValidated = false;
			this._cl_prefix = null;
			this._cl_validatedPrefix = null;
		})
		
		proto.DataStore = function(){
		}
		
		/**
		 * Returns whether caching has previously been set by the application on the client and values are available for retrieval.
		 * @returns {Boolean}
		 */
		proto.cacheExists = function(){
			return im.DataCache.cacheExists();
		}
		
		/**
		 * Stores a value uniquely keyed in the localStorage cache.
		 * @param {String} key
		 * @param {String} value
		 * @returns {Boolean} success
		 */
		proto.storeValue = function(key, value){
			if(im.DataCache.isAvailable() && value !== undefined) 
				return im.DataCache.storeValue(this._cl_createCacheKey(key), value);
			else return false;
		}
		
		/**
		 * Specifies a predefined prefix name for values when stored in localStorage.
		 * @param {Object} value
		 */
		proto.keyPrefix = function(value){
			if(typeof value === 'string'){
				this._cl_prefix = value;
				return this;
			}
			return this._cl_prefix;
		}
		
		/**
		 * Retrieves a value for the specified key from the client data store.
		 * @param key {String}
		 * @returns {Object} False if failure
		 */
		proto.getValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.getValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Removes the value for the specified key from the client data store.
		 * @param key {String}
		 */
		proto.clearValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.clearValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Clears all key/value pairs associated with the class in which the method is called.
		 * @param {Array} [exceptions] An array of keys to leave untouched when clearing.
		 */
		proto.clearScopeValues = function(exceptions){
			if(im.DataCache.isAvailable()) 
				im.DataCache.clearScopeValues(this.instanceUID(), exceptions);
			else 
				return false;
		}
		
		proto._cl_createCacheKey = function(key){
			if (!this._cl_cacheKeyValidated || !this._cl_validatedPrefix) {
				var prefix = (this._cl_prefix || (this.id ? this.id() : false) || this.instanceUID());
				this._cl_cacheKeyValidated = im.DataCache.validateCacheKeyPrefix(prefix)
				if(!this._cl_cacheKeyValidated){
					a5.ThrowError("Error: Duplicate cache key prefix: " + prefix);
					return;
				}
				this._cl_validatedPrefix = prefix;
			}
			return this._cl_validatedPrefix + '_' + key;
		}
		
		proto.dealloc = function(){
			im.DataCache.removeCacheKeyPrefix(this._cl_validatedPrefix);
		}
});	


/**
 * Adds capabilities to a class to be a data source for a binding.
 */
a5.Package('a5.cl.mixins')
	.Mixin('BindableSource', function(mixin, im){
		
		this.Properties(function(){
			this._cl_receivers = null;
			this._cl_bindParamType = null;
			this._cl_bindParamRequired = false;
			this._cl_bindParamCallback = null;
		})
		
		mixin.BindableSource = function(){
			this._cl_receivers = [];
		}
		
		/**
		 * 
		 * @param {String} type
		 * @param {Boolean} required
		 * @param {Function} callback
		 */
		mixin.bindParamProps = function(type, required, callback){
			this._cl_bindParamType = type;
			if(required !== undefined) this._cl_bindParamRequired = required;
			if(callback !== undefined) this._cl_bindParamCallback = callback;
			return this;
		}
		
		/**
		 * Returns the data type of the param binding, specified in bindParamProps.
		 * @return {String}
		 */
		mixin.bindParamType = function(){
			return this._cl_bindParamType;
		}
		
		/**
		 * Returns whether a param is required for a binding, specified in bindParamProps.
		 * @return {String}
		 */
		mixin.bindParamRequired = function(){
			return this._cl_bindParamRequired;
		}
		
		/**
		 * Sends data to registered binding receivers.
		 * @param {Object} data The data to send.
		 * @param {Object} params Parameter data, based on values set in bindParamProps.
		 */
		mixin.notifyReceivers = function(data, params){	
			for (var i = 0, l = this._cl_receivers.length; i < l; i++) {
				var r = this._cl_receivers[i];
				if (params === undefined || params === r.params) {
					if (this._cl_bindParamRequired || (!data && this._cl_bindParamCallback !== null)) 
						data = this._cl_bindParamCallback.call(this, r.params);
					if (data !== null && data !== undefined) 
						r.receiver.receiveBindData.call(r.scope || r.receiver, this._cl_modifyBindData(data, r.mapping));
				}
			}
		}
		
		mixin.notifyReceiversOnInitialize = function(){
			for (var i = 0, l = this._cl_receivers.length; i < l; i++) {
				var r = this._cl_receivers[i];
				r.receiver.bindCallInitialize();
			}
		}
		
		mixin._cl_attachReceiver = function(receiver, params, mapping, scope){
			this._cl_receivers.push({receiver:receiver, params:params, mapping:mapping, scope:scope});
			this.notifyReceivers();
		}
		
		mixin._cl_detachReceiver = function(receiver){
			for(var i = 0, l = this._cl_receivers.length; i<l; i++){
				var r = this._cl_receivers[i];
				if(r.receiver === receiver){
					this._cl_receivers.splice(i, 1);
					break;
				}
			}
		}

		mixin._cl_modifyBindData = function(dataSource, mapping){
			var data,
				isQuery = false;
			//TODO - needs to move to ORM implementation
			if(dataSource instanceof a5.cl.CLQueryResult)
				isQuery = true;
			if(isQuery)
				data = dataSource._cl_data;
			else 
				data = dataSource;
			if(mapping){
				var dataSet = [],
					skipProps = {};
				for (var i = 0, l = data.length; i < l; i++) {
					var dataRow = {};
					for (var prop in mapping) {
						dataRow[prop] = data[i][mapping[prop]];
						skipProps[mapping[prop]] = prop;
					}
					for(var prop in data[i])
						if(skipProps[prop] === undefined)
							dataRow[prop] = data[i][prop];
					dataSet.push(dataRow);
				}
				if (isQuery) {
					dataSource._cl_data = dataSet;
					return dataSource;
				} else {
					return dataSet;
				}
			} else {
				return dataSource;
			}
		}
				
});



/**
 * Adds capabilities to a class to manage bindings.
 */
a5.Package('a5.cl.mixins')
	.Mixin('Binder', function(mixin, im){
		
		this.Properties(function(){
			this._cl_bindingsConnected = true;
			this._cl_bindings = [];
		});
		
		mixin.Binder = function(){
			this._cl_bindings = [];
		}
		
		/**
		 * Sets whether bindings are currently enabled. If set to false, all bindings are suspended, unless a binding has its persist value set to true.
		 * @param {Boolean} value
		 */
		mixin.setBindingEnabled = function(value){
			if (value !== this._cl_bindingsConnected) {
				for (var i = 0, l = this._cl_bindings.length; i < l; i++) {
					var b = this._cl_bindings[i];
					if (b.persist !== true) {
						if (value) 
							b.source._cl_attachReceiver(b.receiver, b.params, b.mapping, b.scope);
						else b.source._cl_detachReceiver(b.receiver);
					}
				}
				this._cl_bindingsConnected = value;
			}
		}
		
		/**
		 * Returns whether bindings are active.
		 * @return {Boolean}
		 */
		mixin.bindingsConnected = function(){
			return this._cl_bindingsConnected;
		}
		
		/**
		 * Creates a bind between a data source and a receiver.
		 * @param {a5.cl.mixins.BindableSource} source
		 * @param {a5.cl.interfaces.IBindableReceiver} receiver
		 * @param {Object} params Parameters for the binding source, as specified by the receiver.
		 * @param {Object} [mapping] If specified, remaps properties by name to new values. 
		 * @param {Object} [scope] Defines a scope to call the bind receiver in.
		 * @param {Object} [persist=false] If set to true, the binding will remain active if bindings are set to disabled.
		 */
		mixin.bind = function(source, receiver, params, mapping, scope, persist){
			if(!this._cl_checkBindExists(source, receiver, params)){
				if(source.isA5ClassDef())
					source = source.instance();
				if (!source.doesMix('a5.cl.mixins.BindableSource'))
					return this.throwError('source "' + source.className() + '" of bind call must mix a5.cl.mixins.BindableSource.');
				if(receiver.isA5ClassDef())
					receiver = receiver.instance();
				if (!receiver.doesImplement('a5.cl.interfaces.IBindableReceiver'))
					return this.throwError('receiver "' + receiver.className() + '" of call bind must implement a5.cl.interfaces.IBindableReceiver.');
				var hasParams = params !== undefined && params !== null,
					isNM = false,
					pType = null;
				if(source.bindParamRequired() || params){
					var isValid = true;
				 	if (!hasParams){
						isValid = false;
					} else if (source.bindParamType() !== null){
						pType = source.bindParamType();
						if(typeof pType === 'string' && pType.indexOf('.') !== -1)
							pType = a5.GetNamespace(pType);
						if(pType.namespace){
							isNM = true;
							var nmObj = pType.namespace();
							if(!(params instanceof pType))
								isValid = false;
						} else {
							if(typeof params !== source.bindParamType())
								isValid = false; 
						}
					}
					if(!isValid){
						this.throwError('params required for binding source "' + source.namespace() + '"' + (pType !== null ? ' must be of type "' + (isNM ? pType.namespace() : pType) + '"' : ''));
						return;
					}
				}
				this._cl_bindings.push({source:source, scope:scope, receiver:receiver, mapping:mapping, params:params, persist:persist})
				if(this.bindingsConnected())
					source._cl_attachReceiver(receiver, params, mapping, scope);
			}
		}
		
		/**
		 * Removes a given binding, if it exists.
		 * @param {a5.cl.mixins.BindableSource} source
		 * @param {a5.cl.interfaces.IBindableReceiver} receiver
		 * @throws 
		 */
		mixin.unbind = function(source, receiver){
			var found = false;
			for(var i = 0, l = this._cl_bindings.length; i<l; i++){
				var obj = this._cl_bindings[i];
				if(obj.source === source && obj.receiver === receiver){
					this._cl_bindings.splice(i, 1);
					found = true;
					break;
				}
			}
			if(found)
				source._cl_detachReceiver(receiver);
			else
				this.throwError('cannot unbind source "' + source.namespace() + '" on controller "' + this.namespace() + '", binding does not exist.');
		}
		
		mixin._cl_checkBindExists = function(source, receiver, params){
			for(var i = 0, l = this._cl_bindings.length; i<l; i++){
				var b = this._cl_bindings[i];
				if(b.source === source && b.receiver === receiver && b.params === params)
					return true;
			}
			return false;
		}
});


/**
 * Base class for service consumers in A5 CL.
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){	
		
		this.Properties(function(){
			this._cl_url = null;
			this._cl_isJson = true;
		})
		
		/**
		 * Constructor for CLService
		 * @param {String} url The url of the service endpoint.
		 */
		proto.CLService = function(url){
			proto.superclass(this);
			this._cl_url = url;
		}
		
		/**
		 * Returns the url of the service endpoint, respecting the serviceURLRewriter plugin process if associated.
		 * @return {String}
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * Getter/Setter method for the default setting for the consumer endpoint for JSON parsing.
		 * @param {Boolean} [value] If passed, sets the value.
		 * @return {Boolean|a5.cl.CLService} if a value is passed, returns a reference to the object instance for chaining, otherwise returns the value.
		 */
		proto.isJson = function(value){
			if(value !== undefined) this._cl_isJson = value;
			return this._cl_isJson;
		}
		
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('SerializableAttribute', 'abstract', function(cls){
		
		cls.SerializableAttribute = function(){
			
		}
})


/**
 * Base class for web socket consumers in the A5 CL framework.
 */
a5.Package('a5.cl')
	
	.Import('a5.cl.core.JSON')
	.Extends('CLService')
	.Static(function(CLSocket){
		
		/**
		 * Returns whether the application context has support for the HTML5 WebSocket API, required for CLSocket usage.
		 */
		CLSocket.supportsSockets = function(){
			return 'WebSocket' in window ? true : false;
		}	
		
	})
	.Prototype('CLSocket', 'abstract', function(proto, im, CLSocket){
		
		this.Properties(function(){
			this._cl_socket = null;
			this._cl_socketOnMessage = null;
		})
		
		/**
		 * Constructor for a CLSocket instance.
		 * @param {String} url The location of the socket endpoint.
		 */
		proto.CLSocket = function(url){
			proto.superclass(this, [url]);
			if (CLSocket.supportsSockets()) {
				this._cl_socket = new WebSocket(url);
				var self = this;
				this._cl_socketOnMessage = function(e){
					var data = self.isJson() ? im.JSON.parse(e.data) : e.data;
					self.dataReceived(data);
				}
			}
		}
		
		/**
		 * Performs a call on the socket endpoint.
		 * @param {String} message The message to send to the socket.
		 * @param {Function} [callback] A function to pass returned results to.
		 */
		proto.send = function(m, callback){
			if (CLSocket.supportsSockets()) {
				var self = this;
				self._cl_socket.onmessage = self._cl_socketOnMessage;
				var sendMsg = function(){
					self._cl_socket.onopen = null;
					if (callback) {
						self._cl_socket.onmessage = function(e){
							var data = self.isJson() ? a5.cl.core.JSON.parse(e.data) : e.data;
							callback(data);
							self._cl_socket.onmessage = self._cl_socketOnMessage;
						}
					}
					self._cl_socket.send(m);
					return null;
				}
				switch (this._cl_socket.readyState) {
					case 0:
						this._cl_socket.onopen = sendMsg;
						break;
					case 1:
						sendMsg();
						break;
					case 2:
						this._cl_socket.onopen = sendMsg;
						this._cl_socket.connect();
						break;
				}
			} else {
				throw 'Error sending data to socket ' + this.mvcName() + ', Web Sockets are not supported in this browser.';
			}
		}
		
		
		/**
		 * Override to receive data from the socket connection.
		 * @param {String|Object} message The returned data, either an object or a string depending on the value of the isJson setting.
		 */
		proto.dataReceived = function(data){
			
		}
		
		/**
		 * Closes the socket connection.
		 */
		proto.close = function(){
			if(this._cl_socket) this._cl_socket.close();
		}	
		
		proto.dealloc = function(){
			if(this._cl_socket && this._cl_socket.readyState === 2) this.close();
		}
});


/**
 * Base class for Ajax endpoint consumers.
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Mix('a5.cl.mixins.BindableSource')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		this.Properties(function(){
			this._cl_ajaxStruct = null;
			this._cl_silent = false;
		})
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.CLAjax = function(url, props){
			proto.superclass(this, [url]);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
		 * @returns {Number} The request ID.
		 */
		proto.call = function(m, data, callback, props){
			//TODO: enforceContract to allow overload with no method, or no data
			var callObj = this._cl_ajaxStruct ? a5.cl.core.Utils.deepClone(this._cl_ajaxStruct):{};
			if (props) {
				for (var prop in callObj) 
					if (props[prop] == undefined) props[prop] = callObj[prop];
			} else {
				props = callObj;
			}
			if (data) {
				if(data.isA5Class)
					props.data = a5.Attribute.processInstance(data);
				props.data = data;
			}
			props.isJson = this.isJson();
			props.success = callback;
			if(this._cl_silent)
				props.silent = true;
			if(m){
				if(this.url().indexOf('?') == -1 && m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		/**
		 * Aborts all calls associated with the service.
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Boolean} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});


/**
 * Adds ajax call wrapping logic to a method. Calls to methods with this attribute are assumed to execute a call
 * to a method on the endpoint of the same name.
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Static(function(AjaxCallAttribute){
		
		AjaxCallAttribute.CANCEL_CYCLE	= 'ajaxCallAttributeCancelCycle';
		
	})
	.Class('AjaxCallAttribute', function(cls, im, AjaxCallAttribute){
		
		var cycledCalls = {},
			data = {};
		
		cls.AjaxCallAttribute = function(){
			cls.superclass(this);
			
		}

		cls.Override.before = function(aspectArgs){		
			var data = null,
				args = aspectArgs.args() ? Array.prototype.slice.call(aspectArgs.args()) : [],
				argsCallback = null,
				rules = aspectArgs.rules().length ? aspectArgs.rules()[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length)
				data = args.shift();
			if(rules.props)
				propObj = rules.props;
			if(rules.hasErrorCallback){
				if(!propObj)
					propObj= {};
				propObj.error = args.pop();	
			}
			if(rules.hasCallback === true && args.length && typeof args[0] === 'function')
				argsCallback = args.shift();
			var executeCall = function(){
				if (rules.cacheResponse && getData(aspectArgs.method())) {
					setTimeout(function(){
						args.unshift(getData(aspectArgs.method()));
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, 0);
				} else {	
					aspectArgs.scope().call(aspectArgs.method().getName(), data, function(response){
						if (rules.cacheResponse)
							storeData(aspectArgs.method(), response);
						args.unshift(response);
						if (argsCallback) 
							argsCallback(args);
						aspectArgs.callback()(args);
					}, propObj);
				}
			}
			if (args[0] === AjaxCallAttribute.CANCEL_CYCLE) {
				if (aspectArgs.method()._cl_cycleID) {
					clearInterval(aspectArgs.method()._cl_cycleID);
					delete aspectArgs.method()._cl_cycleID;
				}
				return a5.AspectAttribute.ASYNC;
			}
			if (rules.cycle) {
				if (!aspectArgs.method()._cl_cycleID) {
					aspectArgs.method()._cl_cycleID = setInterval(function(){
						aspectArgs.method().apply(aspectArgs.scope(), args);
					}, rules.cycle);
					executeCall();
				} else {
					executeCall();
				}
			} else {
				executeCall();
			}
			return a5.AspectAttribute.ASYNC;
		}	
		
		var getData = function(method){
			return data[method.getClassInstance().instanceUID() + "_" + method.getName()];
		}	
		
		var storeData = function(method, value){
			data[method.getClassInstance().instanceUID() + "_" + method.getName()] = value;
		}
})

/**
 * Associates a method on a CLAjax instance as associated with a bind configuration from {@link a5.cl.mixins.Binder}
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxReturnAttribute', function(cls){
		
		cls.BoundAjaxReturnAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			if (aspectArgs.rules().length && aspectArgs.rules()[0].receiverMethod !== undefined) 
				aspectArgs.rules()[0].receiverMethod.call(null, aspectArgs.args()[0]);
			else
				aspectArgs.scope().notifyReceivers(aspectArgs.args()[0], aspectArgs.method().getName());
			return a5.AspectAttribute.SUCCESS;
		}
})
	
/**
 * Provides init info for an associated method on a CLAjax instance as associated with a bind configuration from {@link a5.cl.mixins.Binder}
 */
a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxInitializeAttribute', function(cls){
		
		cls.BoundAjaxInitializeAttribute = function(){
			cls.superclass(this);
		}

		cls.Override.before = function(aspectArgs){
			aspectArgs.scope().notifyReceiversOnInitialize();
			return a5.AspectAttribute.SUCCESS;
		}
})



/**
 * Defines a plugin for an A5 CL application.
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLPlugin', 'abstract', function(proto, im){
			
		this.Properties(function(){
			this._cl_pluginConfig = null;
			this._cl_configDefaults = {};
			this._cl_requiredVersion = '0';
			this._cl_maxVerifiedVersion = null;
			this._cl_requires = [];
		})
		
		proto.CLPlugin = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the plugin configuration object, merging default values with overrides from the application CLMain instance.
		 * @return {Object}
		 */
		proto.pluginConfig = function(){
			return this._cl_pluginConfig;
		}
		
		/**
		 * Specifies a require class or package for the plugin.
		 * @param {String} val
		 */
		proto.requires = function(val){
			this._cl_requires.push(val);
		}
		
		/**
		 * Specifies a required minimum version of A5 CL for the plugin.
		 * @param {String} value
		 */
		proto.requiredVersion = function(value){
			if(value !== undefined) this._cl_requiredVersion = value;
			return this._cl_requiredVersion;
		}
		
		/**
		 * Specifies a maximum version of A5 CL that the plugin has been validated for. Setting allowUntestedPlugins to true on A5 CL config
		 * will allow a plugin to run in CL with a version number higher than this specified value.
		 * @param {String} value
		 */
		proto.maxVerifiedVersion = function(value){
			if(value !== undefined) this._cl_maxVerifiedVersion = value;
			return this._cl_maxVerifiedVersion;
		}
		
		/**
		 * Sets the default config params and their values for the plugin.
		 * @param {Object} value
		 */
		proto.configDefaults = function(value){
			 if(value !== undefined)
			 	this._cl_configDefaults = value;
			return this._cl_configDefaults;
		}
		
		
		/**
		 * Initialization method for the plugin, called when all plugins have been loaded. Override does not require super call. 
		 */
		proto.initializePlugin = function(){}
		
		/**
		 * Associates the plugin with the specified registerable plugin process, either of the A5 CL framework directly or of an addon that specifies its own registrable processes.
		 * @param {String} type
		 */
		proto.registerForProcess = function(type){
			this.cl()._core().pluginManager().registerForProcess(type, this);
		}
		
		proto._cl_sourceConfig = function(){
			var cfg = a5.cl.CLMain._cl_storedCfgs.pluginConfigs;
			var pkg = this.classPackage();
			if(String(pkg[pkg.length-1]).toLowerCase() != this.className().toLowerCase())
						pkg = pkg + '.' + this.constructor.className();
			for (var prop in cfg){
				var pluginCfg = cfg[prop];
				 if(pluginCfg.nm && (pluginCfg.nm === pkg || pluginCfg.nm === this.constructor.className()))
				 	return pluginCfg.obj;
			}
			return {};
		}
	
});


/**
 * CLAddons are top level member plugins for A5 CL. CLAddons augment the plugin model by allowing for custom configuration rules,
 * the ability to define custom registrable processes for other plugins, and the ability register custom class types for auto instantiation.
 */
a5.Package('a5.cl')

	.Extends('CLPlugin')
	.Prototype('CLAddon', 'abstract', function(proto, im, CLAddon){
		
		/**
		 * @event
		 */
		CLAddon.INITIALIZE_COMPLETE = 'clAddonInitializeComplete';	
		
		proto.CLAddon = function(){
			proto.superclass(this);
		}
		
		/**
		 * Must be override as a starting point for the addon. This method is called after all addons have been loaded, but prior to plugins loading.
		 * It is not necessary to call super on this method when overriding.
		 */
		proto.initializeAddOn = function(){
			return false;
		}
		
		/**
		 * Defines a new config method for CLMain. This method should be called in the constructor of the addon. Values added dynamically create a method with a 'set' prefix, much like the existing setConfig method.
		 * For example, a value of 'foo' would create a method named setFoo() in CLMain.
		 * @param {String} type
		 */
		proto.createMainConfigMethod = function(type){
			a5.cl.CLMain.prototype['set' + type.substr(0, 1).toUpperCase() + type.substr(1)] = function(){
				a5.cl.CLMain._cl_storedCfgs[type] = Array.prototype.slice.call(arguments);
			}
		}
		
		/**
		 * Gets the values set via CLMain for a type defined in createMainConfigMethod.
		 * @param {Object} type
		 */
		proto.getMainConfigProps = function(type){
			return a5.cl.CLMain._cl_storedCfgs[type];
		}
		
		/**
		 * 
		 */
		proto.registerAutoInstantiate = function(){
			a5.cl.core.Instantiator.instance().registerAutoInstantiate.apply(null, arguments);
		}
		
		/**
		 * 
		 */
		proto.defineRegisterableProcess = function(process){
			this.cl()._core().pluginManager().defineRegisterableProcess(process);
		}
	
});

/**
 * The instance of an A5 CL application, acting as both a reference instance for core components via its methods and as a global binder object.
 */
a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(cls, im){
	
		var _params,
			_initializer,
			_config,
			core,
			main;
		
		cls._cl_plugins = {};

		cls.CL = function(params, initializer){
			cls.superclass(this);
			_config = params;
			var searching = true,
				clsDef = a5.cl.CLMain;
			do{
				if(clsDef.isPrototype() && clsDef._extenderRef.length == 0){
					searching = false;
					//TODO: throw error on failure, only applies when CLMain extendenders exist
					return;
				}
				if(clsDef._extenderRef[0].isPrototype()){
					clsDef = clsDef._extenderRef[0];
				} else {
					main = new clsDef._extenderRef[0](params);
					searching = false;
				} 
			}while(searching);
			_params = main._cl_params();
			_initializer = initializer;
			core = new a5.cl.core.Core(_params);
			if (_config.breakOnDestroyedMethods == true) {
				a5._a5_destroyedObjFunc = Function('debugger;');
			}
		}
		
		cls._cl_launch = function(){
			core.initializeCore((_params.environment || null), (_params.clientEnvironment || null));
		}
		
		cls.main = function(){
			return main;
		}
		
		cls.initializer = function(){
			return _initializer;
		}
		
		/**
		 * Returns the current launch state of the application, a value from TODO
		 */
		cls.launchState = function(){ return core.launchState(); }
		
		/**
		* @type String
		* @default null
		*/
		cls.applicationBuild = function(){ return _config.applicationBuild; }
		
		/**
		* @type  String 
		* @default an empty string
		*/
		cls.appName = function(){ return _config.appName; }
		
		/**
		 * Returns a reference to the application package.
		 * @param {Boolean} [returnString=false] If true is passed, returns the string value of the namespace of the application package.
		 */
		cls.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(cls, arguments); };
		
		/**
		 *
		 */
		cls.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }
		
		/**
		* @type  String
		* @default 'DEVELOPMENT'
		*/
		cls.environment = function(){ return _config.environment; }
		
		/**
		 *
		 */
		cls.Override.plugins = function(){ return cls._cl_plugins; }
		
		/**
		 * Restarts the application.
		 */
		cls.relaunch = function(){ core.relaunch(); }
		
		cls._core = function(){		return core; }
		
		cls.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
		cls.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(cls.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});



a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		var configDefaults={
			allowUntestedPlugins:false,
			applicationBuild:null,
			appName:'',		
			breakOnDestroyedMethods:false,
			cacheEnabled:true,
			dependencies:[],
			environment:'DEVELOPMENT',
			globalUpdateTimerInterval:10,
			requestDefaultContentType:'application/json',
			requestDefaultMethod:'POST'
		},
		_params;
		
		/**
		 * @param {Object} [params=null] An optional object of parameters to pass into the application instance. Must be passed as a parameter to a5.cl.CreateApplication.
		 */
		proto.CLMain = function(params){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				throw new a5.cl.CLError('Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.');
			if(this.getStatic().instanceCount() > 1)
				throw new a5.cl.CLError('Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"');
			for (var prop in configDefaults)
				if(params[prop] === undefined)
					params[prop] = configDefaults[prop];
			_params = params;
			_params.applicationPackage = this.classPackage();
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch, false, this);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch, false, this);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched, false, this);
		}
		
		proto.allowUntestedPlugins = function(val){ _params.allowUntestedPlugins = val; }
		
		proto.appName = function(val){ _params.appName = val; }
		
		proto.applicationBuild = function(val){ _params.applicationBuild = val; }
		
		proto.breakOnDestroyedMethods = function(val){ _params.breakOnDestroyedMethods = val; }
		
		proto.cacheEnabled = function(val){ _params.cacheEnabled = val; }
		
		proto.dependencies = function(val){ _params.dependencies = val; }
		
		proto.environment = function(val){ _params.environment = val; }
		
		proto.globalUpdateTimerInterval = function(val){ _params.globalUpdateTimerInterval = val; }
		
		proto.requestDefaultContentType = function(val){ _params.requestDefaultContentType = val; }
		
		proto.requestDefaultMethod = function(val){ _params.requestDefaultMethod = val; }
		
		proto._cl_params = function(){ return _params; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
		/**
		 * 
		 * @param {string} namespace
		 * @param {Object} obj
		 */
		proto.setPluginConfig = function(namespace, obj){ CLMain._cl_storedCfgs.pluginConfigs.push({nm:namespace, obj:obj}); }
		
		
		proto.dependenciesLoaded = function(){}
		
		/**
		 * 
		 */
		proto.pluginsLoaded = function(){}
		/**
		 * @name onlineStatusChanged
		 * @description Called by the framework when the browser's online status has changed. This is equivalent to listening for {@link a5.cl.MVC.event:ONLINE_STATUS_CHANGE}.
		 */
		proto.onlineStatusChanged = function(isOnline){}
		
		/**
		 * @name autoInstantiationComplete 
		 * @description Called by the framework when auto detected classes have been successfully instantiated.
		 */
		proto.autoInstantiationComplete = function(){}
		
		/**
		 * @name applicationWillLaunch 
		 * @description Called by the framework when the application is about to launch.
		 */
		proto.applicationWillLaunch = function(){}
		
		/**
		 * @name applicationLaunched 
		 * @description Called by the framework when the application has successfully launched.
		 */
		proto.applicationLaunched = function(){}
		
		/**
		 * @name applicationWillClose
		 * @description Called by the framework when the window is about to be closed. This method is tied to
		 * the onbeforeunload event in the window, and as such can additionally return back a custom string value to throw in a confirm
		 * dialogue and allow the user to cancel the window close if desired.
		 */
		proto.applicationWillClose = function(){
			
		}
		
		/**
		 * @name applicationClosed
		 * @description Called by the framework when the window is closing.
		 */
		proto.applicationClosed = function(){}
		
		/**
		 * @name applicationWillRelaunch
		 * @description Called by the framework when the application is about to relaunch.
		 */
		proto.applicationWillRelaunch = function(){}
})	



})(typeof global !== 'undefined' ? global : this);