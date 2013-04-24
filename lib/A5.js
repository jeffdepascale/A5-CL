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
					var result = func.apply(self, args);
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
					var result = func.apply(self, args);
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
				this.constructor._a5_instanceConst.apply(this, createArgs);
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