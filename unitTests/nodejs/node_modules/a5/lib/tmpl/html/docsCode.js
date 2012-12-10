//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( window, undefined ) {//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( window, undefined ) {(function(){
	
	var windowItemList = null,
	
	GetNamespace = function(namespace, imports, allowGenericReturns){
		var splitNM, i, l, context;
		if(!namespace)
			return null;
		allowGenericReturns = allowGenericReturns || false;
		if(typeof namespace === 'object')
			return namespace;
		splitNM = namespace.split('.');
		context = window;
		if(splitNM.length === 1 && imports && imports[namespace])
			return imports[namespace];
		for(i= 0, l=splitNM.length; i<l; i++){
			context = context[splitNM[i]];
			if(context === undefined) return null;
		}
		if(allowGenericReturns || context.namespace !== undefined)
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
		object = splitNM.length ? _af_objectQualifier(splitNM) : window
		if (object[property] !== undefined)
			return object[property]; 
		return object[property] = autoCreate ? new placedObject() : placedObject;
	},	
	
	_af_objectQualifier = function(nmArr){
		var context = window,
			i, l;
		for(i = 0, l=nmArr.length; i<l; i++){
			if(!context[nmArr[i]]) context[nmArr[i]] = {};
			context = context[nmArr[i]];
		}
		return context;
	},
	
	TrackWindowStrays = function(){
		windowItemList = {};
		for(var prop in window)
			windowItemList[prop] = '';
	},
	
	GetWindowStrays = function(purge){
		if(!windowItemList)
			a5.ThrowError(101);
		else {
			var retList = [], prop
			for(prop in window)
				if(windowItemList[prop] === undefined)
					retList.push(prop);
			if(purge === true)
				TrackWindowStrays();
			return retList;
		}	
	}
	
	/**
	 * @name a5
	 * @namespace Houses all classes and OOP methods in the A5 model. 
	 */
	window.a5 = {
		/**#@+
	 	 * @memberOf a5
	 	 * @function
		 */
		
		/**
		 * @name version
		 * @type String
		 * @returns The version number of A5.
		 */
		version:function(){
			return  '0.5.{BUILD_NUMBER}';
		},
		/**
		 * @name buildDate
		 * @type String
		 * @returns The build date of the release of A5.
		 */
		buildDate:function(){
			return '{BUILD_DATE}';
		},
		
		/**
		 * Returns a class declaration for a given namespace string.
		 * @name GetNamespace
		 * @param {String} namespace
		 */
		GetNamespace:GetNamespace,
		
		/**
		 * Places a function or object in the specified namespace. If the namespace does not exist it is created.
		 * @name SetNamespace
		 * @param {String} namespace
		 * @param {Object|Function} placedObject
		 */
		SetNamespace:SetNamespace,
		
		TrackWindowStrays:TrackWindowStrays,
		
		GetWindowStrays:GetWindowStrays,
		
		/**
		 * @name CreateGlobals
		 */
		CreateGlobals:function(){
			window.Create = a5.Create;
			window.Package = a5.Package;
			window.GetNamespace = a5.GetNamespace;
			window.SetNamespace = a5.SetNamespace;
			window.ThrowError = a5.ThrowError; 
		}
	}
})();


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
					else if(clsDef.doesExtend(a5.AspectAttribute))
						isAspect = true;
					if(isError)
						return a5.ThrowError(303);
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
		
		attrObj.wrappedMethod = method;
			
		var proxyFunc = function(){
			var callOriginator,
				prop,
				pCaller,
				attrClasses = [], 
				executionScope = this,
				callOriginator,
				count = 0;
			if(method)
				for(var prop in proxyFunc)
					method[prop] = proxyFunc[prop];
			pCaller = proxyFunc.caller;
			do{
				if (pCaller.getClassInstance !== undefined)
					callOriginator = pCaller;
				else	
					pCaller = pCaller.caller;
			} while (pCaller !== null && !callOriginator);
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
					ret = attrClasses[id].cls.around(attrClasses[id].props, args, executionScope, proxyFunc, callback, callOriginator, beforeArgs);
					if(ret === a5.AspectAttribute.NOT_IMPLEMENTED)
						ret = attrClasses[id].cls[(isAfter ? "after" : "before")](attrClasses[id].props, args, executionScope, proxyFunc, callback, callOriginator, beforeArgs);
					else
						isAround = true;
				if (ret !== null && ret !== undefined) {
					switch(ret){
						case a5.Attribute.SUCCESS:
							ret = args;
							break;
						case a5.Attribute.ASYNC:
							isAsync = true;
							break;
						case a5.Attribute.RETURN_NULL:
							ret = null;
							break;
						case a5.Attribute.FAILURE:
							return;
					}
				} else
					return a5.ThrowError(308, null, {prop:prop, method:isAround ? 'around' : (isAfter ? 'after' : 'before')});
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
			a5.Create(a5.Attribute._extenderRef[i]);
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
	}
	
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
	
	Create = function(classRef, args){
		var ref, retObj;
		if (typeof classRef === 'string'){
			ref = a5.GetNamespace(classRef);
			if (ref === null)
				return a5.ThrowError(207, null, {className:classRef});
		} else
			ref = classRef;
		if (typeof ref !== 'function')
			return a5.ThrowError(207, null, {className:classRef});
		if(ref.isInterface())
			return a5.ThrowError(208, null, {nm:ref.namespace()});
		try {
			retObj = new ref();
		}catch (e){
			return a5.ThrowError(209, null, {nm:typeof classRef === 'string' ? classRef:(classRef.namespace ? classRef.namespace():''), errorStr:e});
		}
		if (ref._a5_clsDef) 
			processDeclaration(ref._a5_clsDef, retObj, retObj, ref.imports(), ref)
		//else
			//TODO: throw error, invalid class declaration
		retObj._a5_initialize(args);
		return retObj;
	},
	
	processDeclaration = function(owner, scope, obj, imports, stRef, isProto){
		if (isProto) {
			scope.Properties = function(propFunc){
				obj.constructor._a5_protoProps = propFunc;
			}
			scope.PrivateProperties = function(propFunc){
				obj.constructor._a5_protoPrivateProps = propFunc;
				return function(instance){
					return instance._a5_privatePropsRef[obj.namespace()];
				}
			}
		}
		scope.Attributes = function(){
			return a5.core.attributes.createAttribute.call(obj, scope, arguments);
		}
		obj.Override = {};
		obj.Final = {};
		owner.call(scope, obj, imports, stRef);
		a5.core.mixins.prepareMixins(obj);
		processMethodChangers(obj);
		for (prop in obj) {
			if (({}).hasOwnProperty.call(obj, prop) && typeof obj[prop] === 'function' && a5.core.classProxyObj[prop] === undefined) {
				if (prop === obj.className()) {
					obj.constructor._a5_instanceConst = obj[prop];
					a5.core.reflection.setReflection(stRef, obj, prop, obj.constructor._a5_instanceConst);
					delete obj[prop];
				} else {
					a5.core.reflection.setReflection(stRef, obj, prop);
				}
			}
		}
		delete obj.Final;
		delete obj.Override;
		delete scope.Attributes;
		
		if(isProto){
			delete scope.Properties;
			delete scope.PrivateProperties;
		}
	},
	
	processMethodChangers = function(obj){
		var sc = obj.superclass(),
			mixinRef = obj.constructor._a5_mixedMethods;
		if(!sc)
			sc = {};
		for(prop in obj){
			if(obj.hasOwnProperty(prop) && typeof obj[prop] === 'function'){
				if (prop !== 'Final' && prop !== 'Override' && prop !== 'constructor' && prop !== 'prototype' && prop !== 'dealloc' && prop !== '_a5_initialized') {
					if (sc[prop] && sc[prop].toString().indexOf('[native code]') === -1){
						if(sc[prop].Final == true)
							return a5.ThrowError(201, null, {prop:prop, namespace:obj.namespace()});
						return a5.ThrowError(200, null, {prop:prop, namespace:obj.namespace()});
					} else {
						var mixMethod = mixinRef[prop];
						if (mixinRef[prop] !== undefined && mixMethod !== obj[prop]) {
							return a5.ThrowError(220, null, {
								prop: prop,
								namespace: obj.namespace()
							});
						}
					}
				}
			}
		}
		for(prop in obj.Override){
			if(sc[prop] === undefined && mixinRef[prop] === undefined)
				return a5.ThrowError(202, null, {prop:prop, namespace:obj.namespace()});
			if(sc[prop] && sc[prop].Final === true || mixinRef[prop] && mixinRef[prop].Final === true)
				return a5.ThrowError(203, null, {prop:prop, namespace:obj.namespace()});
			obj[prop] = obj.Override[prop];
		}
		for(prop in obj.Final){
			obj[prop] = obj.Final[prop];
			obj[prop].Final = true;
		}
	},
	
	Package = function(pkg){
		var imports, clsName, 
		cls, base, type, proto, 
		implement, mixins,
		attribs = null,
		staticMethods = false,
		isMixin = false, 
		isInterface = false, 
		enumDeclaration = false,
		isProto = false,
		
		process = function(){
			var im = _a5_processImports(imports, pkg),
			pkgObj = {	pkg:pkg, 
						imports:imports, 
						clsName:clsName, 
						cls:cls, 
						base:base, 
						attribs:attribs,
						type:type, 
						proto:proto, 
						implement:implement,
						mixins:mixins,
						staticMethods:staticMethods,
						isInterface:isInterface,
						isMixin:isMixin,
						enumDeclaration:enumDeclaration,
						isProto:isProto},
			validationResult = a5.core.verifiers.validateClassDependencies(base, im, mixins, implement, isInterface, isMixin);
			if (validationResult === true) 
				processClass(pkgObj);
			else 
				packageQueue.push({pkg:pkgObj, reason:validationResult.reason, reasonNM:validationResult.reasonNM});
			process = Import = Extends = Implements = Static = Interface = Class = Prototype = Mixin = Mix = Enum = null;
		},
		
		Import = function(){
			imports = Array.prototype.slice.call(arguments);
			return {Prototype:Prototype, Static:Static, Mixin:Mixin, Mix:Mix, Extends:Extends, Implements:Implements, Interface:Interface,  Class:Class};
		},
		
		Extends = function(str){
			base = str;
			return {Prototype:Prototype, Static:Static, Import:Import, Mix:Mix, Implements:Implements, Interface:Interface, Class:Class};
		},
		
		Mix = function(){
			mixins = Array.prototype.slice.call(arguments);
			return {Prototype:Prototype, Static:Static, Extends:Extends, Implements:Implements, Interface:Interface,  Class:Class};
		},
		
		Implements = function(arr){
			implement = Array.prototype.slice.call(arguments);
			return {Prototype:Prototype, Static:Static, Mix:Mix, Import:Import, Extends:Extends, Class:Class};
		},
		
		Static = function(name, func){
			if(typeof name === 'string'){
				clsName = name;
				staticMethods = func;
				process();
			} else {
				staticMethods = name;
				return {Prototype:Prototype, Implements:Implements, Mix:Mix, Mixin:Mixin, Import:Import, Extends:Extends, Class:Class};
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
			for(var i = 1, l = args.length; i<l; i++){
				switch(typeof args[i]){
					case 'string':
						type = args[i];
						break;
					case 'object':
						if (Object.prototype.toString.call(args[i]) === '[object Array]') {
							if(!attribs) attribs = [];
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
			for(var i = 1, l = args.length; i<l; i++){
				switch(typeof args[i]){
					case 'string':
						type = args[i];
						break;
					case 'object':
						if (Object.prototype.toString.call(args[i]) === '[object Array]') {
							if(!attribs) attribs = [];
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
			for(var i = 1, l = args.length; i<l; i++){
				switch(typeof args[i]){
					case 'string':
						type = args[i];
						break;
					case 'object':
						if (Object.prototype.toString.call(args[i]) === '[object Array]') {
							if(!attribs) attribs = [];
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
		
		return {Enum:Enum, Static:Static, Import:Import, Extends:Extends, Mixin:Mixin, Mix:Mix, Implements:Implements, Class:Class, Prototype:Prototype, Interface:Interface};
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

		
		
		if (!base || base === undefined) base = genBaseFunc;
		extender = function(){};
		
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
					extender.prototype = new base();			
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
				im = _a5_processImports(pkgObj.imports, pkgObj.pkg),
				validationResult = a5.core.verifiers.validateClassDependencies(pkgObj.base, im, pkgObj.mixins, pkgObj.implement);		
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
		var imports = function(){ return _a5_processImports(pkgObj.imports, pkgObj.pkg); },
			base = (typeof pkgObj.base === 'function') ? pkgObj.base : a5.GetNamespace(pkgObj.base, imports()),
			obj = Extend(pkgObj.pkg + '.' + pkgObj.clsName, base, pkgObj.cls, pkgObj.type, pkgObj.isInterface, pkgObj.isProto, imports, pkgObj.mixins, pkgObj.attribs),
			fromQueue = $fromQueue || false,
			isValid = true, i, l;
		if(pkgObj.staticMethods)
			pkgObj.staticMethods(obj, imports());
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
				var cls = a5.GetNamespace(pkgObj.base, obj.imports());
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
				Contract:function(contract, method){
					return a5.core.contracts.createContract(contract, method);
				},
				MustExtend:function(){
					obj.prototype.constructor._a5_mixinMustExtend = arguments;
				},
				MustMix:function(){
					obj.prototype.constructor._a5_mixinMustMix = arguments;
				}
			}
			pkgObj.cls.call(obj._mixinDef, obj._mixinDef, obj.imports(), obj);
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
		if (!fromQueue) processQueue();
	},
	
	_a5_processImports = function(array, pkg, $isRebuild){
		return (function(array, pkg){
			var retObj = {},
				isRebuild = $isRebuild || false,
				rebuildArray = [],
				i, l,
			
			processObj = function(procObj){
				var obj;
				for (prop in procObj) {
					obj = procObj[prop];
					if ((typeof obj === 'function' || typeof obj === 'object') && retObj[prop] === undefined) retObj[prop] = obj;
				}
			};
			
			retObj.rebuild = function(){
				if (rebuildArray.length) {
					var returnObj = {}, 
						importObj = _a5_processImports(rebuildArray, null, true), 
						newObj = importObj.retObj, 
						newRebuildArray = importObj.rebuildArray;
					
					for (prop in retObj) 
						returnObj[prop] = retObj[prop];
					for (prop in newObj) 
						if (returnObj[prop] === undefined) 
							retObj[prop] = returnObj[prop] = newObj[prop];
					rebuildArray = newRebuildArray;
					return returnObj;
				} else
					return retObj;
			}
			if(pkg) 
				processObj(a5.GetNamespace(pkg, null, true));
			if (array) {
				var str, pkg, clsName;
				for (i = 0, l = array.length; i < l; i++) {
					str = array[i], isWC = false, dotIndex = str.lastIndexOf('.');
					if (str.charAt(str.length - 1) == '*') isWC = true;
					if (isWC) {
						pkg = a5.GetNamespace(str.substr(0, str.length - 2), null, true);
						if(pkg)
							processObj(pkg);
						else
							rebuildArray.push(str);
					} else {
						clsName = dotIndex > -1 ? str.substr(dotIndex + 1) : str;
						var obj = a5.GetNamespace(str, null, true);
						if (obj) {
							if (retObj[clsName] === undefined)
								retObj[clsName] = obj;
						} else
							rebuildArray.push(str);	
					}
				}
			}
			if(isRebuild)
				return {retObj:retObj, rebuildArray:rebuildArray};
			return retObj;
		})(array, pkg);
	},
	
	_a5_verifyPackageQueueEmpty = function(){
		if(packageQueue.length){
			var clsString = '', i, l;
			for(i = 0, l = packageQueue.length; i < l; i++)
				clsString += '"' + packageQueue[i].pkg.pkg + '.' + packageQueue[i].pkg.clsName + '", ' + packageQueue[i].reason  + ' class missing: "' + packageQueue[i].reasonNM + '"' + (packageQueue.length > 1 && i < packageQueue.length-1 ? ', \n':'');
			a5.ThrowError(206, null, {classPlural:packageQueue.length == 1 ? 'class':'classes', clsString:clsString});
		}
	},
	
	_a5_delayProtoCreation = function(value){
		delayProtoCreation = value;
	},
	
	_a5_createQueuedPrototypes = function(){
		for (var i = 0, l = queuedPrototypes.length; i < l; i++)
			processProtoClass(queuedPrototypes[i]);
		queuedPrototypes = [];
		for(i = 0, l = queuedImplementValidations.length; i<l; i++)
			a5.core.verifiers.validateImplementation(queuedImplementValidations[i].pkgObj, queuedImplementValidations[i].obj); 
		queuedImplementValidations = [];
	}
	
	return {
		Create:Create,
		Package:Package,
		_a5_processImports:_a5_processImports,
		_a5_processImports:_a5_processImports,
		_a5_verifyPackageQueueEmpty:_a5_verifyPackageQueueEmpty,
		_a5_delayProtoCreation:_a5_delayProtoCreation,
		_a5_createQueuedPrototypes:_a5_createQueuedPrototypes
	}
})

/**
* @name Create
* Instantiates a new instance of an object defined by {@link cl.Package}
* @type Object
* @param {Object} classRef
* @param {Object} args
*/
a5.Create = a5.core.classBuilder.Create;
/**
* @name Package
* @param {Object} pkg
*/
a5.Package = a5.core.classBuilder.Package;

a5._a5_processImports = a5.core.classBuilder._a5_processImports;
a5._a5_verifyPackageQueueEmpty = a5.core.classBuilder._a5_verifyPackageQueueEmpty;
a5._a5_delayProtoCreation = a5.core.classBuilder._a5_delayProtoCreation;
a5._a5_createQueuedPrototypes = a5.core.classBuilder._a5_createQueuedPrototypes;


/**
 * @name TopLevel
 * @namespace  
 */
a5.SetNamespace('a5.core.classProxyObj',{
	
	construct:{
		classPackage:function(getObj){ return getObj ? a5.GetNamespace(this._a5_pkg, null, true) : this._a5_pkg; },
		className:function(){ return this._a5_clsName; },
		namespace:function(){return this._a5_namespace; },
		imports:function(){ return this._a5_imports ? this._a5_imports():{}; },
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
		/**#@+
 		 * @memberOf TopLevel#
 		 * @function
	 	 */
		isA5:true,
		isA5ClassDef:function(){ return false },
		
		getStatic:function(){
			return this.constructor;
		},
		
		autoRelease:function(value){
			if(value !== undefined){
				var id = new Date().getTime(),
					self = this;
				this._a5_ar[id] = value;
				return function(){
					return self._a5_ar[id];
				}
			}
		},
		
		/**
		 * Returns a reference to the parent class of the object. Returns null if calling class is final parent.
		 * @name superclass
		 * @param {Object} scope
		 * @param {Object} args
		 */
		superclass:function(scope, args){ 
			return this.constructor.superclass(scope, args); 
		},	
		
		mixins:function(namespace){
			if (namespace !== undefined)
				return GetNamespace(namespace, this.imports());
			else
				return this.constructor._a5_mixedMethods;
		},
		
		mix:function(cls){
			a5.core.mixins.applyMixins(this, cls, this.imports(), this);
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
		classPackage:function(){ return this.constructor.classPackage(); },
		
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
				if ((this.namespace() === 'a5.cl.CL' || this.classPackage().indexOf('a5.cl.core') !== -1) && !this.classPackage() === 'a5.cl.core.viewDef') {
					a5.ThrowError(215, null, {nm:this.namespace()});
					return;
				}
				this._a5_initialized = false;
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
						if (nextRef && nextRef.dealloc !== descenderRef.dealloc) descenderRef.dealloc.call(this);
						descenderRef = nextRef;
					} else {
						descenderRef = null;
					}
				}
				if(this.constructor._a5_instance === this)
					this.constructor._a5_instance = null;
				for(prop in this._a5_ar)
					delete this._a5_ar[prop];
				for (prop in this) 
					if(({}).hasOwnProperty.call(this, prop) 
					&& typeof this.constructor.prototype[prop] === 'undefined' 
					&& prop !== '_a5_initialized'
					&& prop !== '_a5_instanceUID') 
						this[prop] = null;
			}
		},
		_a5_initialize: function(args){
			if (!this._a5_initialized) {
				if (this.constructor.isAbstract() && this._a5_initialize.caller.caller !== Extend)
					return a5.ThrowError(216, null, {nm:this.constructor.namespace()});
				this._a5_initialized = true;
				if (this.constructor.isSingleton() && this.constructor._a5_instance !== null)
					return a5.ThrowError(217, null, {nm:this.constructor.namespace()});	
				this._a5_instanceUID = this.namespace().replace(/\./g, '_') + '__' + this.constructor.instanceCount();
				if(this.instanceCount() === 0)
					this.constructor._a5_instance = this;
				this.constructor._instanceCount++;	
				this._a5_ar = {};				
				var self = this,
					descenderRef = this,
					_args = args || [],
					protoPropRef = [],
					cs, i, l, mixinRef;
				
				this._a5_privatePropsRef = {};
				if (typeof this.constructor._a5_instanceConst !== 'function')
					return a5.ThrowError(218, null, {clsName:this.className()});
				while (descenderRef !== null) {
					var dConst = descenderRef.constructor;
					if (dConst._a5_attribs)
						a5.core.attributes.applyClassAttribs(this, dConst._a5_attribs);
					if (dConst._a5_protoPrivateProps !== undefined) {
						this._a5_privatePropsRef[descenderRef.namespace()] = {};
						dConst._a5_protoPrivateProps.call(this._a5_privatePropsRef[descenderRef.namespace()]);
					}
					if(dConst._a5_protoProps !== undefined)
						protoPropRef.unshift(dConst._a5_protoProps);
						
					descenderRef = dConst.superclass && 
									dConst.superclass().constructor.namespace ? 
									dConst.superclass() : null;
				}
				a5.core.mixins.initializeMixins(this);
				for(i = 0, l = protoPropRef.length; i<l; i++)
					protoPropRef[i].call(this);
				this.constructor._a5_instanceConst.apply(this, _args);
				a5.core.mixins.mixinsReady(this);
				return true;
			} else
				return null; 
		},
		
		/**
		 * @name create
		 * @see a5.Create
		 */
		create:a5.Create,
		
		throwError: function(){
			return a5.ThrowError.apply(this, arguments);
		},

		
		/**
		 * @name assert
		 * @param {Object} exp
		 * @param {Object} err
		 */
		assert:function(exp, err){
			if (exp !== true)
				throw this.create(a5.AssertException, [err]);
		}
	}
	
	/**#@-*/
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
				testInst = new obj;
				testInst.Override = {};
				testInst.Final = {};
				testInst.Attributes = function(){
					var args = Array.prototype.slice.call(arguments);
					var func = args.pop();
					for(var i = 0, l = args.length; i<l; i++){
						var attr = args[i][0];
						if(attr === 'Contract' || attr === 'ContractAttribute' || attr === ar.ContractAttribute)
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
							return a5.ThrowError(400, null, {nm:mixinRef[i].namespace()});
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
			i, l, mixin;
			
		for (i = 0, l = mixins.length; i < l; i++) {
			mixin = a5.GetNamespace(mixins[i], typeof imports === 'function' ? imports() : imports);
			if(!mixin)
				return a5.ThrowError(404, null, {mixin:mixins[i]});
			mixinInsts.push(mixin);
			for (i = 0; i < sourceObj.constructor._mixinRef.length; i++)
				if (sourceObj.constructor._mixinRef[i] === mixin)
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

	.Prototype('Attribute', 'singleton', function(proto, im, Attribute){
		
		proto.Attribute = function(){
		}

})

a5.Package('a5')

	.Extends('Attribute')
	.Prototype('AspectAttribute', function(cls, im, AspectAttribute){
		
		AspectAttribute.RETURN_NULL = '_a5_aspectReturnsNull';
		AspectAttribute.SUCCESS = '_a5_aspectSuccess';
		AspectAttribute.ASYNC = '_a5_aspectAsync';
		AspectAttribute.FAILURE = '_a5_aspectFailure';
		AspectAttribute.NOT_IMPLEMENTED = '_a5_notImplemented';
		
		cls.AspectAttribute = function(){
			cls.superclass(this);
		}
		
		cls.before = function(){ return AspectAttribute.NOT_IMPLEMENTED; }
		
		cls.after = function(){ return AspectAttribute.NOT_IMPLEMENTED; }
		
		cls.around = function(){ return AspectAttribute.NOT_IMPLEMENTED; }
});



a5.Package('a5')

	.Extends('AspectAttribute')
	.Class('ContractAttribute', function(cls, im, ContractAttribute){
		
		cls.ContractAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.before = function(typeRules, args, scope, method, callback){
			var retObj = null,
				foundTestRule = false,
				processError = function(error){
					error.message = 'Contract type failure on method "' + method.getName() + '" ' + error.message;
					return error;
				}
				
			//TODO: validate structure of passed rules. 
			//checkIsValid for datatypes, default vals should still fail out via error
			if(typeRules.length > 1){
				for (i = 0, l = typeRules.length; i < l; i++) {
					retObj = runRuleCheck(typeRules[i], args);
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
				retObj = runRuleCheck(typeRules[0], args, true);
				if (retObj instanceof a5.ContractException) {
					cls.throwError(processError(retObj));
					return a5.AspectAttribute.FAILURE;
				}
			}
			if (!foundTestRule || retObj === false) {
				cls.throwError(processError(cls.create(a5.ContractException, ['no matching overload found'])));
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
					return cls.create(a5.ContractException, ['for argument ' + count + ', required values cannot be defined after optional values']);
			}
			if(type.indexOf('.') !== -1) kind = 'class';
			if(type === 'array') kind = 'array';
			if(type === 'object') kind = 'object';
			if(kind !== 'class') type = type.toLowerCase();
			if (arg === undefined) {
				if (foundOptionals) arg = discernDefault(type, kind, defaultVal, count);
				else return cls.create(a5.ContractException, ['for argument ' + count + ', missing required argument of type "' + type + '"']);
			}
	
			if (arg !== undefined && arg !== null) {
				switch (kind) {
					case 'class':
						clsDef = a5.GetNamespace(type);
						if(clsDef.isInterface()){
							if(!(arg.doesImplement(clsDef)))
								return cls.create(a5.ContractException, ['for argument ' + count + ', must implement interface ' + type]);
						} else {
							if (!(arg instanceof clsDef))
								return cls.create(a5.ContractException, ['for argument ' + count + ', must be an instance of type ' + type]);
						}
						break;
					case 'type':
						if(arg !== null && typeof arg !== type)
							return cls.create(a5.ContractException, ['for argument ' + count + ', must be of type ' + type]);
						break;
					case 'array':
						if (Object.prototype.toString.call(arg) !== '[object Array]')
							return cls.create(a5.ContractException, ['for argument ' + count + ', must be an array']);
						break;
					case 'object':
						if(arg._a5_initialized !== undefined || typeof arg !== 'object' || arg instanceof Array)
							return cls.create(a5.ContractException, ['for argument ' + count + ', must be a generic object']);
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
				return cls.create(a5.ContractException, ['for argument ' + count + ', invalid default value for data type "' + type + '"']);
			 else 
			 	return retVal;
		}

})

a5.Package('a5')

	.Extends('AspectAttribute')
	.Class('PropertyMutatorAttribute', function(cls){
		
		cls.PropertyMutatorAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.before = function(typeRules, args, scope, method, callback, callOriginator){
			if(args.length){
				var typeVal = typeRules[0].validate,
					isCls = false;
				if(typeVal){
					if (typeVal.indexOf('.') !== -1) {
						isCls = true;
						var typeVal = a5.GetNamespace(typeVal);
						if(!typeVal)
							return a5.AspectAttribute.FAILURE;
					}
					var isValid = isCls ? (args[0] instanceof typeVal) : (typeof args[0] === typeVal);
					if(!isValid)
						return a5.AspectAttribute.FAILURE;
				}
				scope[typeRules[0].property] = args[0];
				return a5.AspectAttribute.SUCCESS;
			}
			var retVal = scope[typeRules[0].property] || null;
			return retVal === null || retVal === undefined ? a5.AspectAttribute.RETURN_NULL : retVal;
		}	
		
		cls.Override.after = function(typeRules, args, scope, method, callback, callOriginator, preArgs){
			if (preArgs.length) 
				return scope;
			else 				
				return a5.AspectAttribute.SUCCESS;
		}
})


/**
 * @class 
 * @name a5.Event
 */
a5.Package('a5')

	.Static(function(Event){
		
		/**#@+
	 	 * @memberOf a5.Event
		 */
		
		/**
		 * @name DESTROYED
		 * @constant
		 */
		Event.DESTROYED = 'Destroyed';
		
		/**#@-*/
	})
	.Prototype('Event', function(proto){
		
		/**#@+
	 	 * @memberOf a5.Event#
	 	 * @function
		 */
		
		
		proto.Event = function($type, $bubbles, $data){
			this._a5_type = $type;
			this._a5_data = $data;
			this._a5_target = null;
			this._a5_currentTarget = null;
			this._a5_phase = 1;
			this._a5_bubbles = $bubbles !== false;
			this._a5_canceled = false;
			this._a5_cancelPending = false;
			this._a5_shouldRetain = false;
		}
		
		
		/**
		 * Cancels the propagation of the event. Once this method is called, any event listeners that have not yet processed this event instance will be ignored.
		 * #name cancel
		 * @param {Object} finishCurrentPhase If true, the event is allowed to finish dispatching in the current phase, but will be cancelled before the next phase begins.
		 */
		proto.cancel = function(finishCurrentPhase){
			if(finishCurrentPhase === true)
				this._a5_cancelPending = true;
			else
				this._a5_canceled = true;
		}
		
		/**
		 * The object that dispatched this event.
		 * @name target
		 * @return {Object} The object that dispatched this event.
		 */
		proto.target = function(){ return this._a5_target; };
		
		/**
		 * The object that is currently processing this event.
		 * @name currentTarget
		 * @return {Object} The object that is currently processing this event.
		 */
		proto.currentTarget = function(){ return this._a5_currentTarget; };
		
		/**
		 * The event type.
		 * @name type
		 * @return {String} The event type.
		 */
		proto.type = function(){ return this._a5_type; };
		
		/**
		 * @name data
		 * @return {Object}
		 */
		proto.data = function(){ return this._a5_data; };
		
		/**
		 * The phase this event is currently in. (a5.Event.CAPTURING, a5.Event.AT_TARGET, or a5.Event.BUBBLING)
		 * @name phase
		 * @return {Number} The phase this event is currently in.
		 */
		proto.phase = function(){ return this._a5_phase; };
		
		
		/**
		 * Whether this event should use the bubbling phase.  All events use capture and target phases.
		 * @name bubbles
		 */
		proto.bubbles = function(){ return this._a5_bubbles; };
		
		/**
		 * When shouldRetain is set to true, the event instance will not be destroyed after it has finished being dispatched.
		 * Thsi defaults to false, and it is highly recommended that you do NOT set this to true unless the same event is being
		 * dispatched on a timer, and the instance can be reused.
		 * 
		 * @name shouldRetain
		 * @param {Boolean} [value=false] If set to true, the event instance will not be destroyed after it has finished being dispatched.
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
		
		/**#@-*/
});

/**
 * @class 
 * @name a5.EventPhase
 */
a5.Package('a5')

	.Static('EventPhase', function(EventPhase){
		
		/**#@+
	 	 * @memberOf a5.EventPhase
		 */
		
		/**
		 * @name CAPTURING
		 * @constant
		 */
		EventPhase.CAPTURING = 1;
		
		/**
		 * @name AT_TARGET
		 * @constant
		 */
		EventPhase.AT_TARGET = 2;
		
		/**
		 * @name BUBBLING
		 * @constant
		 */
		EventPhase.BUBBLING = 3;
});


/**
 * @class 
 * @name a5.Error
 */
a5.Package('a5')

	.Extends(Error)
	.Prototype('Error', function(proto, im, Error){
		
		Error.FORCE_CAST_ERROR = '_a5_forceCastError';
		
		/**#@+
	 	 * @memberOf a5.Error#
	 	 * @function
		 */
		this.Properties(function(){
			this.stack = [];
			this.message = "";
			this._a5_isWindowError = false;
			this.name = this.type = this.className();
		})
		
		proto.Error = function(message, error) {
			if(error === false)
				this._a5_isWindowError = true;
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
			} else if(error !== false){
				try{ 
					__undefined__();
				} catch(e) {
					if (e.stack) {
						var hasAtHttp = e.stack.indexOf('@http') !== -1;
						this.stack = e.stack.split('\n');
						this.stack = this.stack.splice(4);
						if (hasAtHttp) 
							for (var i = 0; i < this.stack.length; i++)
								this.stack[i] = this.stack[i].substr(this.stack[i].indexOf('@http'));
					} else {
						var usedFuncs = [];
						try {
							var i = 0, context = this.init.caller.caller.caller;
							do {
								for (i = 0, l = usedFuncs.length; i < l; i++)
									if (usedFuncs[i] === context) context = null;
								if (context) {
									if(context.toString().indexOf(Error.FORCE_CAST_ERROR) === -1)
										this.stack.push(context.toString().replace(/;/g, ';<br/>').replace(/{/g, '{<br/>').replace(/}/g, '}<br/>') + '<br/><br/>');
									usedFuncs.push(context)
									context = context.caller;
									i++;
								}
							} while (context && i <= 50);
						} catch (e) {}
					}
				}
			}
		}
		
		proto.isWindowError = function(){
			return this._a5_isWindowError;
		}
		
		/**
		 * @name toString
		 */
		proto.Override.toString = function () {
		  return this.type + ': ' + this.message;
		}
})


/**
 * @class 
 * @name a5.AssertException
 * @extends a5.Error
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
 * @class 
 * @name a5.ContractException
 * @extends a5.Error
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
 * @class The EventDispatcher class defines a prototype object for handling listeners and dispatching events.
 * <br/><b>Abstract</b>
 * @name a5.EventDispatcher
 */
a5.Package("a5")

	.Prototype('EventDispatcher', 'abstract', function(proto){
		
		/**#@+
	 	 * @memberOf a5.EventDispatcher#
	 	 * @function
		 */
		
		this.Properties(function(){
			this._a5_autoPurge = false;
			this._a5_listeners = {};
		})
		
		proto.EventDispatcher = function(){
			
		}
		
		proto.autoPurge = function(value){
			if(typeof value === 'boolean'){
				this._a5_autoPurge = value;
				return this;
			}
			return this._a5_autoPurge;
		}
		
		/**
		 * Adds an event listener to the parent object.
		 * @name addEventListener
		 * @param {String} type The event type to be added.
		 * @param {Object} method The associated listener method to be added.
		 * @param {Boolean} [useCapture=false] If set to true, the listener will process the event in the capture phase.  Otherwise, it will process the event bubbling or target phase.
		 * @param {Boolean} [scope=null]
		 */
		proto.addEventListener = function(type, method, useCapture, scope){
			this._a5_addEventListener(type, method, useCapture, scope);
		}
		
		/**
		 * Adds an event listener to the parent object that fires only once, then is removed.
		 * @name addOneTimeEventListener
		 * @param {String} type The event type to be added.
		 * @param {Object} method The associated listener method to be added.
		 * @param {Boolean} [useCapture=false] If set to true, the listener will process the event in the capture phase.  Otherwise, it will process the event bubbling or target phase.
		 * @param {Boolean} [scope=null]
		 */
		proto.addOneTimeEventListener = function(type, method, useCapture, scope){
			this._a5_addEventListener(type, method, useCapture, scope, true);
		}
		
		/**
		 * @name hasEventListener
		 * @param {String} type
		 * @param {Object} [method]
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
		 * @name removeEventListener
		 * @param {String} type The event type to be removed.
		 * @param {Object} method The associated listener method to be removed.
		 * @param {Boolean} [useCapture=false] Whether the listener to remove is bound to the capture phase or the bubbling phase.
		 */
		proto.removeEventListener = function(type, method,  $useCapture, $scope, $isOneTime){
			var scope = $scope || null,
				types = type.split('|'),
				isOneTime = $isOneTime || false,
				useCapture = $useCapture === true,
				shouldPush = true,
				i, l, listArray, j, m;
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
						changeType: 'REMOVE'
					});
				}
			}
		}
		
		/**
		 * @name removeAllListeners
		 */
		proto.removeAllListeners = function(){
			if(this._a5_listeners)
				this._a5_listeners = {};
		}
		
		/**
		 * Returns the total number of listeners attached to the parent object.
		 * @name getTotalListeners
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
		 * @name dispatchEvent
		 * @param {String|a5.Event} event The event object to dispatch.  Or, if a string is passed, the 'type' parameter of the event to dispatch. 
		 */
		proto.dispatchEvent = function(event, data, bubbles){
			var e = this._a5_createEvent(event, data, bubbles);
			//target phase only
			e._a5_phase = a5.EventPhase.AT_TARGET;
			this._a5_dispatchEvent(e);
			if(!e.shouldRetain()) e.destroy();
			e = null;
		}
		
		/**
		 * Override this method to be notified of listener addition or removal.
		 * @name eListenersChange
		 * @param {Object} e The event object
		 * @param {String} e.type - The event type associated with the change.
		 * @param {Object} e.method - The listener method associated with the change.
		 * @param {String} e.changeType - Specifies what the type the change was, either 'ADD' or 'REMOVE'. 
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
					changeType: 'ADD'
				});
			} else
				throw 'invalid listener: type- ' + type + ', method- ' + method;
		}
		
		proto._a5_createEvent = function(event, data, bubbles){
			//if event was passed as a string, create a new Event object
			var e = (typeof event === 'string') ? a5.Create(a5.Event, [event, bubbles]) : event;
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
					i, l, thisListener, validPhase;
				if (typeArray) {
					for (i = 0, l = typeArray.length; i < l; i++) {
						thisListener = typeArray ? typeArray[i] : null;
						if (e._a5_canceled || !thisListener) return; //if the event has been canceled (or this object has been destroyed), stop executing
						validPhase = (e.phase() === a5.EventPhase.CAPTURING && thisListener.useCapture) || (e.phase() !== a5.EventPhase.CAPTURING && !thisListener.useCapture), validListener = typeof thisListener.method === 'function' && (thisListener.scope && thisListener.scope.namespace ? thisListener.scope._a5_initialized : true);
						if (validPhase && validListener) thisListener.method.call(thisListener.scope, e);
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
			this.dispatchEvent(a5.Create(a5.Event, [a5.Event.DESTROYED]));
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
	400:'invalid scope argument passed to superclass constructor on class "{nm}".',
	401:'Mixin "{nm}" requires owner class to mix "{cls}".',
	402:'Mixin "{nm}" already mixed into ancestor chain.',
	403:'Invalid mixin: Method "{method}" defined by more than one specified mixin.',
	404:'Invalid mixin: Mixin "{mixin}" does not exist.',
	
	//600: Contract
	601:'Invalid implementation of Contract on interace {intNM} in class {implNM} for method {method}.'
})



})(this);


/** @name a5.cl
 * @namespace Framework classes.
 */
a5.SetNamespace('a5.cl'); 

/**
 * @function
 * @type a5.cl.CL
 * @returns Shortcut to the instance of the A5 CL application.
 */
a5.cl.instance = function(){
	return a5.cl.CL.instance();
}

/**
 * @function
 * Initializes an instance of the A5 CL framework.
 * @param {Object|String} props
 * @param {String} [props.applicationPackage]
 * @param {String|a5.cl.CLApplication} [props.application]
 * @param {String} [props.rootController]
 * @param {String} [props.rootViewDef]
 * @param {String} [props.environment]
 * @param {String} [props.clientEnvironment]
 * @type Function
 * @returns A function that returns the singleton instance of the application framework.
 */
a5.cl.CreateApplication = function(props, callback){
	if (!a5.cl.instance()) {
		if(typeof props === 'function'){
			callback = props;
			props = undefined;
		}
		if(props === undefined)
			props = {};
		if(callback && typeof callback === 'function')
			a5.CreateCallback(callback);
		
		var initialized = false,

		onDomReady = function(){
			if (!props && a5.cl.CLMain._extenderRef.length === 0) {
				var str = 'CreateApplication requires at least one parameter:\n\na5.cl.CreateApplication("app"); or a class that extends a5.cl.CLMain.';
				a5.cl.core.Utils.generateSystemHTMLTemplate(500, str, true);
				throw str;
			} else {
				if (!initialized) {
					a5.Create(a5.cl.CL, [props])
					initialized = true;
					for(var i = 0, l = a5.cl._cl_createCallbacks.length; i<l; i++)
						a5.cl._cl_createCallbacks[i](a5.cl.instance());
					a5.cl._cl_createCallbacks = null;
				}
			}
		},
	
		domContentLoaded = function(){
			if (document.addEventListener) {
				document.removeEventListener( "DOMContentLoaded", domContentLoaded, false);
				onDomReady();
			} else if ( document.attachEvent ) {
				if ( document.readyState === "complete" ) {
					document.detachEvent("onreadystatechange", domContentLoaded);
					onDomReady();
				}
			}
		}
		
		if (document.readyState === "complete") {
			onDomReady();
		} else if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", domContentLoaded, false);
		} else if (document.attachEvent) {
			document.attachEvent("onreadystatechange", domContentLoaded);
		}
		return function(){
			return a5.cl.CL.instance();
		}
	} else {
		throw "Error: a5.cl.CreateApplication can only be called once.";
	}
}

a5.cl._cl_createCallbacks = [];

a5.cl.CreateCallback = function(callback){
	a5.cl._cl_createCallbacks.push(callback);
}




/**
 * @class Base class for all classes in the AirFrame CL MVC framework. 
 * <br/><b>Abstract</b>
 * @name a5.cl.CLBase
 * @extends a5.CLEventDispatcher
 */
a5.Package('a5.cl')

	.Extends('a5.EventDispatcher')
	.Prototype('CLBase', function(proto){
		
		/**#@+
	 	 * @memberOf a5.cl.CLBase#
	 	 * @function
		 */	
		this.Properties(function(){
			this._cl_mvcName = null;
		})
		
		proto.CLBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * @name cl
		 * @return
		 * @type a5.cl.MVC#
		 */
		proto.cl = function(){
			return a5.cl.instance();
		}
		
		/**
		 * Returns an instance of the class defined by the following parameters:
		 * @name getClassInstance
		 * @param {String} type One of 'Domain', 'Service', or 'Controller'
		 * @param {String} className The functional name of the class. For example, if you class is called 'FooController', the className value would be 'Foo'. 
		 */
		proto.getClassInstance = function(type, className){
			return this.cl()._core().instantiator().getClassInstance(type, className);
		}
		
		/**
		 * @name log
		 */
		proto.log = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.log.apply(this, arguments);
			else
				if ('console' in window) 
					console.log.apply(console, arguments);
		}
		
		proto.warn = function(value){
			var plgn = this.plugins().getRegisteredProcess('logger');
			if (plgn) 
				return plgn.warn.apply(this, arguments);
			else
				if ('console' in window) 
					console.warn.apply(console, arguments);
		}
		
		proto.Override.throwError = function(error){
			proto.superclass().throwError(error, a5.cl.CLError);
		}
		
		/**
		 * Returns the configuration object.
		 * @name config
		 */
		proto.config = function(){
			return this.cl().config();
		}
		
		/**
		 * @name plugins
		 */
		proto.plugins = function(){
			return this.cl().plugins();
		}
		
		/**
		 * Returns the appParams object as specified in the config object
		 * @name appParams
		 */
		proto.appParams = function(){
			return this.cl().appParams();
		}
});




a5.Package('a5.cl')

	.Extends('a5.Error')
	.Prototype('CLError', function(proto, im){
		
		proto.CLError = function(){
			proto.superclass(this, arguments);
			this.type = 'CLError';
		}
})



/**
 * @class Worker class instance, performs a task on a worker thread when available or in the browser thread when not.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLWorker
 * @extends a5.CLEventDispatcher
 */
a5.Package('a5.cl')
	
	.Extends('CLBase')
	.Prototype('CLWorker', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWorker#
	 	 * @function
		 */
		
		proto.CLWorker = function(isWorker){
			proto.superclass(this);
			if(this.isSingleton())
				this.throwError("Workers cannot be singletons.");
			this._cl_communicator = null;
			this._cl_JSON = a5.cl.core.JSON || JSON;
			this._cl_isWorker = (isWorker === '_cl_isWorkerInitializer');
			if (!this._cl_isWorker) 
				this.workerInit.apply(this, arguments);
		}
		
		proto.workerInit = function(){}
		
		proto.defineWorkerMethods = function(func){
			//call func, passing worker obj and data
		}		
		
		/**
		 * @name JSON
		 */
		proto.JSON = function(){
			return this._cl_JSON;
		}
		
		/**
		 * @name createWorker
		 * @param {Object} props
		 */
		proto.createWorker = function(data){
			if (!this._cl_isWorker) {
				data = data || {};
				var self = this,
				workerURL = this.config().workersPath,
				includes = this.config().workersIncludes,
				handleMessages = function(obj){
					if (obj.log) {
						self.log(obj.log);
					} else if (obj.error) {
						self.throwError(obj.error);
					} else {
						var method = null;
						try {
							method = self[obj.action];
						} catch (e) {
							throw 'a5.cl.CLWorkerOwner Error: invalid action ' + obj.action + ' on class ' + self.namespace();
						}
						if (method) method.apply(null, obj.id || []);
					}
				}
				if (workerURL && 'Worker' in window) {
					this._cl_communicator = new Worker(workerURL);
					this._cl_communicator.onmessage = function(e){
						handleMessages(self._cl_JSON.parse(e.data));
					}
				} else {
					var runInstance;
					this._cl_communicator = {
						postMessage: function(e){
							e = self._cl_JSON.parse(e);
							if (e.init) {
								runInstance = a5.Create(e.init, ['_cl_isWorkerInitializer']);
								runInstance._cl_setCommunicator({
									postMessage: function(obj){
										obj = self._cl_JSON.parse(obj);
										handleMessages(obj);
									}
								});
								runInstance.defineWorkerMethods(runInstance, data);
							} else if (e.destroy) {
								//Do nothing in main thread
							} else {
								runInstance[e.action].apply(self, e.id);
							}
						}
					}
				}
				this._cl_postMessage({
					init: this.namespace(),
					includes: includes,
					data: data
				});
			} else {
				self.throwError('Cannot call createWorker from worker methods.');
			}
		}
		
		/**
		 * @name callMethod
		 * @param {String} action
		 * @param {Array} [id]
		 */
		proto.callMethod = function(action, id){
			this._cl_postMessage({action:action, id:id});
		}
		
		/**
		 * @name log
		 * @param {String} value
		 */
		proto.Override.log = function(value){
			if(this._cl_isWorker)
				this._cl_postMessage({log:value});
			else 
				proto.superclass().log.apply(this, arguments);
		}
		
		/**
		 * @name throwError
		 * @param {Object|String} value
		 */
		proto.Override.throwError = function(error){
			//TODO: get stack from worker thread before passing along
			if(this._cl_isWorker)
				proto.throwError(error, false, this.throwError.caller.arguments);
			else
				proto.superclass().throwError.apply(this, arguments);
		}
		
		proto._cl_setCommunicator = function(communicator){
			if(this._cl_isWorker)
				this._cl_communicator = communicator;
		}
		
		proto._cl_postMessage = function(message){
			this._cl_communicator.postMessage(this._cl_JSON.stringify(message));
		}
		
		proto.dealloc = function(){
			if(!this._cl_isWorker)
				this.callMethod('destroy');
		}			
});


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


/**
 * @class 
 * @name a5.cl.CLEvent
 */
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
		 * @param {Array} parsedLinks
		 * @description Dispatched when the address bar hash changes
		 */
		CLEvent.HASH_CHANGE = 'hashChange';
		
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
		
		/**
		 * @event
		 * @description Dispatched when the render() method is called on a mappable controller.
		 * @param {a5.cl.CLController} controller
		 */
		CLEvent.RENDER_CONTROLLER = 'renderController';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLEvent.ADDED_TO_PARENT = 'addedToParent';
		
		/**
		 * @event
		 * @description Dispatched by CLViews when they are added to a parent view.  This event is useful for detecting when children are added to a specific branch of the view tree.
		 */
		CLEvent.REMOVED_FROM_PARENT = 'removedFromParent';
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
	.Interface('IDataStorage', function(IDataStorage){
		
		IDataStorage.isCapable = function(){};
		IDataStorage.storeValue = function(){};
		IDataStorage.getValue = function(){};
		IDataStorage.clearValue = function(){};
		IDataStorage.clearScopeValues = function(){};
		
});



a5.Package('a5.cl.interfaces')
	
	.Interface('IBindableReceiver', function(cls){
		
		cls.receiveBindData = function(){}
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
				dataStorage:null,
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
				self.throwError(self.create(a5.cl.CLError, ['Invalid call to MVC pluginConfig method: method must be called prior to plugin load.']));
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
	.Class("EnvManager", 'singleton final', function(self, im){
	
		var _supportsCanvas,
		_isOnline,
		_clientEnvironment,
		_clientPlatform,
		_clientOrientation,
		_browserVersion,
		_environment,
		_isBB,
		_isLocal,
		_appPath,
		_appRoot;
		
		this.environment = function(){		return _environment;}		
		this.clientPlatform = function(){	return _clientPlatform;	}
		this.clientOrientation = function(){return _clientOrientation;	}
		this.clientEnvironment = function(){return _clientEnvironment;	}
		this.browserVersion = function(){ return _browserVersion; }	
		this.isOnline = function(){	return _isOnline;}		
		this.isLocal = function(){ return _isLocal; }
		this.appPath = function(root){ return root ? _appRoot:_appPath; }	
		
		this.EnvManager = function($environment, $clientEnvironment){
			self.superclass(this);
			_isOnline = true;
			_supportsCanvas = !!document.createElement('canvas').getContext;
			_clientOrientation = getOrientation();
			if($clientEnvironment) _clientEnvironment = $clientEnvironment;
			else if(self.config().clientEnvironment)_clientEnvironment = self.config().clientEnvironment;
			else _clientEnvironment = testForClientEnvironment();
			testClientPlatform();
			testBrowserVersion();
			if($environment) _environment = $environment;
			else _environment = self.config().environment;
			var envObj = checkConfigProp(_environment, self.config().environments); 
			if(envObj) a5.cl.core.Utils.mergeObject(envObj, self.config(), true);
			var cEnvObj = checkConfigProp(_clientEnvironment, self.config().clientEnvironments);
			if(cEnvObj) a5.cl.core.Utils.mergeObject(cEnvObj, self.config(), true);
			_isLocal = window.location.protocol == 'file:';
			setAppPath();
		}
		
		this.initialize = function(){
			setupWindowEvents();
			try{
				 document.body.addEventListener('online', update);
				 document.body.addEventListener('offline', update);
			} catch(e){}
		}
		
		var update = function(){
			if(navigator.onLine !== undefined){
				var newVal = navigator.onLine;
				if(newVal != _isOnline){
					_isOnline = newVal;
					a5.cl.instance().dispatchEvent(im.CLEvent.ONLINE_STATUS_CHANGE, {online:self.isOnline()});
				}
			}
		}
	
		var testForClientEnvironment = function(){
			if('runtime' in window){
				return 'AIR';
			} else if('connection' in window && 'notification' in window && 'contacts' in window){
				return 'PHONEGAP';
			}else {
				var isMobile = mobileTest(),
				isTablet = isMobile && screen.width >= self.config().mobileWidthThreshold;
				_isBB = window.blackberry != undefined;
				if(_isBB) isMobile = true;
				if(isTablet) return 'TABLET';
				else if (isMobile) return 'MOBILE';
				else return 'DESKTOP';	
			}	
		}
		
		var mobileTest = function(){
			if(window.orientation !== undefined)
				return true;
			var propArray = ['ontouchstart'];
			var elem = document.createElement('div');
			for (var i = 0, l = propArray.length; i<l; i++){
				elem.setAttribute(propArray[i], 'return;');
				if(typeof elem[propArray[i]] === 'function')
					return true;
			}
			elem = null;
			if(navigator.userAgent.toLowerCase().match(/mobile/i))
				return true;
			return false;
		}
		
		var testClientPlatform = function(){
			if(_isBB){
				if(_supportsCanvas) _clientPlatform = 'BB6';
				else _clientPlatform = 'BB';
			} else {
				if(navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)) _clientPlatform = 'IOS';
				else if(navigator.userAgent.match(/Android/i)) _clientPlatform = 'ANDROID';
				else if(navigator.userAgent.match(/IEMobile/i)) _clientPlatform = 'WP7';
				else if(window.ActiveXObject) _clientPlatform = 'IE';
				// _clientPlatform = 'OSX';
			}
			if(!_clientPlatform) _clientPlatform = 'UNKNOWN';
		}
		
		var getOrientation = function(){
			if(typeof window.orientation !== 'undefined')
				return (window.orientation == 0 || window.orientation === 180) ? 'PORTRAIT' : 'LANDSCAPE';
			else
				return 'UNKNOWN';
		}
		
		var checkConfigProp = function(checkProp, obj){
			var foundProps = [], prop, propArray, isPositiveCase, envProp, i, l, canPush, isValidForNeg, retProp = null;
			for(prop in obj){
				isPositiveCase = true;
				envProp = prop;
				if (envProp.charAt(0) === '_') {
					isPositiveCase = false;
					envProp = envProp.substr(1);
				}
				propArray = envProp.split('_');
				canPush = false;
				isValidForNeg = true;
				for(i = 0, l=propArray.length; i<l; i++){
					if(isPositiveCase){
						 if (propArray[i] === checkProp) {
						 	canPush = true;
							break;
						 }
					} else {
						if(propArray[i] === checkProp)
							isValidForNeg = false;
							break;
					}
				}
				if((isPositiveCase && canPush) ||
				   (!isPositiveCase && isValidForNeg))
						foundProps.push(obj[prop]);
			}
			if(foundProps.length)
				retProp = foundProps[0];
			if(foundProps.length >1)
				for(i = 1, l=foundProps.length; i<l; i++)
					a5.cl.core.Utils.mergeObject(foundProps[i], retProp, true);
			return retProp;
		}
		
		var testBrowserVersion = function(){
			_browserVersion = 0;
			if (document.body.style.scrollbar3dLightColor!=undefined) {
				if (document.body.style.opacity!=undefined) { _browserVersion = 9; }
				else if (!self.config().forceIE7 && document.body.style.msBlockProgression!=undefined) { _browserVersion = 8; }
				else if (document.body.style.msInterpolationMode!=undefined) { _browserVersion = 7; }
				else if (document.body.style.textOverflow!=undefined) { _browserVersion = 6; }
				else {_browserVersion = 5.5; }
			}
		}
		
		var setAppPath = function(){
			var pathname = window.location.pathname;
			if(pathname.indexOf('.') != -1) pathname = pathname.substr(0, pathname.lastIndexOf('/') + 1);
			_appRoot = window.location.protocol + '//' + window.location.host;
			_appPath = _appRoot + pathname;
			if(_appPath.charAt(_appPath.length-1) != '/') _appPath += '/';
		}
		
		var setupWindowEvents = function(){
			window.onbeforeunload = function(){
				/* need close interceptor in mvc
				var val = self.cl().application().applicationWillClose();
				if (typeof val == 'string') return val;
				*/
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_CLOSE);
			}
			window.onunload = function(){
				self.cl().dispatchEvent(im.CLEvent.APPLICATION_CLOSED);
			}
			if (self.config().trapErrors === true){
				window.onerror = function(e, url, line){
					e = e || window.error;
					if(e === 'Script error.')
						e = "Cannot discern error data from window.onerror - Possible cause is loading A5 from a cross domain source.\nTry disabling trapErrors to use the console or load a local copy of A5.";
					var clErr = a5._a5_getThrownError();
					if(clErr && e !== "" && e.indexOf(clErr.toString()) !== -1)
						e = clErr;
					else
						e = a5.Create(a5.Error, [e, false]);
					if(url) e.url = url;
					if(line) e.line = line;
					self.dispatchEvent(im.CLEvent.ERROR_THROWN, e);			
					return true;
				};
			}
			var orientationEvent = ("onorientationchange" in window) ? "onorientationchange" : "onresize";
			window[orientationEvent] = function() {
				self.cl().dispatchEvent(im.CLEvent.WINDOW_RESIZED);
			    var newOrientation = getOrientation();
				if(newOrientation !== _clientOrientation){
					_clientOrientation = newOrientation;
					if (_clientEnvironment === 'MOBILE' || _clientEnvironment === 'TABLET')
						self.cl().dispatchEvent(im.CLEvent.ORIENTATION_CHANGED);
				}
			}
			if (orientationEvent !== 'onresize') {
				window.onresize = function(){
					self.cl().dispatchEvent(im.CLEvent.WINDOW_RESIZED);
				}
			}
		}
		
})


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
				clsInstance = (cls._a5_instance === null) ? this.create(cls) : cls.instance();
				clsInstance._cl_setMVCName(clsName);
				return clsInstance;
			} else {
				return null;
			}
		}
		
		this.instantiateConfiguration = function(){
			var retObj = a5.cl.CLMain._cl_storedCfgs.config;
			var plgnArray = a5.cl.CLMain._cl_storedCfgs.pluginConfigs;
			for (var i = 0; i < plgnArray.length; i++) {
				var obj = {};
				var split = plgnArray[i].nm.split('.'),
					lastObj = obj;
				for(var j = 0; j< split.length; j++)
					lastObj = lastObj[split[j]] = j == split.length-1 ? plgnArray[i].obj:{};
				retObj.plugins = a5.cl.core.Utils.mergeObject(retObj.plugins, obj)
			}
			return retObj;
		}
		
		this.beginInstantiation = function(){
			for(var i = 0, l=namespaceArray.length; i<l; i++){
				var liveNamespace = a5.GetNamespace(applicationPackage + '.' + namespaceArray[i][0], null, true);
				if(liveNamespace && typeof liveNamespace == 'object'){
					for (var prop in liveNamespace) 
						if (typeof liveNamespace[prop] === 'function') {
							var instance = self.create(liveNamespace[prop]);
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
		
		this.createConfig = function(userConfig){
			return userConfig ? a5.cl.core.Utils.mergeObject(userConfig, a5.cl.CLConfig):a5.cl.CLConfig;
		}
		
		var getClassNamespace = function(type, clsName){							   
			return a5.GetNamespace(applicationPackage + '.' + type.toLowerCase() + 's.' + clsName + (type == 'domain' ? '':(type.substr(0, 1).toUpperCase() + type.substr(1))));
		}
})


/**
 * @class Sets properties for the application.
 * @name a5.cl.CLConfig
 */
a5.SetNamespace("a5.cl.CLConfig", {	
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#allowUntestedPlugins
	 * @default false
	 */
	allowUntestedPlugins:false,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#appName
	 * @default an empty string
	 */
	appName:'',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#applicationPackage
	 * @default an empty string
	 */
	applicationPackage:'',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#applicationViewPath
	 * @default 'views/'
	 */
	applicationViewPath:'views/',
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#cacheEnabled
	 * @default true
	 */
	cacheEnabled:true,
	
	/**
	 * @field
	 * @type Array
	 * @name a5.cl.CLConfig#cacheTypes
	 */
	cacheTypes:[],
	
	/**
	 * @field
	 * @type  String
	 * @name a5.cl.CLConfig#clientEnvironment
	 * @see a5.cl.MVC#clientEnvironment
	 * @default null
	 */
	clientEnvironment:null,
	
	/**
	 * @field
	 * @type  Object 
	 * @name a5.cl.CLConfig#clientEnvironments
	 * @default an empty object
	 */
	clientEnvironments: {},
	
	/**
	 * Specifies whether browser dimension changes are allowed to trigger redraws to different client environment settings. 
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#environmentOverrides
	 * @default false
	 */
	clientEnvironmentOverrides:false,
	
	/**
	 * Specifies a default view container target for render calls. Defaults to the root window of the application. 
	 * @field
	 * @type a5.cl.CLViewContainer
	 * @name a5.cl.CLConfig#defaultRenderTarget
	 * @default null
	 */
	defaultRenderTarget:null,
	
	/**
	 * @field
	 * @type  Array 
	 * @name a5.cl.CLConfig#dependencies
	 * @default an empty array
	 */
	dependencies: [],
	
	/**
	 * @field
	 * @type  String
	 * @name a5.cl.CLConfig#environment
	 * @see a5.cl.MVC#environment
	 * @default 'DEVELOPMENT'
	 */
	environment:'DEVELOPMENT',
	
	/**
	 * @field
	 * @type  Object 
	 * @name a5.cl.CLConfig#environments
	 * @default an empty object
	 */
	environments: {},
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#faviconPath
	 * @default an empty string
	 */
	faviconPath:'',
	
	/**
	 * @field
	 * @type  Boolean 
	 * @name a5.cl.CLConfig#forceIE7
	 * @default true
	 */
	forceIE7:true,
	
	/**
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#globalUpdateTimerInterval
	 * @default 10
	 */
	globalUpdateTimerInterval:10,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#hashDelimiter
	 * @default '#!'
	 */
	hashDelimiter:'#!',
	
	/**
	 * Specifies a browser width value for triggering mobile vs desktop (or tablet) rendering. 
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#mobileWidthThreshold
	 * @default 768
	 */
	mobileWidthThreshold:768,
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#persistORMData
	 * @default false
	 */
	persistORMData:false,

	plugins:{},
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#requestDefaultContentType
	 * @default 'application/json'
	 */
	requestDefaultContentType:'application/json',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#requestDefaultMethod
	 * @default 'POST'
	 */
	requestDefaultMethod:'POST',
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#rootController
	 * @default null
	 */
	rootController:null,
	
	/**
	 * @field
	 * @type  XML 
	 * @name a5.cl.CLConfig#rootViewDef
	 * @default null
	 */
	rootViewDef:null,
	
	/**
	 * @field
	 * @type  String 
	 * @name a5.cl.CLConfig#rootWindow
	 * @default null
	 */
	rootWindow:null,
	
	/**
	 * @field
	 * @type Number
	 * @name a5.cl.CLConfig#schemaBuild
	 * @default 0
	 */
	schemaBuild:0,
	
	/**
	 * If true, the ASYNC_START and ASYNC_COMPLETE events will not be dispatched by includes.
	 * @field
	 * @type Boolean,
	 * @name a5.cl.CLConfig#silentIncludes
	 * @default false
	 */
	silentIncludes:false,
	
	staggerDependencies:true,
	/**
	 * Specifies the character delimiter to use when setting the address bar with an append value.
	 * @field
	 * @type String
	 * @name a5.cl.CLConfig#titleDelimiter
	 * @default ': '
	 */
	titleDelimiter:': ',
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#trapErrors
	 * @default false
	 */
	trapErrors:false,
	
	/**
	 * @field
	 * @type  Array 
	 * @name a5.cl.CLConfig#viewDependencies
	 * @default an empty array
	 */
	viewDependencies:[],
	
	/**
	 * @field
	 * @type String
	 * @name a5.cl.CLConfig#workersPath
	 * @default null
	 */
	workersPath:null,
	
	/**
	 * @field
	 * @type Array
	 * @name a5.cl.CLConfig#workersIncludes
	 * @default an empty array
	 */
	workersIncludes:[],
	
	/**
	 * @field
	 * @type Boolean
	 * @name a5.cl.CLConfig#xhrDependencies
	 * @default false
	 */
	xhrDependencies:false
});



a5.Package('a5.cl.core')
	.Static('Utils', function(Utils){
		Utils.vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
		Utils.jsVendorPrefixes = ['Webkit', 'Moz', 'ms', 'o'];
		Utils.jsVendorMethodPrefixes = ['webkit', 'moz', 'ms', 'o'];
		
		Utils.purgeBody = function(){
			var body = document.getElementsByTagName('body')[0];
			body.innerHTML = '';
			body.style.margin = '0px';
		}
		
		Utils.trim = function(str){
			if(!str) return str;
			return str.replace(/(^\s+)|(\s+$)/g, "").replace(/\s{2,}/, " ");
		}
		
		Utils.getParameterByName = function(name){
		    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
		    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
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
		    var c = obj instanceof Array ? [] : {};
		    for (var i in obj) {
		        var prop = obj[i];
		        if (typeof prop == 'object') {
		           if (prop instanceof Array) {
		               c[i] = [];
		               for (var j = 0, l=prop.length; j < l; j++) {
		                   if (typeof prop[j] != 'object') c[i].push(prop[j]);
		                   else c[i].push(obj[prop[j]]);
		               }
		           } else {
		               c[i] = obj[prop];
		           }
		        } else {
		           c[i] = prop;
		        }
		    }
		    return c;
		}
		
		Utils.initialCap = function(str){
			return str.substr(0, 1).toUpperCase() + str.substr(1);
		}
		
		Utils.isAbsolutePath = function(url){
			return (url.indexOf('://') !== -1 || url.substr(0, 1) == '/');
		}
		
		Utils.makeAbsolutePath = function(url){
			return a5.cl.core.Utils.isAbsolutePath(url) ? (url.substr(0, 1) == '/' ? a5.cl.instance().appPath(true) + url:url):(a5.cl.instance().appPath() + url);
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
		
		Utils.generateSystemHTMLTemplate = function(type, str, replBody){
			var retHtml = '<div style="margin:0px auto;text-align:center;font-family:Arial;"><h1>A5 CL: ' + type + ' Error</h1>\
				<div style="text-align:left;margin-bottom:50px;">' + str + '</div></div>';
			if (replBody) {
				var body = document.getElementsByTagName('body')[0];
				if(body) body.innerHTML = retHtml;
				else throw str;
			}
			return retHtml;
		}
		
		Utils.addEventListener = function(target, type, listener, useCapture){
			var type = type.indexOf('on') === 0 ? type.substr(2) : type,
				useCapture = useCapture || false;
			if(typeof target.addEventListener === 'function')
				target.addEventListener(type, listener, useCapture);
			else
				target.attachEvent('on' + type, listener);
		}
		
		Utils.removeEventListener = function(target, type, listener, useCapture){
			var type = type.indexOf('on') === 0 ? type.substr(2) : type;
			if(typeof target.addEventListener === 'function')
				target.removeEventListener(type, listener, useCapture);
			else
				target.detachEvent('on' + type, listener);
		}
		
		Utils.getVendorWindowMethod = function(type){
			var retVal = null,
				i, l, thisProp,
				regex = /-/g;
			while(regex.test(type)){
				type = type.substring(0, regex.lastIndex - 1) + type.substr(regex.lastIndex, 1).toUpperCase() + type.substr(regex.lastIndex + 1);
				regex.lastIndex = 0;
			}
		    for (i = 0, l = Utils.jsVendorMethodPrefixes.length; i <= l; i++) {
				thisProp = i === l ? type : (Utils.jsVendorMethodPrefixes[i] + type.substr(0, 1).toUpperCase() + type.substr(1));
				if(typeof window[thisProp] === "function"){
					retVal = window[thisProp];
					break;
				}
			}
			return retVal;
		}
		
		Utils.getCSSProp = function(type){
			var elem = document.createElement('div'),
				retVal = null,
				i, l, thisProp,
				regex = /-/g;
			while(regex.test(type)){
				type = type.substring(0, regex.lastIndex - 1) + type.substr(regex.lastIndex, 1).toUpperCase() + type.substr(regex.lastIndex + 1);
				regex.lastIndex = 0;
			}
		    for (i = 0, l = Utils.jsVendorPrefixes.length; i <= l; i++) {
				thisProp = i === l ? type : (Utils.jsVendorPrefixes[i] + type.substr(0, 1).toUpperCase() + type.substr(1));
				if(retVal === null && typeof elem.style[thisProp] === "string"){
					retVal = thisProp;
					break;
				}
			}
			//a5.cl.core.GarbageCollector.instance().destroyElement(elem);
			elem = null;
			return retVal;
		}
		
		/**
		 * Get the vendor-specific value for a CSS property.  For example, display:box should become something like display:-moz-box.
		 * @param {Object} prop The CSS property to use.
		 * @param {Object} value The standards-compliant value. (without a vendor prefix)
		 */
		Utils.getVendorCSSValue = function(prop, value){
			var elem = document.createElement('div'),
				returnVal = value,
				x, y, prefixedValue;
			for(x = 0, y = Utils.vendorPrefixes.length; x <= y; x++){
				prefixedValue = (x === 0 ? '' : Utils.vendorPrefixes[x - 1]) + value;
				elem.style[prop] = prefixedValue;
				if (elem.style[prop] === prefixedValue) {
					returnVal =  prefixedValue;
					break;
				}
			}
			//a5.cl.core.GarbageCollector.instance().destroyElement(elem);
			elem = null;
			return returnVal;
		}
		
		Utils.setVendorCSS = function(elem, prop, value, prefixValue){
			prefixValue = prefixValue === true; 
			elem.style.setProperty(prop, value, null);
			for(var x = 0, y = Utils.vendorPrefixes.length; x < y; x++){
				elem.style.setProperty((prefixValue ? '' : Utils.vendorPrefixes[x]) + prop, (prefixValue ? Utils.vendorPrefixes[x] : '') + value, null);
			}
		}
		
		Utils.testVersion = function(val, isMax){
			var parseVersionString = function(val) {
			    val = val.split('.');
			    return {
			        major: parseInt(val[0]) || 0,
			        minor: parseInt(val[1]) || 0,
			        build: parseInt(val[2]) || 0
			    }
			}
			
			isMax = isMax || false;
			var versionVal = parseVersionString(a5.version()),
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
		
		Utils.elementInDocument = function(elem){
			while(elem){
				if(elem === document)
					return true;
				elem = elem.parentNode;
			}
			return false;
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
			reqCount;
	
		this.RequestManager = function(){
			self.superclass(this, arguments);
			reqArray = [];
			reqCount = 0;
			defaultContentType = self.config().requestDefaultContentType;
			defaultMethod = self.config().requestDefaultMethod;
		}
		
		this.asyncRunning = function(){
			return asyncRunning;
		}

		this.processItem = function(props, reqID){
			var req;
			try {	
				var reqComplete = function($req){
					var req = this;
					if (req.readyState == 4) {
						var response,
						retData,
						status = req.status;
						if (status !== 500) {
							if (props.isJson) {
								response = req.responseText;
								
								if (a5.cl.core.Utils.trim(response) !== "") {
									try {
										response = a5.cl.core.JSON.parse(response);
										retData = (props.dataProp && props.dataProp !== undefined) ? response[props.dataProp] : response;
									} catch (e) {
										status = 500;
										retData = "Error parsing JSON response from url: " + props.url + "\nresponse: " + response;
									}
								}
							} else if (props.isXML && req.responseXML) {
								response = req.responseXML;
							} else {
								response = req.responseText;
							}
							if (retData === undefined) 
								retData = response;
						}
						if (status == 200 || (status == 0)) {
							self.success(reqID, retData);
						} else {
							self.onError(reqID, status, retData || req.responseText);
						}
						self.reqComplete(reqID);
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
							data = a5.cl.core.JSON.stringify(data);
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
					if (props.charSet) req.setRequestHeader("charset", props.charSet);
					req.send(data);
				} else {
					if (props.error) props.error('client does not support XMLHTTPRequests');
				}
			} catch (e) {
				req = null;
				self.throwError(e);
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
			var wasSilent = isSilent();
			unqueueItem(id);
			if ((reqArray.length === 0 || isSilent()) && !wasSilent) {
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
				else this.throwError(errorObj);
			}
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


a5.Package('a5.cl.core')

	.Extends('a5.cl.CLBase')
	.Class('ManifestManager', 'singleton final', function(self){
	
		var _isOfflineCapable,
		appCache,
		_manifestBuild = null,
		manifestHref;
		
		this.ManifestManager = function(){
			self.superclass(this);
			manifestHref = document.getElementsByTagName('html')[0].getAttribute('manifest');
			appCache = window.applicationCache;
			_isOfflineCapable = appCache && manifestHref ? true:false;
			if(_isOfflineCapable) 
				initialize();
		}
		
		this.manifestBuild = function(){	return _manifestBuild; }
		this.isOfflineCapable = function(){	return _isOfflineCapable;}
		
		this.purgeApplicationCache = function($restartOnComplete){
			var restartOnComplete = ($restartOnComplete == false ? false:true);
			var updateReady = function(){
				appCache.swapCache();
				if(restartOnComplete) 
					self.cl().relaunch(true);
			}
			if (appCache.status == 1) {
				appCache.addEventListener('updateready', updateReady, false);
				appCache.update();
			} else {
				throw 'Cannot purge application cache, appCache status is ' + appCache.status;
			}
		}
		
		var initialize = function(){
			checkManifestBuild(manifestHref);
			appCache.addEventListener('error', onerror, false);
		}
		
		var checkManifestBuild = function(manifestHref){
			var resourceCache = a5.cl.core.ResourceCache.instance(), 
			result;
			self.cl().include(manifestHref, function(data){
				result = data.match(/#build\b.[0-9]*/);
				if(result){
					result = result[0];
					result = result.split('#build')[1];
					result = parseInt(a5.cl.core.Utils.trim(result));
					if(!isNaN(result)) _manifestBuild = result;
				}
			})
		}
		
		var onerror = function(e){
			self.redirect(500, 'Error loading manifest');
		}
})



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
			a5.cl.instance().redirect(500, 'JSON stringify error.');
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
		a5.cl.instance().redirect(500, new SyntaxError('JSON.parse'));
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
			_capable,
			_hadCacheAtLaunch,
			cacheKeys;
		
		this.DataCache = function(){
			self.superclass(this); 
			_enabled = a5.cl.instance().config().cacheEnabled;
			_capable = window.localStorage != undefined;
			_hadCacheAtLaunch = (this.isAvailable() && localStorage.length) ? true:false;
			cacheKeys = [];
		}
		
		this.isAvailable = function(){
			var plugin = getDataPlugin();
			if(plugin)
				_capable = plugin.isCapable.call(plugin);
			return _enabled && _capable;
		}
		
		this.cacheExists = function(){
			if(this.isAvailable()) return _hadCacheAtLaunch;
			else return false;
		}
		
		this.storeValue = function(key, value){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.storeValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				var stringVal = a5.cl.core.JSON.stringify(value),
				value = localStorage.setItem(key, stringVal);
				return value;
			} else {
				return false;
			}
		}
		
		this.getValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.getValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					var retValue = localStorage.getItem(key);
					return a5.cl.core.JSON.parse(retValue);
				} catch (e) {
					return null;
				}
			} else {
				return null;
			}
		}
		
		this.clearValue = function(key){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearValue.apply(plugin, arguments);
			
			if (self.isAvailable() && checkCacheKey(key)) {
				try {
					return localStorage.removeItem(key);
				} 
				catch (e) {
					return false;
				}
			} else {
				return false;
			}
		}
		
		this.clearScopeValues = function(scope, $exceptions){
			var plugin = getDataPlugin();
			if(plugin)
				return plugin.clearScopeValues.apply(plugin, arguments);
			
			var exceptions = $exceptions || [], i, j;
			for(var i = 0, l=localStorage.length; i<l; i++){
				var key =localStorage.key(i);
				if (key.indexOf(scope) == 0) {
					var cacheItemName = key.split(scope)[1].substr(1),
					isExcepted = false;
					for (j = 0, m=exceptions.length; j < m; j++) {
						if(cacheItemName == exceptions[j]) isExcepted = true;
					}
					if(!isExcepted){
						localStorage.removeItem(key);
						i--;
						l=localStorage.length;
					}
				}
			}
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
		
		var getDataPlugin = function(){
			return self.plugins().getRegisteredProcess('dataStorage');
		}
	
	
});


a5.Package('a5.cl.core')
	.Extends('a5.cl.CLBase')
	.Mix('a5.cl.mixins.DataStore')
	.Static(function(ResourceCache){
		
		ResourceCache.BROWSER_CACHED_ENTRY = 'clResourceCacheBrowserCacheEntry';
		
		ResourceCache.COMBINED_DEPENDENCY = 'clResourceCacheCombinedDependcy';
		
		ResourceCache._cl_delimiterOpen = '<!--CL:';
		ResourceCache._cl_delimiterClose = ':CL-->';
	})
	.Class('ResourceCache', 'singleton final', function(self, im, ResourceCache){
			
		var resources,
			dataCache,
			shouldUseCache,
			requestManager,
			cacheTypes = [
				{type:'html', extension:'html'},
				{type:'html', extension:'htm'},
				{type:'js', extension:'js'},
				{type:'image', extension:'jpg'},
				{type:'image', extension:'gif'},
				{type:'image', extension:'png'},
				{type:'css', extension:'css'},
				{type:'xml', extension:'xml'}
			];
		
		
		this.ResourceCache = function(){
			this.superclass(this);
			requestManager = a5.cl.core.RequestManager.instance();
			cacheTypes = cacheTypes.concat(this.config().cacheTypes);
			resources = {};
		}
		
		this.initStorageRules = function(){
			var manifestBuild = this.cl().manifestBuild(),
				storedBuild = this.getValue('build') || -1;
			shouldUseCache = (this.cl().isOfflineCapable() && this.cl().environment() === 'PRODUCTION');
			if(manifestBuild && manifestBuild > storedBuild) this.clearScopeValues();
			if(shouldUseCache) this.storeValue('build', manifestBuild);
			else this.clearScopeValues();
		}
		
		this.include = function(value, callback, itemCallback, onerror, asXHR){
			var urlArray = [],
			retValue,
			loadCount = 0,
			totalItems, 
			percentPer, 
			asXHR = asXHR || false,
			elem;
			if (typeof value == 'string') {
				urlArray.push(value);
				retValue = null;
			} else {
				urlArray = value;
				retValue = [];
			}
			a5._a5_delayProtoCreation(true);
			totalItems = urlArray.length;
			percentPer = 100 / totalItems;
			if (self.config().staggerDependencies || self.config().xhrDependencies || asXHR) {	
				fetchURL(urlArray[loadCount]);
			} else {
				for(var i = 0, l = urlArray.length; i<l; i++)
					fetchURL(urlArray[i]);
			}
			
			function fetchURL(urlObj){
				var url = null;
				var type = null;
				if (urlObj != undefined) {
					if (typeof urlObj == 'string') {
						url = urlObj;
						type = discernType(url);
					} else {
						url = urlObj[0];
						type = urlObj[1];
					}
				}
				
				function completeLoad(retValue){
					a5._a5_createQueuedPrototypes();
					a5._a5_verifyPackageQueueEmpty();
					a5._a5_delayProtoCreation(false);
					if (callback) 
						callback(retValue);
				}
				
				function continueLoad(data){
					loadCount++;
					var percent = Math.floor((loadCount / totalItems) * 100);
					if (itemCallback) itemCallback({
						loadCount: loadCount,
						totalItems: totalItems,
						data:data,
						itemURL: url,
						itemType: type,
						percent: percent
					});
					if(totalItems == 1) retValue = data;
					else retValue.push(data);
					if (self.config().staggerDependencies || self.config().xhrDependencies || asXHR) {
						if (loadCount == totalItems) {
							completeLoad(retValue);
						} else {
							fetchURL(urlArray[loadCount]);
						}
					} else {
						if (loadCount === urlArray.length) {
							completeLoad(retValue);
						}
					}
				}
				var cacheValue = checkCache(url);
				if (!cacheValue) {
					if (type) {
						url = a5.cl.core.Utils.makeAbsolutePath(checkReplacements(url));
						if (type === 'css') {
							var cssError = function(){
								if (onerror) onerror(url);
								else self.throwError('Error loading css resource at url ' + url);
							},
							headID = document.getElementsByTagName("head")[0],
							elem = document.createElement('link');
							elem.onerror = cssError;
							elem.href =  url;
							elem.rel = 'stylesheet';
							elem.media = 'screen';
							headID.appendChild(elem);
							updateCache(url, type, ResourceCache.BROWSER_CACHED_ENTRY);
							continueLoad();
							elem = headID = null;
						} else if (type === 'image'){
							var imgObj = new Image(),
							clearImage = function(){
								a5.cl.mvc.core.GarbageCollector.instance().destroyElement(imgObj);
								imgObj = null;
								updateCache(url, type, ResourceCache.BROWSER_CACHED_ENTRY);
								continueLoad();
							},
							imgError = function(){
								if (onerror) onerror(url);
								else self.redirect(500, 'Error loading image resource at url ' + url);
							};
												
							imgObj.onload = clearImage;
							imgObj.onerror = imgError;
							imgObj.src = data;
						} else if (type === 'js' && self.config().xhrDependencies === false && asXHR == false){
							var insertElem = function(){
								head.insertBefore(include, head.firstChild);
							}
							var head = document.getElementsByTagName("head")[0], include = document.createElement("script");
							include.type = "text/javascript";		
							include.src = url;
							if(include.readyState){
								include.onreadystatechange = function(){
									if (this.readyState == 'loaded' || this.readyState == 'complete') continueLoad();
								}
							} else {
								include.onload = continueLoad;
							}
							insertElem();
						} else {
							var reqObj = {
								url: url,
								method: 'GET',
								contentType: 'text/plain',
								success: function(data){
									data = updateCache(url, type, data);
									processData(url, data, type, function(){
										continueLoad(data);
									});
								},
								error: function(){
									if (onerror) onerror(url);
									else self.redirect(500, 'Error loading resource at url ' + url);
								}
							}
							if (typeof itemCallback === 'function') {
								reqObj.progress = function(e){
									itemCallback({
										loadCount: loadCount,
										totalItems: totalItems,
										itemURL: url,
										itemType: type,
										percent: Math.floor(percentPer * loadCount + percentPer * Math.floor(e.loaded / e.total))
									});
								}
							}
							reqObj.silent = self.config().silentIncludes === true;
							requestManager.makeRequest(reqObj)
						}
					} else {
						throw 'Unknown include type for included file "' + url + '".';
					}
				} else {
					if(cacheValue === ResourceCache.BROWSER_CACHED_ENTRY)
							continueLoad(null);
						else
							continueLoad(cacheValue);
				}			
			}
		}
		
		this.getCachedHTML = function(id, callback){
			var obj = resources[id];
			if (obj && obj.isID && obj.type === 'html') {
				var docFrag = document.createDocumentFragment();
				docFrag.innerHTML = obj.data;
				return docFrag;
			}
			return null;
		}
		
		this.purgeAllCaches = function($restartOnComplete){
			//orm integration?
			if(window.localStorage !== undefined) localStorage.clear();
			self.cl().purgeApplicationCache($restartOnComplete);
		}
		
		this.combineMarkupResources = function(){
			var combined = "";
			for(var prop in resources){
				var thisResource = resources[prop];
				if(thisResource.type === 'xml' || thisResource.type === 'html'){
					combined += ResourceCache._cl_delimiterOpen + ' ';
					combined += (thisResource.isID ? 'id=' : 'url=') + prop;
					combined += ' type=' + thisResource.type;
					combined += ' ' + ResourceCache._cl_delimiterClose + '\n\n';
					combined += thisResource.data + '\n\n';
				}
			}
			return combined;
		}
		
		var checkCache = function(url){
			var value = resources[url],
				cached = (typeof value === 'object');
			if(!value && shouldUseCache && value !== ResourceCache.BROWSER_CACHED_ENTRY && value !== ResourceCache.COMBINED_DEPENDENCY)
				value = self.getValue(url);
			return (cached ? value.data : null);
		}
		
		var updateCache = function(url, type, value, fromStorage, isID){
			value = a5.cl.core.Utils.trim(value);
			var regex = new RegExp(ResourceCache._cl_delimiterOpen + '.*?' + ResourceCache._cl_delimiterClose, 'g');
			if(regex.test(value)){
				if (value.indexOf(ResourceCache._cl_delimiterOpen) !== 0) {
					self.throwError('Error parsing combined resource: ' + url + '\n\nCombined XML and HTML resources must start with a delimiter');
					return;
				}
				//if the loaded content is a combined file, uncombine it and store each piece
				var result, delimiters = [];
				//find all of the delimiters
				regex.lastIndex = 0;
				while(result = regex.exec(value))
					delimiters.push({index:regex.lastIndex, match:a5.cl.core.Utils.trim(result[0])});
				//loop through each delimiter
				for(var x = 0, xl = delimiters.length; x < xl; x++){
					var thisDelimiter = delimiters[x],
						//get the content associated with this delimiter
						dataSnippet = value.substring(thisDelimiter.index, (x < xl - 1) ? delimiters[x + 1].index : value.length).replace(regex, ""),
						//remove the delimiter open and close tags to get the params
						paramString = thisDelimiter.match.replace(ResourceCache._cl_delimiterOpen, '').replace(ResourceCache._cl_delimiterClose, ''),
						//split the params into an array
						paramList = a5.cl.core.Utils.trim(paramString).split(' '),
						params = {};
					//process each parameter into a name/value pair
					for(var y = 0, yl = paramList.length; y < yl; y++){
						var splitParam = paramList[y].split('='),
							paramName = splitParam.length > 1 ? splitParam[0] : 'url',
							paramValue = splitParam.pop();
						params[paramName] = paramValue;
					}
					if(params.url)
						params.url = a5.cl.core.Utils.makeAbsolutePath(params.url);
					updateCache(params.url || params.id, params.type || type, dataSnippet, false, !params.url);
				}
				updateCache(url, type, ResourceCache.COMBINED_DEPENDENCY);
				return null;
			} else {
				resources[url] = {
					type: type,
					data: value,
					isID: isID === true
				};
				if(shouldUseCache && !fromStorage)
					self.storeValue(url, value);
				return value;
			}
		}
		
		var discernType = function(url){
			var urlArray = url.split('.'),
				extension = urlArray[urlArray.length-1].replace(/\?.*$/, ''); //the replace() removes querystring params
			for (var i = 0, l=cacheTypes.length; i < l; i++) {
				if (typeof cacheTypes[i] != 'object' ||
				cacheTypes[i].extension == undefined ||
				cacheTypes[i].type == undefined) {
					throw 'Improper config cacheType specified: ' + cacheTypes[i].toString();
				} else if (extension == cacheTypes[i].extension) {
					return cacheTypes[i].type;
				}
			}
			return null;
		}
		
		var processData = function(url, data, type, callback){
			switch (type){
				case 'js':
					try {
						var insertElem = function(){
							head.insertBefore(include, head.firstChild);
						}
						var head = document.getElementsByTagName("head")[0], include = document.createElement("script");
						include.type = "text/javascript";					
						try {
							include.appendChild(document.createTextNode(data));
						} catch (e) {
							include.text = data;
						} finally {
							insertElem();
							callback();
						}
					} catch (e) {
						self.throwError(e);
					} finally {
						include = head = null;
					}
					break;
				case 'html':
				case 'xml':
				default:
					callback();
			}
		}
		
		var checkReplacements = function(url){
			return url.replace('{CLIENT_ENVIRONMENT}', a5.cl.instance().clientEnvironment()).replace('{ENVIRONMENT}', a5.cl.instance().environment());
		}
	
})


a5.Package("a5.cl.core")

	.Import('a5.cl.CLEvent')
	.Extends("a5.cl.CLBase")
	.Class("GlobalUpdateTimer", 'singleton final', function(self, im){

		var timer,
		clInstance,
		interval,
		evtInstance = a5.Create(im.CLEvent, [im.CLEvent.GLOBAL_UPDATE_TIMER_TICK]);
		
		this.GlobalUpdateTimer = function(){
			self.superclass(this);
			interval = self.config().globalUpdateTimerInterval;
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
		_requestManager,
		_envManager,
		_globalUpdateTimer,
		_resourceCache,
		_instantiator,
		_pluginManager,
		_launchState,
		_manifestManager;
		
		this.Core = function($applicationPackage){
			self.superclass(this); 
			_instantiator = self.create(a5.cl.core.Instantiator, [$applicationPackage]);
		}
			
		this.resourceCache = function(){ return _resourceCache; }	
		this.instantiator = function(){ return _instantiator; }			
		this.cache = function(){	return _cache;	}
		this.envManager = function(){ return _envManager; }	
		this.manifestManager = function(){ return _manifestManager; }
		this.requestManager = function(){ return _requestManager;	}	
		this.pluginManager = function(){ return _pluginManager; }			
		this.globalUpdateTimer = function(){return _globalUpdateTimer;}
		this.launchState = function(){ return _launchState; }
		
		this.relaunch = function(){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_WILL_RELAUNCH);
			window.location.reload();
		}
		
		this.initializeCore = function($environment, $clientEnvironment){
			updateLaunchStatus('APPLICATION_INITIALIZING');
			_globalUpdateTimer = self.create(a5.cl.core.GlobalUpdateTimer);
			_manifestManager = self.create(a5.cl.core.ManifestManager);
			_requestManager = self.create(a5.cl.core.RequestManager);
			_envManager = self.create(a5.cl.core.EnvManager, [$environment, $clientEnvironment]);
			_resourceCache = self.create(a5.cl.core.ResourceCache);
			_pluginManager = self.create(a5.cl.core.PluginManager);
			_cache = self.create(a5.cl.core.DataCache);
			_resourceCache.initStorageRules();
			var loadPaths = self.config().dependencies;
			if(loadPaths.length) _resourceCache.include(loadPaths, dependenciesLoaded, function(e){
				updateLaunchStatus('DEPENDENCIES_LOADING', e);
			});
			else dependenciesLoaded();	
		}
		
		var dependenciesLoaded = function(){
			updateLaunchStatus('DEPENDENCIES_LOADED');
			_pluginManager.instantiatePlugins();
			updateLaunchStatus('PLUGINS_LOADED');
			updateLaunchStatus('APPLICATION_PREPARED')
			_envManager.initialize();
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
 * @class Mixin class for providing data storage hooks. DataStore applies a uniqe ID prefix on key values, removing the need to assure uniqueness of keys in your application. Key prefixes are unique to the class in which they are referenced.
 * <br/><b>Abstract</b>
 * @name a5.cl.mixins.DataStore
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl.mixins')
	.Import('a5.cl.core.DataCache')
	.Mixin('DataStore', function(proto, im, DataStore){

		/**#@+
	 	 * @memberOf a5.cl.mixins.DataStore#
	 	 * @function
		 */	
		
		proto.DataStore = function(){
			this._cl_cacheKeyValidated = false;
			this._cl_prefix = null;
			this._cl_validatedPrefix = null;
		}
		
		/**
		 * Returns whether caching has previously been set by the application on the client and values are available for retrieval.
		 * @name cacheExists
		 * @returns {Boolean}
		 */
		proto.cacheExists = function(){
			return im.DataCache.cacheExists();
		}
		
		/**
		 * Stores a value uniquely keyed in the localStorage cache. 
		 * @name storeValue
		 * @returns {Boolean} success
		 */
		proto.storeValue = function(key, value){
			if(im.DataCache.isAvailable() && value !== undefined) 
				return im.DataCache.storeValue(this._cl_createCacheKey(key), value);
			else return false;
		}
		
		proto.keyPrefix = function(value){
			if(typeof value === 'string'){
				this._cl_prefix = value;
				return this;
			}
			return this._cl_prefix;
		}
		
		/**
		 * Retrieves a value for the specified key from the client data store.
		 * @name getValue
		 * @returns {*} False if failure
		 */
		proto.getValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.getValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Removes the value for the specified key from the client data store.
		 * @name clearValue
		 */
		proto.clearValue = function(key){
			if(im.DataCache.isAvailable()) 
				return im.DataCache.clearValue(this._cl_createCacheKey(key));
			else return false;
		}
		
		/**
		 * Clears all key/value pairs associated with the class in which the method is called.
		 * @name clearScopeValues
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


a5.Package('a5.cl.mixins')
	.Mixin('BindableSource', function(mixin, im){
		
		mixin.BindableSource = function(){
			this._cl_receivers = [];
			this._cl_bindParamType = null;
			this._cl_bindParamRequired = false;
			this._cl_bindParamCallback = null;
		}
		
		mixin.bindParamProps = function(type, required, callback){
			this._cl_bindParamType = type;
			if(required !== undefined) this._cl_bindParamRequired = required;
			if(callback !== undefined) this._cl_bindParamCallback = callback;
			return this;
		}
		
		mixin.bindParamType = function(){
			return this._cl_bindParamType;
		}
		
		mixin.bindParamRequired = function(){
			return this._cl_bindParamRequired;
		}
		
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



a5.Package('a5.cl.mixins')
	.Mixin('Binder', function(mixin, im){
		
		mixin.Binder = function(){
			this._cl_bindingsConnected = true;
			this._cl_bindings = [];
		}
		
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
		
		mixin.bindingsConnected = function(){
			return this._cl_bindingsConnected;
		}
		
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
 * @class Base class for service handlers in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLService
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLService', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLService#
	 	 * @function
		 */		
		
		proto.CLService = function(){
			proto.superclass(this);
			this._cl_url = null;
			this._cl_isJson = true;
		}
		

		proto.initialize = function(url){
			this._cl_url = url;
		}
		
		/**
		 * @name url
		 */
		proto.url = function(){
			var plgn = this.plugins().getRegisteredProcess('serviceURLRewriter');
			if(plgn)
				return plgn.rewrite(this._cl_url);
			return this._cl_url;
		}
		
		/**
		 * @name isJson
		 * @param {Boolean} [value]
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
		
		cls.Override.instanceProcess = function(rules, instance){
		
		}
})


/**
 * @class Base class for web sockets in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLSocket
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Prototype('CLSocket', 'abstract', function(proto, im, CLSocket){
		
		CLSocket.supportsSockets = function(){
			return 'WebSocket' in window ? true : false;
		}
		
		/**#@+
	 	 * @memberOf a5.cl.CLSocket#
	 	 * @function
		 */		
		
		proto.CLSocket = function(){
			proto.superclass(this);
			this._cl_socket = null;
			var self = this;
			this._cl_socketOnMessage = function(e){
				var data = self.isJson() ? a5.cl.core.JSON.parse(e.data):e.data;
				self.dataReceived(data);
			}
		}
		
		/**
		 * 
		 * @name initialize
		 * @param {String} url
		 * @return {Boolean} success
		 */
		proto.Override.initialize = function(url){
			if (this.supportsSockets()){
				this._cl_socket = new WebSocket(url);
				return true;
			} else {
				return false;
			}
		}
		
		/**
		 * Performs a call on the socket. createSocket must be called first.
		 * @name send
		 * @param {String} message The message to send to the socket.
		 * @param {Function} [callback] A function to pass returned results to.
		 */
		proto.send = function(m, callback){
			if (this.supportsSockets()) {
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
		 * @name dataReceived
		 * @param {String}Object} message
		 */
		proto.dataReceived = function(data){
			
		}
		
		/**
		 * @name supportsSockets
		 */
		proto.supportsSockets = function(){
			return CLSocket.supportsSockets;
		}
		
		/**
		 * @name close
		 */
		proto.close = function(){
			if(this._cl_socket) this._cl_socket.close();
		}	
		
		proto.dealloc = function(){
			if(this._cl_socket && this._cl_socket.readyState === 2) this.closeSocket();
		}
});


/**
 * @class Base class for Ajax handlers.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLAjax
 * @extends a5.cl.CLService
 */
a5.Package('a5.cl')

	.Extends('CLService')
	.Mix('a5.cl.mixins.BindableSource')
	.Prototype('CLAjax', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLAjax#
	 	 * @function
		 */	
		
		proto.CLAjax = function(){
			proto.superclass(this);
			this._cl_ajaxStruct = null;
			this._cl_silent = false;
		}
		
		/**
		 * Defines the default properties for the service endpoint.
		 * @name initialize
		 * @param {String} url The service endpoint without a method specified, used as a prefix to all method values passed in call method.
		 * @param {Object} props Properties object, see {@link a5.cl.CLAjax#call} for more info.
		 */
		proto.Override.initialize = function(url, props){
			proto.superclass().initialize.call(this, url);
			this._cl_ajaxStruct = props;
		}
				
		/**
		 * Performs a call on the service. initialize must be called first.
		 * @name call
		 * @type Number
		 * @returns The request ID.
		 * @param {String} method The method to call on the endpoint. An empty string or null may be passed to call services that do not define methods.
		 * @param {Object} [data] A data object to pass as JSON. 
		 * @param {Function} [callback] A function to pass returned results to.
		 * @param {Object} [props] Call props object.
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
				if(m.charAt(0) !== '/')
					m = '/' + m;
			} else {
				m = '';
			}
			props.url = this.url() + m;
			return a5.cl.core.RequestManager.instance().makeRequest(props);
		}
		
		/**
		 * Aborts all calls associated with the service.
		 * @name abort
		 * @param {Number} [id] A specific request ID to abort instead of aborting all pending requests.
		 */
		proto.abort = function(id){
			return a5.cl.core.RequestManager.instance().abort(id);
		}
		
		/**
		 * Gets or sets the silent property.  When set to true, requests will not trigger ASYNC_START and ASYNC_COMPLETE events.
		 * @param {Object} value
		 */
		proto.silent = function(value){
			if(typeof value === 'boolean'){
				this._cl_silent = value;
				return this;
			}
			return this._cl_silent;
		}
});

a5.Package('a5.cl')

	.Extends('a5.Attribute')
	.Class('AjaxCallAttribute', function(cls, im, AjaxCallAttribute){
		
		AjaxCallAttribute.CANCEL_CYCLE	= 'ajaxCallAttributeCancelCycle';
		
		var cycledCalls = {};
		
		cls.AjaxCallAttribute = function(){
			cls.superclass(this);
			
		}
		
		cls.Override.methodPre = function(rules, args, scope, method, callback){
			args = Array.prototype.slice.call(args);
			var data = null,
				argsCallback = null,
				rules = rules.length ? rules[0] : {},
				propObj = null;
			if (rules.takesData === true && args.length)
				data = args.shift();
			if(rules.props)
				propObj = rules.props;
			if(rules.hasCallback === true && args.length && typeof args[0] === 'function')
				argsCallback = args.shift();
			var executeCall = function(){
				scope.call(method.getName(), data, function(response){
					args.unshift(response);
					if(argsCallback)
						argsCallback(args);
					callback(args);
				}, propObj);
			}
			if (args[0] === AjaxCallAttribute.CANCEL_CYCLE) {
				if (method._cl_cycleID) {
					clearInterval(method._cl_cycleID);
					delete method._cl_cycleID;
				}
				return a5.Attribute.ASYNC;
			}
			if (rules.cycle) {
				if (!method._cl_cycleID) {
					method._cl_cycleID = setInterval(function(){
						method.apply(scope, args);
					}, rules.cycle);
					executeCall();
				} else {
					executeCall();
				}
			} else {
				executeCall();
			}
			return a5.Attribute.ASYNC;
		}	
})

a5.Package('a5.cl')

	.Extends('a5.AspectAttribute')
	.Class('BoundAjaxReturnAttribute', function(cls){
		
		cls.BoundAjaxReturnAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.before = function(rules, args, scope, method, callback){
			if (rules.length && rules[0].receiverMethod !== undefined) {
				var method = rules[0].receiverMethod;
				method.call(null, args[0]);
			} else {
				scope.notifyReceivers(args[0], method.getName());
			}
			return a5.AspectAttribute.SUCCESS;
		}
	})



/**
 * @class 
 * @name a5.cl.CLPlugin
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')

	.Extends('CLBase')
	.Prototype('CLPlugin', 'abstract', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLPlugin#
	 	 * @function
		 */		
		
		proto.CLPlugin = function(){
			proto.superclass(this);
			this._cl_pluginConfig = null;
			this._cl_configDefaults = {};
			this._cl_requiredVersion = '0';
			this._cl_maxVerifiedVersion = null;
			this._cl_requires = [];
		}
		
		/**
		 * @name pluginConfig
		 */
		proto.pluginConfig = function(){
			return this._cl_pluginConfig;
		}
		
		/**
		 * @name requires
		 * @param {Object} val
		 */
		proto.requires = function(val){
			this._cl_requires.push(val);
		}
		
		/**
		 * @name requiredVersion
		 * @param {Object} value
		 */
		proto.requiredVersion = function(value){
			if(value !== undefined) this._cl_requiredVersion = value;
			return this._cl_requiredVersion;
		}
		
		/**
		 * @name maxVerifiedVersion
		 * @param {Object} value
		 */
		proto.maxVerifiedVersion = function(value){
			if(value !== undefined) this._cl_maxVerifiedVersion = value;
			return this._cl_maxVerifiedVersion;
		}
		
		/**
		 * @name configDefaults
		 */
		proto.configDefaults = function(value){
			 if(value !== undefined)
			 	this._cl_configDefaults = value;
			return this._cl_configDefaults;
		}
		
		
		/**
		 * @name initializePlugin
		 */
		proto.initializePlugin = function(){}
		
		/**
		 * @name registerForProcess
		 * @param {Object} type
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
 * @class 
 * @name a5.cl.CLAddon
 * @extends a5.cl.CLPlugin
 */
a5.Package('a5.cl')

	.Extends('CLPlugin')
	.Prototype('CLAddon', 'abstract', function(proto, im, CLAddon){
		
		CLAddon.INITIALIZE_COMPLETE = 'clAddonInitializeComplete';
		
		/**#@+
	 	 * @memberOf a5.cl.CLAddon#
	 	 * @function
		 */		
		
		proto.CLAddon = function(){
			proto.superclass(this);
		}
		
		proto.getCreateParams = function(){
			return a5.cl.instance()._cl_createParams();
		}
		
		proto.initializeAddOn = function(){
			return false;
		}
		
		proto.createMainConfigMethod = function(type){
			a5.cl.CLMain.prototype['set' + type.substr(0, 1).toUpperCase() + type.substr(1)] = function(){
				a5.cl.CLMain._cl_storedCfgs[type] = Array.prototype.slice.call(arguments);
			}
		}
		
		proto.getMainConfigProps = function(type){
			return a5.cl.CLMain._cl_storedCfgs[type];
		}
		
		proto.registerAutoInstantiate = function(){
			a5.cl.core.Instantiator.instance().registerAutoInstantiate.apply(null, arguments);
		}
		
		proto.defineRegisterableProcess = function(process){
			this.cl()._core().pluginManager().defineRegisterableProcess(process);
		}
	
});


a5.Package("a5.cl")

	.Extends('CLBase')
	.Mix('a5.cl.mixins.Binder')
	.Class("CL", 'singleton', function(self, im){
		/**#@+
	 	 * @memberOf a5.cl.CL#
	 	 * @function
		 */
	
		var _params,
			_config,
			_main,
			core;
		
		this._cl_plugins = {};

		this.CL = function(params){
			self.superclass(this);
			_params = {};
			if(a5.cl.CLMain._extenderRef.length)
				_main = self.create(a5.cl.CLMain._extenderRef[0], [params]);
			_params.applicationPackage = _main.classPackage();
			core = self.create(a5.cl.core.Core, [_params.applicationPackage]);
			_config = a5.cl.core.Utils.mergeObject(core.instantiator().instantiateConfiguration(), _params);
			_config = core.instantiator().createConfig(_config);
			core.initializeCore((params.environment || null), (_params.clientEnvironment || null));
		}
		
		this.launchState = function(){ return core.launchState(); }
		
		/**
		 *
		 * @param {Boolean} [returnString]
		 */
		this.applicationPackage = function(){ return core.instantiator().applicationPackage.apply(this, arguments); };
		
		/**
		 *
		 */
		this.Override.appParams = function(){	return a5.cl.CLMain._cl_storedCfgs.appParams; }

		/**
		 *
		 * @type String
		 * @param {Boolean} [root]
		 */
		this.appPath = function(root){ return core.envManager().appPath(root); }
		
		/**
		 *
		 * @type Number
		 */
		this.browserVersion = function(){	return core.envManager().browserVersion();	}
		
		/**
		 * Defines A5 CL client environment types. One of 'DESKTOP', 'MOBILE', or 'TABLET'.
		 *
		 * @type String
		 */
		this.clientEnvironment = function(){	return core.envManager().clientEnvironment.apply(null, arguments);	}
		
		/**
		 * Defines A5 CL client platform types.<br/>
		 * Values:<br/>
		 * 'BB6' - BlackBerry OS 6<br/>
		 * 'BB' - BlackBerry OS 5 and under<br/>
		 * 'IOS' - Apple iOS<br/>
		 * 'ANDROID' - Google Android<br/>
		 * 'IE' - Internet Explorer<br/>
		 * 'UNKNOWN' - Unknown platform.<br/>
		 *
		 * @type String
		 */
		this.clientPlatform = function(){		return core.envManager().clientPlatform();	}
		
		/**
		 * 
		 */
		this.clientOrientation = function(){ return core.envManager().clientOrientation(); }
		
		/**
		 *
		 */
		this.Override.config = function(){		return _config; }		
		
		/**
		 * Defines AirFrame CL development environment types. One of 'DEVELOPMENT', 'TEST', or 'PRODUCTION'.
		 *
		 * @type String
		 */
		this.environment = function(){	return core.envManager().environment();	}
		
		
		/**
		 * Includes external content into the application.
		 *
		 * @param {String} value
		 * @param {function} callback
		 * @param {function} [itemCallback]
		 * @param {Boolean} [allowReplacements=true]
		 * @param {function} [onError]
		 */
		this.include = function(){ return core.resourceCache().include.apply(this, arguments); }	
		
		/**
		 * Returns whether the client environment supports manifest caching.
		 *
		 */
		this.isOfflineCapable = function(){		return core.manifestManager().isOfflineCapable();	}
		
		/**
		 * Returns whether the application is running on http:// or file://
		 *
		 */
		this.isLocal = function(){ return core.envManager().isLocal(); }
		
		/**
		 * Returns the current online state of the client browser, where supported.
		 *
		 */
		this.isOnline = function(){	return core.envManager().isOnline();	}	
		
		/**
		 *
		 */
		this.manifestBuild = function(){ return core.manifestManager().manifestBuild();	}
		
		/**
		 *
		 */
		this.Override.plugins = function(){ return this._cl_plugins; }
		
		/**
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeAllCaches = function(restartOnComplete){ core.resourceCache().purgeAllCaches(restartOnComplete); }
		
		/**
		 * Purges the manifest cache data in applicationStorage, if applicable.
		 *
		 * @param {Boolean} [restartOnComplete] Restarts the application after purging the cache.
		 */
		this.purgeApplicationCache = function(restartOnComplete){ core.manifestManager().purgeApplicationCache(restartOnComplete); }
		
		/**
		 * Restarts the application.
		 */
		this.relaunch = function(){ core.relaunch(); }
		
		this._core = function(){		return core; }
		
		this.asyncRunning = function(){ return core.requestManager().asyncRunning(); }
		
		this._cl_createParams = function(){ return _params; }
		
		this.Override.eListenersChange = function(e){
			var ev = a5.cl.CLEvent.GLOBAL_UPDATE_TIMER_TICK;
			if(e.type === ev){
				if(this.getTotalListeners(ev) > 0)
					core.globalUpdateTimer().startTimer();
				else
					core.globalUpdateTimer().stopTimer();
			}	
		}
	
});


a5.Package('a5.cl')

	.Extends('CLBase')
	.Static(function(CLMain){
		CLMain._cl_storedCfgs = {config:[], appParams:{}, pluginConfigs:[]};
	})
	.Prototype('CLMain', 'abstract', function(proto, im, CLMain){
		
		proto.CLMain = function(){
			proto.superclass(this);
			if(CLMain._extenderRef.length > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid class "' + this.namespace() + '", a5.cl.CLMain must only be extended by one subclass.']))
			if(this.getStatic().instanceCount() > 1)
				return proto.throwError(proto.create(a5.cl.CLError, ['Invalid duplicate instance of a5.cl.CLMain subclass "' + this.getStatic().namespace() + '"']));
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			proto.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			proto.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, this.dependenciesLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.PLUGINS_LOADED, this.pluginsLoaded);
			proto.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			proto.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
		}
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setAppParams = function(obj){ CLMain._cl_storedCfgs.appParams = obj; }
		
		/**
		 * 
		 * @param {Object} obj
		 */
		proto.setConfig = function(obj){ CLMain._cl_storedCfgs.config = obj; }
		
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



})(this);


//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( a5, undefined ) {
a5.Package('a5.cl')

	.Extends('a5.cl.CLBase')
	.Prototype('CLMVCBase', function(proto){
		
		proto.CLMVCBase = function(){
			proto.superclass(this);
		}
		
		/**
		 * Returns the name value of the class if known, else it returns the instanceUID value.
		 * @name mvcName
		 * @type String
		 */
		proto.mvcName = function(){
			return this._cl_mvcName || this.instanceUID();
		}

		proto.redirect = function(params, info, forceRedirect){
			this.MVC().redirect(params, info, forceRedirect);
		}
		
		proto._cl_setMVCName = function(name){
			this._cl_mvcName = name;
		}
		
})


a5.Package('a5.cl.mvc')

	.Extends('a5.Attribute')
	.Class('InferRenderAttribute', function(cls){
		
		cls.InferRenderAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback, callOriginator){
			var name = method.getName(),
				cls = name.substr(0, 1).toUpperCase() + name.substr(1) + 'Controller';
			var clr = typeRules[0].im[cls].instance(true);
			clr.index.apply(clr, args);
			scope.render(clr);
			return a5.Attribute.SUCCESS;
		}
		
	})


/**
 * @class 
 * @name a5.cl.mvc.CLViewEvent
 */
a5.Package('a5.cl.mvc')

	.Extends('a5.Event')
	.Static(function(CLViewEvent){
		
		CLViewEvent.VIEW_READY = 'clViewReady';
	})
	.Prototype('CLViewEvent', function(proto){
		
		proto.CLViewEvent = function(){
			proto.superclass(this);
		}	
});


/**
 * @class 
 * @name a5.cl.mvc.CLViewContainerEvent
 */
a5.Package('a5.cl.mvc')

	.Extends('a5.Event')
	.Static(function(CLViewContainerEvent){
		
		CLViewContainerEvent.CHILDREN_READY = 'childrenReady';
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#LOADER_STATE_CHANGE
		 * @param {EventObject} e
		 * @param {String} e.state
		 * @description Dispatched when the loader state changes
		 */
		CLViewContainerEvent.LOADER_STATE_CHANGE = 'loaderStateChange';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_REMOVE_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be removed from the view container.
		 */
		CLViewContainerEvent.WILL_REMOVE_VIEW = 'willRemoveView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#WILL_ADD_VIEW
		 * @param {EventObject} e
		 * @description Dispatched when a view is about to be added to the view container.
		 */
		CLViewContainerEvent.WILL_ADD_VIEW = 'willAddView';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_ADDED
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully loaded to the view container. 
		 */
		CLViewContainerEvent.VIEW_ADDED = 'viewAdded';
		
		/**
		 * @event
		 * @name a5.cl.mvc.CLViewContainerEvent#VIEW_REMOVED 
		 * @param {EventObject} e
		 * @description Dispatched when a view has been successfully removed from the view container. 
		 */
		CLViewContainerEvent.VIEW_REMOVED = 'viewRemoved';
	})
	.Prototype('CLViewContainerEvent', function(proto){
		
		proto.CLViewContainerEvent = function(){
			proto.superclass(this);
		}
		
	});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLMVCBase')
	.Class('RedrawEngine', 'singleton final', function(self, im){

		var appContainer, 
			pendingRedrawers = [],
			appRedrawForced = false,
			perfTester,
			attached,
			animFrameHook;
		
		this.RedrawEngine = function(){
			self.superclass(this);
			appContainer = self.cl().MVC().application().view();
			animFrameHook = a5.cl.core.Utils.getVendorWindowMethod('requestAnimationFrame');
			self.cl().addEventListener(im.CLEvent.PLUGINS_LOADED, ePluginsLoaded);
		}
		
		var ePluginsLoaded = function(){
			self.cl().removeEventListener(im.CLEvent.PLUGINS_LOADED, ePluginsLoaded);
			if(self.cl().plugins().PerformanceTester)
				perfTester = self.cl().plugins().PerformanceTester().createTimer('redraw');
		}
	
		this.loaderWentIdle = function(target){
			pushRedrawTarget(target);
		}
		
		this.attemptRedraw = function($target){
			var target = $target || self;
			pushRedrawTarget(target);
		}
		
		this.triggerAppRedraw = function($force){
			appRedrawForced = $force || appRedrawForced;
			attachForAnimCycle();
		}
		
		var pushRedrawTarget = function(target){
			var shouldPush = true,
				i, l;
			for (i = 0, l = pendingRedrawers.length; i < l; i++) { 
				if (target == pendingRedrawers[i] || target.isChildOf(pendingRedrawers[i])) {
					shouldPush = false;
					break;
				}
			}
			if (shouldPush) {
				for(i = 0; i< pendingRedrawers.length; i++){	
					if (pendingRedrawers[i].isChildOf(target)) {
						pendingRedrawers.splice(i, 1);
						i--;
					}
				}
				pendingRedrawers.push(target);
			}
			attachForAnimCycle();
		}
		
		var attachForAnimCycle = function(){
			if (!attached && (pendingRedrawers.length || appRedrawForced)) {
				attached = true;
				if (animFrameHook) animFrameHook(eRedrawCycle);
				else self.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, eRedrawCycle);
			}
		}
		
		var eRedrawCycle = function(){
			if(!animFrameHook)
				self.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, eRedrawCycle);
			if(perfTester)
				perfTester.startTest();
			var force = appRedrawForced;
			appRedrawForced = false;
			if (force) {
				appContainer._cl_redraw(force);
				pendingRedrawers = [];		
			} else {
				while(pendingRedrawers.length){
					var targ = pendingRedrawers.shift();
					targ._cl_redraw(false);
				}
			}
			if (perfTester)
				perfTester.completeTest();
			attached = false;
		}

});


a5.SetNamespace('a5.cl.mvc.core.AppSetup', {
	genericSetup:function(){
		a5.cl.instance().MVC().setTitle();	
	},
	desktopSetup:function(){
		if(a5.cl.instance().config().faviconPath){
			var headID = document.getElementsByTagName("head")[0],
			elem = document.createElement('link');
			elem.rel = "shortcut icon";
			elem.href= a5.cl.instance().config().faviconPath;
			elem.type = "image/x-icon";
			headID.appendChild(elem);
			elem = null;
		}
		if (a5.cl.instance().config().forceIE7) {
			var headID = document.getElementsByTagName("head")[0],
			elem = document.createElement('meta');
			elem.httpEquiv = "X-UA-Compatible";
			elem.content = 'IE=7';
			headID.appendChild(elem);
			elem = null;
		}
		this.genericSetup();
	},
	mobileSetup: function(){
		var headID = document.getElementsByTagName("head")[0],
		elem = document.createElement('meta');
		elem.name = "viewport";
		elem.content = "width=device-width, minimum-scale=1, maximum-scale=1";
		headID.appendChild(elem);
		this.genericSetup();
		elem = null;
	},
	tabletSetup: function(){
		this.mobileSetup();
	}
});



a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLMVCBase')
	.Class('LocationManager', 'singleton final', function(self, im){
	
		var mappings;
		var filters;
		var hash
		
		this.LocationManager = function(){
			self.superclass(this);
			mappings = a5.cl.mvc.core.Mappings.instance();
			filters = a5.cl.mvc.core.Filters.instance();
			hash = self.plugins().HashManager();
		}	
		
		this._renderError = function(type, info){
			self.cl().dispatchEvent(im.CLEvent.APPLICATION_ERROR, {errorType:type, info:info});	
			var msg;
			switch (type) {
				case 404:
					msg = 'Resource not found: "' + (info.toString().length ? info.toString() : '/') + '"';
					break;
				case 500:
					if(!info._a5_initialized)
						info = self.create(a5.Error, [info]);
					msg = info.toString();
					break;
				default:
					msg = 'Error loading resource.';
					break;
			}
			var errorSig = mappings.getErrorSignature(type);
			if (errorSig) {
				errorSig.id = [msg, info];
				self.redirect(errorSig);
			} else {	
				self.MVC().application()._cl_renderError(type, msg, info);
			}
		}
		
		this.Override.redirect = function(params, info, forceRedirect){	
			var foundPath = true;
			var type = typeof params;
			if (type == 'string' && params.indexOf('://') != -1) {
				params = { url: params };
				type = 'object';
			}
			if(params instanceof Array) hash.setHash(params, false, forceRedirect);
			if(params.hash != undefined) hash.setHash(params.hash, false, forceRedirect);
			else if(type == 'string') hash.setHash(params, false, forceRedirect);
			else if(type == 'number') self._renderError(params, info);
			else if(params.url) window.location = params.url;
			else foundPath = false;
			if (!foundPath) {
				if (params.forceHash != undefined) hash.setHash(params.forceHash, true);
				if (params.controller != undefined) 
					this.processMapping(params);
			}
		}
		
		this.processMapping = function(param){
			var lastSig = mappings.geLastCallSignature();
			if (Object.prototype.toString.call(param) === '[object Array]') {
				var callSig = mappings.getCallSignature(param);
				if (callSig) {
					filters.test(callSig, lastSig, function(valid){
						if (valid) {
							self.dispatchEvent('CONTROLLER_CHANGE', {
								controller: callSig.controller,
								action: callSig.action,
								id: callSig.id
							});
						}
					})
				} else {
					var path = "";
					for (var i = 0, l = param.length; i < l; i++) 
						path += param[i] + (i < (l - 1) ? '/' : '');
					self._renderError(404, path)
				}
			} else {
				filters.test(param, lastSig, function(valid){
					if (valid) {
						self.dispatchEvent('CONTROLLER_CHANGE', {
							controller: param.controller,
							action: param.action,
							id: param.id
						});
					}
				})
			}
		}
})

a5.Package('a5.cl.mvc.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Class('WindowContainer', function(cls, im){
		
		cls.WindowContainer = function(){
			cls.superclass(this);
		}
		
});

a5.Package('a5.cl.mvc.core')
	
	.Extends('a5.cl.CLViewContainer')
	.Prototype('AppViewContainer', 'singleton final', function(proto, im){
		
		proto.AppViewContainer = function(){
			proto.superclass(this);
			this._cl_errorStopped = false;
			this._cl_systemWindowContainer = this.create(im.WindowContainer);
			this._cl_systemWindowContainer.hide();
			this._cl_appWindowContainer = this.create(im.WindowContainer);
			this._cl_appWindowContainer.hide();
			this._cl_appWindowContainer.showOverflow(true);
			this._cl_appWindowLoadingContainer = this.create(im.WindowContainer);
			this.showOverflow(true);
			this._cl_addedToTree();
		}
		
		proto.Override.addSubView = proto.Override.removeSubView = proto.Override.subViewToTop = proto.Override.subViewToBottom = 
		proto.Override.removeAllSubViews = proto.Override.removeViewAtIndex = proto.Override.replaceView = 
		proto.Override.replaceViewAtIndex = proto.Override.swapViewsAtIndex = proto.Override.addSubViewAtIndex = 
		proto.Override.addSubViewBelow = proto.Override.addSubViewAbove = function(){
			this.throwError('View manipulations on AppViewContainer must use addWindow and removeWindow methods only.')
		}
		
		proto.containsWindow = function(window){
			var app = this._cl_appWindowContainer.containsSubView(window)
			if(app) return true;
			return this._cl_systemWindowContainer.containsSubView(window)
		}
				
		proto.addWindow = function(window){
			if (!this._cl_errorStopped){
				if (window instanceof a5.cl.CLWindow) {
					var lev = a5.cl.CLWindowLevel,
						newWinLevel = window._cl_windowLevel;
					if (newWinLevel === lev.SYSTEM){
						var count = this._cl_systemWindowContainer.subViewCount();
						if(count > 0){
							if(this._cl_systemWindowContainer.subViewAtIndex(0).blocking())
								return this.throwError('system window blocking error');
							else
								this._cl_systemWindowContainer.replaceViewAtIndex(window, 0);
						} else {
								this._cl_systemWindowContainer.addSubView(window);
						}
						this._cl_systemWindowContainer.show();
					} else {
						var container = this._cl_appWindowContainer,
							index = 0,
							isReplace = false;
						if(container.containsSubView(window))
							container.removeSubView(window, false);
						for (var i = 0, l = container.subViewCount(); i < l; i++) {
							var checkedWin = container.subViewAtIndex(i);
							if (checkedWin._cl_windowLevel === lev.APPLICATION) {
								index = i + 1;
							} else if (checkedWin._cl_windowLevel === newWinLevel) {
								index = i;
								isReplace = true;
							}
						}
						if((newWinLevel === lev.APPLICATION || container.subViewCount() === 0) || !isReplace)
							this._cl_appWindowContainer.addSubViewAtIndex(window, index);
						else
							this._cl_appWindowContainer.replaceViewAtIndex(window, index);
					}
				} else {
					self.redirect(500, 'Application addSubView only accepts views that subclass a5.cl.CLWindow');
				}	
			}
		}

		proto.removeWindow = function(window, destroy){
			if (window) {
				if (this._cl_appWindowContainer.containsSubView(window)) {
					this._cl_appWindowContainer.removeSubView(window, destroy);
				} else if (this._cl_systemWindowContainer.containsSubView(window)) {
					this._cl_systemWindowContainer.removeSubView(window, destroy);
					this._cl_systemWindowContainer.hide();
				} else {
					this.throwError('Cannot remove window "' + window.instanceUID() + '", window is not currently a child of AppViewContainer.')
				} 
			}
		}
		
		proto._cl_initialRenderCompete = function(){
			this._cl_appWindowContainer.show();
			this.superclass().removeSubView.call(this, this._cl_appWindowLoadingContainer);
		}

		proto.Override.viewReady = function(){}
		
		proto.Override.width = function(value){
			return this.cl().MVC().envManager().windowProps().width;
		}
		
		proto.Override.height = function(value){
			return this.cl().MVC().envManager().windowProps().height;
		}
		
		proto.Override._cl_redraw = function(force){
			var sysWin = this._cl_systemWindowContainer.subViewAtIndex(0),
				offset = null;
			if (sysWin && sysWin.offsetsApplication() !== a5.cl.mvc.core.SystemWindow.OFFSET_NONE) {
				didRedrawSysWin = true;
				this._cl_systemWindowContainer.height(sysWin.height('value') === '100%' ? '100%':'auto');
				this._cl_systemWindowContainer._cl_redraw(force);
				offset = sysWin.height();
			} else {
				this._cl_systemWindowContainer._cl_redraw(force);
			}
			if (offset !== null) {
				var h = this.height() - this._cl_systemWindowContainer.height();
				if (sysWin.offsetsApplication() === a5.cl.mvc.core.SystemWindow.OFFSET_TOP) {
					this._cl_appWindowContainer.y(offset).height(h);
					this._cl_systemWindowContainer.y(0);
				} else {
					this._cl_appWindowContainer.y(0).height(h);
					var f = this.height() - offset;
					this._cl_systemWindowContainer.y(this.height() - offset);
					this._cl_systemWindowContainer._cl_redraw(force);
				}
			}
			this._cl_appWindowContainer._cl_redraw(force);
		}
		
		proto.Override.redraw = function(){
			this.cl().MVC().redrawEngine().attemptRedraw(this);
		}
		
		proto.Override.draw = function(){
			var body = document.getElementsByTagName("body")[0];
			body.style.margin = body.style.padding = 0;
			body.style.overflow = 'hidden';
			proto.superclass().draw.call(this);
			this._cl_viewElement.style.width = this._cl_viewElement.style.height = "100%";
			this._cl_width.percent = this._cl_height.percent = 1;
			this._cl_width.value = this._cl_height.value = '100%';
			body.appendChild(this._cl_viewElement);
			this._cl_viewElement.style.display = 'block';
			proto.superclass().addSubView.call(this, this._cl_appWindowContainer);
			proto.superclass().addSubView.call(this, this._cl_appWindowLoadingContainer);
			proto.superclass().addSubView.call(this, this._cl_systemWindowContainer);
		}
	
});


a5.Package('a5.cl.mvc.core')

	.Extends('a5.cl.CLWindow')
	.Static(function(SystemWindow){
		SystemWindow.OFFSET_TOP = 'systemWindowOffsetTop';
		SystemWindow.OFFSET_BOTTOM = 'systemWindowOffsetBottom';
		SystemWindow.OFFSET_NONE = 'systemWindowOffsetNone';
	})
	.Prototype('SystemWindow', function(proto, im, SystemWindow){

		this.Properties(function(){
			this._cl_blocking = false;
			this._cl_offsetsApplication = SystemWindow.OFFSET_NONE;
		})
		
		proto.SystemWindow = function(){
			proto.superclass(this);
			this._cl_windowLevel = a5.cl.CLWindowLevel.SYSTEM;
		}	
		
		proto.showWindow = function(){
			this.cl().application().view().addWindow(this);
		}
		
		proto.blocking = function(value){
			if(value !== undefined){
				this._cl_blocking = value;
				return this;
			}
			return this._cl_blocking;
		}
		
		proto.offsetsApplication = function(value){
			if(value !== undefined){
				this._cl_offsetsApplication = value;
				return;
			}
			return this._cl_offsetsApplication;
		}
});


/**
 * @class Base class for UI classes in the AirFrame CL framework.
 * @name a5.cl.CLView
 * @extends a5.cl.CLBase
 */
a5.Package("a5.cl")
	
	.Import('a5.cl.CLEvent',
			'a5.cl.mvc.CLViewEvent')
	.Extends('CLMVCBase')
	.Static(function(CLView, im){
		
		CLView.customViewDefNodes = ['EventListener', 'Bind'];
		
		CLView._cl_calcOffsetObj = function(obj, calcProp, props){
			var i, l, isObj, propVal,
				changed = false,
				cachedProp = obj[calcProp];
			obj[calcProp] = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			for(i = 0, l=props.length; i<l; i++){
				propVal = obj[props[i]];
				isObj = typeof propVal === 'object';
				obj[calcProp].left += (isObj ? (propVal.left !== undefined ? propVal.left:0):propVal);
				obj[calcProp].right += (isObj ? (propVal.right !== undefined ? propVal.right:0):propVal);
				obj[calcProp].top += (isObj ? (propVal.top !== undefined ? propVal.top:0):propVal);
				obj[calcProp].bottom += (isObj ? (propVal.bottom !== undefined ? propVal.bottom:0):propVal);
			}
			obj[calcProp].width = obj[calcProp].left + obj[calcProp].right;
			obj[calcProp].height = obj[calcProp].top + obj[calcProp].bottom;
			return (obj[calcProp].left !== cachedProp.left || obj[calcProp].right !== cachedProp.right || obj[calcProp].top !== cachedProp.top || obj[calcProp].bottom !== cachedProp.bottom);
		}
		
		CLView._cl_setWH = function(obj, prop, param){
			//if(param.isDefault && obj.parentView()['_cl_rel' + (prop === 'width') ? 'X' : 'Y'] === true)
				//return obj[prop]('scroll');
			if(param.percent !== false){
				var parentScrolling = obj._cl_parentView[prop === 'width' ? 'scrollXEnabled' : 'scrollYEnabled']('state'),
					parentSize = parentScrolling ? (obj._cl_parentView[prop]('scroll') - obj._cl_parentView._cl_calculatedClientOffset[prop] - obj._cl_parentView._cl_calculatedOffset[prop]) : obj._cl_parentView[prop]('inner');
				return parentSize * param.percent;
			} else if(param.relative !== false) 
				return obj._cl_parentView[prop]('inner') + param.relative;
			else if(param.auto !== false)
				return obj[prop]('content') + obj._cl_calculatedClientOffset[prop] + obj._cl_calculatedOffset[prop];
			else if(param.relative === false && param.percent === false && param.auto === false) 
				return param.value;
			else
				return null;
		}
		
		CLView._cl_updateWH = function(obj, val, prop, propVal, min, max, setProp){
			var fullOffset = obj._cl_calculatedOffset[prop] + obj._cl_calculatedClientOffset[prop],
				retVal = val - fullOffset,
				maxDim;
			if(obj._cl_parentView.constrainChildren() && obj._cl_parentView['_cl_' + prop].auto === false){
				maxDim = (retVal || obj[prop]('inner')) + propVal;
				if (maxDim > obj._cl_parentView[prop]('inner')) retVal = obj._cl_parentView[prop]('inner') - propVal - fullOffset;
			}
			if (min !== null && (retVal + obj._cl_calculatedClientOffset[prop]) < min) retVal = min - obj._cl_calculatedClientOffset[prop];
			if (max !== null && (retVal + obj._cl_calculatedClientOffset[prop]) > max) retVal = max - obj._cl_calculatedClientOffset[prop];
			retVal = (retVal >= 0 ? retVal : 0);
			setProp.client = setProp.inner = setProp.content = retVal;
			setProp.offset = retVal + fullOffset;
			return retVal;
		}
				
		CLView._cl_updateXY = function(obj, propVal, align, inner, param){
			var retVal = 0,
				clientOffset = obj._cl_parentView ? obj._cl_parentView._cl_calculatedClientOffset[param === 'width' ? 'left' : 'top'] : 0;
			switch (align) {
				case "left":
				case "top":
					retVal = propVal + clientOffset;
					break;
				case "center":
				case "middle":
					retVal = inner / 2 - obj[param]() / 2 + propVal + clientOffset;
					if(retVal < clientOffset) retVal = clientOffset;
					break;
				case "right":
				case "bottom":
					retVal = inner - obj[param]() + propVal + clientOffset;
					break;
			}
			return retVal;
		}
		
		CLView._cl_initialRedraw = function(obj){
			if (obj._cl_initialized && !obj._cl_initialRenderComplete) {
				obj._cl_initialRenderComplete = true;
				if(obj._cl_visible) obj._cl_viewElement.style.display = obj._cl_defaultDisplayStyle;
			}
		}
		
		CLView._cl_viewCanRedraw = function(view){
			var isValid = true;
			if(!view._cl_viewElement) isValid = false;
			if(!view._cl_parentView) isValid = false;
			if(!view.visible() && view._cl_initialRenderComplete) isValid = false;
			if(view.suspendRedraws()) isValid = false;
			if(!isValid)
				view._cl_redrawPending = false;
			return isValid;
		}
		
		CLView._cl_useTransforms = false;
		
		CLView._cl_forceGPU = false;
	})
	
	
	.Prototype('CLView', function(proto, im, CLView){
		/**#@+
	 	 * @memberOf a5.cl.CLView#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_viewElement = null;
			this._cl_viewElementType = 'div';
			this._cl_viewIsReady = false;
			this._cl_parentView = null;
			this._cl_showOverflow = false;
			this._cl_alignX = 'left';
			this._cl_alignY = 'top';
			this._cl_x = {value:0, state:false, percent:false};
			this._cl_y = {value:0, state:false, percent:false};
			this._cl_alpha = 1;
			this._cl_visible = true;
			this._cl_width = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_height = {client:0, offset:0, inner:0, value:'100%', percent:1, relative:false, auto:false, isDefault:true, content:0};
			this._cl_minWidth = null;
			this._cl_minHeight = null;
			this._cl_maxWidth = null;
			this._cl_maxHeight = null;
			this._cl_borderWidth = {top:0, left:0, right:0, bottom:0};
			this._cl_padding = {top:0, left:0, right:0, bottom:0};
			this._cl_calculatedOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_calculatedClientOffset = {width:0, height:0, left:0, right:0, top:0, bottom:0};
			this._cl_redrawPending = false;
			this._cl_initialized = false;
			this._cl_initialRenderComplete = false;
			this._cl_id = null;
			this._cl_viewDefDefaults = {};
			this._cl_fromViewDef = false;
			this._cl_vdViewIsReady = false;
			this._cl_suspendRedraws = false;
			this._cl_suspendRedrawsDirect = false;
			this._cl_buildingFromViewDef = false;
			this._cl_pendingViewElementProps = {};
			this._cl_currentViewElementProps = {};
			this._cl_controller = null;
			this._cl_isInTree = false;
			this._cl_defaultDisplayStyle = 'block';
			
			this.skipViewDefReset = [];
		})
		
		proto.CLView = function(){
			proto.superclass(this);
			if(CLView._cl_transformProp === undefined)
				CLView._cl_transformProp = a5.cl.core.Utils.getCSSProp('transform');
			this._cl_viewElement = document.createElement(this._cl_viewElementType);
			this._cl_viewElement.className = proto.className.call(this);
			this._cl_viewElement.style.backgroundColor = 'transparent';
			this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = this._cl_showOverflow ? 'visible' : 'hidden';
			this._cl_viewElement.id =  proto.instanceUID.call(this);
			this._cl_viewElement.style.zoom = 1;
			this._cl_viewElement.style.position = 'absolute';
			this._cl_viewElement.style.display = 'none';
		}
		
		/**
		 * Creates the display element.
		 * @name draw
		 */
		proto.draw = function(parentView){
			if (!this._cl_initialized && !this._cl_initialRenderComplete) {
				this._cl_initialized = true;
				this._cl_setParent(parentView);
				this.redraw();
				this.viewReady();
			}
		}
		
		proto.id = function(value){ 
			var val =  this._cl_propGetSet('_cl_id', value, 'string');
			return val || this.instanceUID();
		}
		
		/**
		 * @name isChildOf
		 * @param {a5.cl.CLViewContainer} target
		 */
		proto.isChildOf = function(target){
			var parent = this._cl_parentView;
			while(parent){
				if(parent === target)
					return true;
				parent = parent._cl_parentView;
			}
			return false;
		}
		
		/**
		 * Set to true to disable redraws on this view (and its children) until suspendRedraws is set to false.
		 * @name suspendRedraws
		 * @param {Boolean} value
		 */
		proto.suspendRedraws = function(value, inherited){
			if (typeof value === 'boolean') {
				if(inherited !== true)
					this._cl_suspendRedrawsDirect = value;
				this._cl_suspendRedraws = value ? value : this._cl_suspendRedrawsDirect;
				if(!value)
					this.redraw();
				return this;
			}
			return this._cl_suspendRedraws;
		}
		
		/**
		 * @name index
		 */
		proto.index = function(){
			return parseInt(this._cl_viewElement.style.zIndex);
		}
		
		/**
		 * Called by the framework if data is passed to the view load.
		 * @name renderFromData
		 * @param {Object} data The data object.
		 */
		proto.renderFromData = function(data){}
		
		/**
		 * @name minWidth
		 * @param {Object} value
		 */
		proto.minWidth = function(value){ return this._cl_propGetSet('_cl_minWidth', value, 'number'); }
		
		/**
		 * @name minHeight
		 * @param {Object} value
		 */
		proto.minHeight = function(value){ return this._cl_propGetSet('_cl_minHeight', value, 'number'); }
		
		/**
		 * @name maxWidth
		 * @param {Object} value
		 */
		proto.maxWidth = function(value){ return this._cl_propGetSet('_cl_maxWidth', value, 'number'); }
		
		/**
		 * @name maxHeight
		 * @param {Object} value
		 */
		proto.maxHeight = function(value){ return this._cl_propGetSet('_cl_maxHeight', value, 'number'); }
		
		/**
		 * @name alignX
		 * @param {String} value
		 */
		proto.alignX = function(value){
			if (value !== undefined) {
				if(value === "left" || value === "center" || value === "right") {
					var shouldRedraw = (value !== this._cl_alignX);
					this._cl_alignX = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignX;
		}
		
		/**
		 * @name alignY
		 * @param {String} value
		 */
		proto.alignY = function(value){
			if (value !== undefined) {
				if (value === "top" || value === "middle" || value === "bottom") {
					var shouldRedraw = (value !== this._cl_alignY);
					this._cl_alignY = value;
					if(shouldRedraw) this.redraw;
				}
				return this;
			}
			return this._cl_alignY;
		}
		
		/**
		 * @name y
		 * @param {Object} value
		 */
		proto.y = function(value, duration, ease){ 
			if (value !== undefined) {
				if (value === true) 
					return this._cl_y.state !== false && 
									this.parentView() && 
									this.parentView().relY() ? this._cl_y.state : this._cl_y.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {y:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.y(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.y(true) + 
									parentView.scrollY() + 
									parentView._cl_calculatedOffset.top + 
									parentView._cl_calculatedClientOffset.top;
						parentView = parentView.parentView();
					}					
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_y.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_y.percent > 1) this._cl_y.percent = 1;
					if (this._cl_y.percent < 0) this._cl_y.percent = 0;
					var shouldRedraw = value !== this._cl_y.value;
					this._cl_y.value = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_y.value;
		}
		
		/**
		 * @name x
		 * @param {Object} value
		 */
		proto.x = function(value, duration, ease){ 
			if (value !== undefined) {
				if(value === true) 
					return this._cl_x.state !== false && 
									this.parentView() && 
									this.parentView().relX() ? this._cl_x.state : this._cl_x.value;
				if(typeof duration === 'number' && typeof value === 'number')
					return this.animate(duration, {x:value, ease:ease});
				if (typeof value === 'object') {
					var retVal = this.x(true),
					parentView = this.parentView();
					while(parentView){
						if(!parentView)
							return null;
						if(parentView === value)
							return retVal;
						retVal += 	parentView.x(true) + 
									parentView.scrollX() + 
									parentView._cl_calculatedOffset.left + 
									parentView._cl_calculatedClientOffset.left;
						parentView = parentView.parentView();
					}
				} else {
					var isPerc = typeof value === 'string' && value.indexOf('%') != -1;
					this._cl_x.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if (this._cl_x.percent > 1) this._cl_x.percent = 1;
					if (this._cl_x.percent < 0) this._cl_x.percent = 0;
					var shouldRedraw = value !== this._cl_x.value;
					this._cl_x.value = value;
					if(this._cl_x.state !== false && this.parentView() && this.parentView().relX())
						this._cl_x.state = value;
					if (shouldRedraw) this.redraw();
					return this;
				}
			}
			return this._cl_x.value;
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		proto.rotation = function(value){
			this._cl_css('transform', 'rotate(' + value + 'deg)', true);
		}
		
		proto.showOverflow = function(value){
			if(value){
				this._cl_viewElement.style.overflowX = this._cl_viewElement.style.overflowY = value === true ? 'visible' : 'hidden';
				this._cl_showOverflow = value;
				return this;
			}
			return this._cl_showOverflow;
		}
		
		/**
		 * @name background
		 * @param {Object} value
		 */
		proto.background = function(value){
			this._cl_viewElement.style.background = value;
			return this._cl_viewElement.style.background; 
		}
		
		/**
		 * @name backgroundColor
		 * @param {Object} value
		 * @param {Object} value2
		 * @param {Boolean} horizontalGradient
		 */
		proto.backgroundColor = function(value, value2, horizontalGradient){
			if(value) {
				this._cl_viewElement.style.backgroundColor = value;
				//if we're using filters, 
				if(this.cl().clientPlatform() === "IE" || this.cl().clientPlatform() === "WP7")
					this._cl_viewElement.style.filter = this._cl_viewElement.style.filter.replace(/progid:DXImageTransform\.Microsoft\.gradient\(.*?\)/gi, "");
				//if two valid hex colors were passed, use a gradient
				if(a5.cl.core.Utils.validateHexColor(value) && a5.cl.core.Utils.validateHexColor(value2)){
					if(this.cl().clientPlatform() === "IE" || this.cl().clientPlatform() === "WP7")
						this._cl_viewElement.style.filter += " progid:DXImageTransform.Microsoft.gradient(startColorstr='" + a5.cl.core.Utils.expandHexColor(value) + "', endColorstr='" + a5.cl.core.Utils.expandHexColor(value2) + "')";
					else {
						//try mozilla first
						this._cl_viewElement.style.background = "";
						this._cl_viewElement.style.background = "-moz-linear-gradient(" + (horizontalGradient === true ? 'left' : 'top') + ",  " + value + ",  " + value2 + ")";
						//if that didn't work, try the webkit version
					    if(this._cl_viewElement.style.background.indexOf('gradient') === -1)
					        this._cl_viewElement.style.background = "-webkit-gradient(linear, left top, " + (horizontalGradient === true ? 'right top' : 'left bottom') + ", from(" + value + "), to(" + value2 + "))";
					}
				} else {
					this._cl_viewElement.style.background = "";
					this._cl_viewElement.style.backgroundColor = value;
				}
				return this;
			}
			return this._cl_viewElement.style.backgroundColor;
		}
		
		/**
		 * @name alpha
		 * @param {Object} value
		 */
		proto.alpha = function(value, duration, ease){
			if(typeof value === 'number'){
				if(typeof duration === 'number')
					return this.animate(duration, {alpha:value, ease:ease});
				if (this.cl().clientPlatform() == 'IE' && this.cl().browserVersion() < 9) {
					this._cl_viewElement.style.filter = 
						this._cl_viewElement.style.filter.replace(/alpha\(.*?\)/gi, '') 
						+ ' alpha(opacity=' + (value * 100) + ')';
				} else 
					this._cl_viewElement.style.opacity = value + '';
				this._cl_alpha = value;
				return this;
			}
			return this._cl_alpha;
		}
		
		/**
		 * @name animate
		 * @param {Number} duration The duration of the animation, in seconds.
		 * @param {Object} props An object specifying the properties to animate, and the end-values as numbers.  Other special properties are also accepted, and are listed below.
		 * 
		 * @param {Number} [obj.delay] The length of time to delay before starting this animation (seconds).
		 * @param {Function|String} [obj.ease] The easing function.
		 * @param {Function} [obj.onStart] Function to be called when the animation starts.
		 * @param {Array} [obj.onStartParams] Parameters to be passed to onStart.
		 * @param {Function} [obj.onComplete] Function to be called when the animation completes.
		 * @param {Array} [obj.onCompleteParams] Parameters to be passed to onComplete
		 * @param {Object} [obj.startAt] An object specifying the start positions.
		 * @param {Boolean} [obj.redrawOnProgress=false] When set to true, the view will be redrawn at each step of the animation.  This allows the other views to react accordingly, but will generally be more processor-intensive, and may result in a choppier animation.
		 * @param {String} [obj.engine] The animation engine to use (specified by the process name, generally 'jsAnimation' or 'cssAnimation').  By default, the Animation addon will try to determine the best engine to use.
		 */
		proto.animate = function(duration, props){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if (plgn) {
				plgn.animate(this, duration, props);
			} else {
				this.warn('No animation plugin was found.');
				for(var prop in props){
					if (typeof proto[prop] === 'function')
						proto[prop].call(this, props[prop]);
				}
			}
			return this;
		}
		
		/**
		 * @name easing
		 */
		proto.easing = function(){
			var plgn = this.plugins().getRegisteredProcess('animation');
			if(plgn) return plgn.easing.call(this);
			else return {};
		}
		
		/**
		 * Shortcut for setting all border attributes.  Parameters can be direct values to be applied to all borders, or an object specifying values for each border.
		 * @name border
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 * @param {Object|String} style The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 * @param {Object|String} color The value to set for borderColor, or an object with values for top/right/bottom/left.
		 * @param {Object|Number} radius The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.border = function(width, style, color, radius){
			if(width !== undefined || style !== undefined || color !== undefined || radius !== undefined) {
				this.borderWidth(width || 0);
				this.borderStyle(style || 'solid');
				this.borderColor(color || '#000');
				this.borderRadius(radius || 0);
				return this;
			}
			return this._cl_viewElement.style.border;
		}
		
		/**
		 * Get or set the border width.
		 * @name borderWidth
		 * @param {Object|Number} width The value to set for borderWidth, or an object with values for top/right/bottom/left.
		 */
		proto.borderWidth = function(width, duration, ease){
			if(width !== undefined){
				if (typeof width === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderWidth:width, ease:ease});
					this._cl_viewElement.style.borderWidth = width + 'px';
				} else {
					for (var prop in width)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Width'] = (width[prop] || 0) + 'px';
				}
				this._cl_borderWidth = width;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_viewElement.style.borderWidth;
		}
		
		/**
		 * Get or set the border style.
		 * @name borderStyle
		 * @param {Object|String} width The value to set for borderStyle, or an object with values for top/right/bottom/left.
		 */
		proto.borderStyle = function(style){
			if(style !== undefined){
				if (typeof style === 'string') {
					this._cl_viewElement.style.borderStyle = style;
				} else {
					for (var prop in style)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Style'] = style[prop] || 'solid';
				}
				return this;
			}
			return this._cl_viewElement.style.borderStyle;
		}
		
		/**
		 * Get or set the border color.
		 * @name borderColor
		 * @param {Object|String} width The value to set for borderColor, or an object with values for top/right/bottom/left.
		 */
		proto.borderColor = function(color){
			if(color !== undefined){
				if (typeof color === 'string') {
					this._cl_viewElement.style.borderColor = color;
				} else {
					for (var prop in color)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Color'] = color[prop] || '#000';
				}
				return this;
			}
			return this._cl_viewElement.style.borderColor;
		}
		
		/**
		 * Get or set the border radius.
		 * @name borderRadius
		 * @param {Object|Number} width The value to set for borderRadius, or an object with values for top/right/bottom/left.
		 */
		proto.borderRadius = function(radius, duration, ease){
			if(radius !== undefined){
				if (typeof radius === 'number') {
					if(typeof duration === 'number')
						return this.animate(duration, {borderRadius:radius, ease:ease});
					this._cl_viewElement.style[a5.cl.core.Utils.getCSSProp('borderRadius')] = radius + 'px';
				} else {
					for (var prop in radius)
						this._cl_viewElement.style['border' + (a5.cl.core.Utils.initialCap(prop)) + 'Radius'] = (radius[prop] || 0) + 'px';
				}
				return this;
			}
			return this._cl_viewElement.style.borderRadius;
		}
		
		/**
		 * @name padding
		 * @param {Object} value
		 */
		proto.padding = function(value, duration, ease){
			if (value !== undefined) {
				if(typeof duration === 'number')
					return this.animate(duration, {padding:value, ease:ease});
				this._cl_padding = value;
				this._cl_calculateOffset();
				return this;
			}
			return this._cl_padding;
		}
		
		/**
		 * @name tooltip
		 * @param {Object} value
		 */
		proto.tooltip = function(value){
			if(typeof value === 'string'){
				this._cl_viewElement.title = value;
				return this;
			}
			return this._cl_viewElement.title;
		}
		
		/**
		 * @name viewReady
		 */
		proto.viewReady = function(){
			this._cl_viewIsReady = true;
			this.dispatchEvent(this.create(im.CLViewEvent, [im.CLViewEvent.VIEW_READY]));
		}
		
		proto.viewIsReady = function(){
			return this._cl_viewIsReady;
		}
		
		/**
		 * @name moveToParentView
		 * @param {a5.cl.CLViewContainer} view
		 */
		proto.moveToParentView = function(view){
			this.removeFromParentView();
			this._cl_clParentView = null;
			view.addSubView(this);
		}
		
		/**
		 * @name removeFromPaentView
		 */
		proto.removeFromParentView = function($shouldDestroy){
			if (this._cl_parentView) this._cl_parentView.removeSubView(this, $shouldDestroy);
		}
		
		/**
		 * Called when the view element is added to a parent view.
		 * @name addedToParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being added to.
		 */
		proto.addedToParent = function(parentView){
			
		}
		
		/**
		 * Called when the view element has been removed from a parent view.
		 * @name removedFromParent
		 * @param {a5.cl.CLViewContainer} parentView The parent view it is being removed from.
		 */	
		proto.removedFromParent = function(parentView){
			
		}
		
		/**
		 * Sets the view to be invisible.
		 * @name hide
		 */
		proto.hide = function(){
			this._cl_viewElement.style.display = 'none';
			this._cl_visible = false;
		}
		
		/**
		 * Sets the view to be visible.
		 * @name show
		 */
		proto.show = function(){
			this._cl_viewElement.style.display = this._cl_defaultDisplayStyle;
			this._cl_visible = true;
			this.redraw();
		}
		
		/**
		 * Gets or sets the visibiity state of the view.
		 * @name visible
		 * @param value {Boolean} Whether or not the view should be visible.
		 * @return {Boolean}
		 */
		proto.visible = function(value){
			if(typeof value === 'boolean'){
				if(value)
					this.show();
				else
					this.hide();
				return this;
			}
			return this._cl_visible;
		}
		
		/**
		 * @name parentView
		 */
		proto.parentView = function(){
			return this._cl_parentView;
		}
		
		/**
		 * @name toTop
		 */
		proto.toTop = function(){
			this.parentView().subViewToTop(this);
		}
		
		/**
		 * @name toBottom
		 */
		proto.toBottom = function(){
			this.parentView().subViewToBottom(this);
		}
		
		/**
		 * @name width
		 * @param {Object} value
		 */
		proto.width = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_width[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_width.auto = this._cl_width.percent = this._cl_width.relative = this._cl_width.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_width.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_width.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_width.percent > 1) this._cl_width.percent = 1;
					if(this._cl_width.percent < 0) this._cl_width.percent = 0;
					this._cl_width.relative = !isPerc ? parseFloat(value) : false;
					this._cl_width.auto = false;	
				}
			}
			var shouldRedraw = value !== this._cl_width.value;
			this._cl_width.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		/**
		 * @name height
		 * @param {Object} value
		 */
		proto.height = function(value, duration, ease){
			// GET
			if(value === undefined || value === null)
				value = 'offset';
			if(value === 'offset' || value === 'client' || value === 'content' || value === 'inner' || value === 'value')
				return this._cl_height[value];
			if(typeof duration === 'number' && typeof value === 'number')
				return this.animate(duration, {height:value, ease:ease});
			
			// SET
			this._cl_height.auto = this._cl_height.percent = this._cl_height.relative = this._cl_height.isDefault = false;
			if (typeof value === 'string') {
				if (value === 'auto') {
					this._cl_height.auto = true;
				} else {
					var isPerc = value.indexOf('%') != -1;
					this._cl_height.percent = isPerc ? (parseFloat(value.substr(0, value.length - 1)) / 100) : false;
					if(this._cl_height.percent > 1) this._cl_height.percent = 1;
					if(this._cl_height.percent < 0) this._cl_height.percent = 0;
					this._cl_height.relative = !isPerc ? parseFloat(value) : false;
				}
			}
			var shouldRedraw = value !== this._cl_height.value;
			this._cl_height.value = value;
			if(shouldRedraw) this.redraw();
			return this;
		}
		
		
		/**
		 * @name redraw
		 */
		proto.redraw = function(){
			if (!this._cl_redrawPending && this.parentView()) {
				this._cl_redrawPending = true;
				this.cl().MVC().redrawEngine().attemptRedraw(this);
			}
		}
		
		/**
		 * @ame isFullyVisible
		 */
		proto.isFullyVisible = function(){
			var thisView = this;
			while(thisView){
				if(!thisView.visible())
					return false;
				else
					thisView = thisView.parentView();
			}
			return true;
		}
		
		proto.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			switch(nodeName){
				case 'EventListener':
					this._cl_addEventListenerFromViewDef(node, imports);
					break;
				case 'Bind':
					this._cl_bindToEventFromViewDef(node, imports, rootView);
					break;
			}
		}
		
		proto._cl_addEventListenerFromViewDef = function(node, imports){
			var type = node.type,
				listener = (this._cl_controller instanceof a5.cl.CLController && node.view  !== true) ? this._cl_controller : this,
				target = (typeof node.target === 'string') ? this.getChildView(node.target) : this,
				method = listener[node.method],
				event;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error adding event listener: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error adding event listener: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error adding event listener: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//throw an error if the target couldn't be found
			if(!(target instanceof CLView)){
				a5.ThrowError('Error adding event listener: Could not find the target with id "' + node.target + '".  Make sure that the EventListener node comes after the node for the target view.');
				return;
			}
			if(typeof method !== 'function'){
				a5.ThrowError('Error adding event listener: Could not find the method "' + node.method + '". Note that the method must be publicly accessible.');
				return;
			}
			target.addEventListener(type, method, node.useCapture === true, this);
		}
		
		proto._cl_bindToEventFromViewDef = function(node, imports, rootView){
			var type = node.type,
				listener, singleton, method;
			//if an event was specified, resolve the event/constant to a string
			if(typeof node.event === 'string'){
				var event = a5.GetNamespace(node.event, imports);
				if(typeof event !== 'function'){
					a5.ThrowError('Error binding to event: Could not find the event class "' + node.event + '".');
					return;
				} else if(typeof node.type !== 'string'){
					a5.ThrowError('Error binding to event: No type specified for the event class "' + node.event + '".');
					return;
				}
				type = event[node.type];
				if(typeof type !== 'string'){
					a5.ThrowError('Error binding to event: Could not find the type "' + node.type + '" on class "' + node.event + '".');
					return;
				}
			}
			//if a listener was specified by ID, look for that ID.
			if(typeof node.listener === 'string'){
				listener = rootView.getChildView(node.listener);
				if(!listener){
					a5.ThrowError('Error binding to event: Could not find a listener with the ID "' + node.listener + '".');
					return;
				}
				//if this listener is a controller, and the view was specified, use the view instead
				if(listener instanceof a5.cl.CLController && node.view === true)
					listener = listener.view();
				if(!listener){
					a5.ThrowError('Error binding to event: The controller with ID "' + node.listener + '" does not have a view.');
					return;
				}
			}
			//if a listener was specified by a singleton, resolve the class to an intance 
			else if(typeof node.singleton === 'string'){
				singleton = a5.GetNamespace(node.singleton, imports);
				if(typeof singleon !== 'function'){
					a5.ThrowError('Error binding to event: Unable to locate the class "' + node.singleton + '". Make sure to import this class, or reference it with a fully-qualified package.');
					return;
				} else if(!singleton.isSingleton()){
					a5.ThrowError('Error binding to event: Listener class "' + node.singleton + '" is not a singleton. You should specify the listener by ID with the "listener" attribute.');
					return;
				}
				listener = singleon.instance();
			} else {
				a5.ThrowError('Error binding to event: No listener was specified.  Either specify a "listener" by ID, or a "singleton" by class.');
				return;
			}
			//resolve the method
			method = listener[node.method];
			if(typeof method !== 'function'){
				a5.ThrowError('Error binding to event: Could not find the method "' + node.method + '" on listener "' + (node.listener || node.singleton) + '". Note that the method must be publicly accessible.');
				return;
			}
			this.addEventListener(type, method, node.useCapture === true, listener);
		}
		
		proto.viewRedrawn = function(){}
		
		proto.addedToTree = function(){}
		
		proto.removedFromTree = function(){}
		
		proto.isInTree = function(){ return this._cl_isInTree; }
		
		/* PRIVATE METHODS */
		
		proto._cl_addedToTree = function(){
			this._cl_isInTree = true;
			this.addedToTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewAddedToTree();
		}
		
		proto._cl_removedFromTree = function(){
			this._cl_isInTree = false;
			this.removedFromTree();
			if(this._cl_controller)
				this._cl_controller._cl_viewRemovedFromTree();
		}
		
		proto._cl_addedToParent = function(parentView){
			this.addedToParent(parentView);
			if(parentView.isInTree())
				this._cl_addedToTree();
			//inherit suspendRedraws from the parent view
			proto.suspendRedraws.call(this, parentView.suspendRedraws());
			//if this view has received a vdViewReady() call, and its parent is still being built, alert the parent
			if (this._cl_vdViewIsReady && parentView._cl_buildingFromViewDef)
				parentView._cl_vdViewAdded();
			this.dispatchEvent(this.create(im.CLEvent, [im.CLEvent.ADDED_TO_PARENT]));
		}
		
		proto._cl_removedFromParent = function(parentView){
			this.removedFromParent(parentView);
			this._cl_removedFromTree();
			if(this._cl_viewElement)
				this._cl_viewElement.style.display = 'none';
			this._cl_initialRenderComplete = false;
			this.dispatchEvent(this.create(im.CLEvent, [im.CLEvent.REMOVED_FROM_PARENT]));
		}
		
		proto._cl_propGetSet = function(prop, value, type){
			if((type && typeof value === type) || (!type && value !== undefined) ){
				this[prop] = value;
				return this;
			}
			return this[prop];
		}
				
		proto._cl_css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.core.Utils.getCSSProp(prop);
			if(prop)
				this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		proto._cl_setParent = function(parentView){
			this._cl_parentView = parentView;
		}
		
		proto._cl_calculateOffset = function(){
			var offsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedOffset', ['_cl_borderWidth']),
				clientOffsetChanged = CLView._cl_calcOffsetObj(this, '_cl_calculatedClientOffset', ['_cl_padding']);
			if(offsetChanged || clientOffsetChanged)
				this.redraw();
		}
		
		proto._cl_redraw = function(force, suppressRender){
			if ((!this._cl_initialRenderComplete || this._cl_redrawPending || force) && a5.cl.CLView._cl_viewCanRedraw(this)) {
				var propXVal = this._cl_x.percent !== false ? (this._cl_parentView.width() * this._cl_x.percent) : this.x(true),
				propYVal = this._cl_y.percent !== false ? (this._cl_parentView.height() * this._cl_y.percent) : this.y(true),
				w = CLView._cl_setWH(this, 'width', this._cl_width),
				h = CLView._cl_setWH(this, 'height', this._cl_height),
				forceRedraw = (w !== undefined || h !== undefined);
				this._cl_pendingViewElementProps.width = w !== null ? (CLView._cl_updateWH(this, w, 'width', propXVal, this._cl_minWidth, this._cl_maxWidth, this._cl_width) + 'px') : undefined;
				this._cl_pendingViewElementProps.height = h !== null ? (CLView._cl_updateWH(this, h, 'height', propYVal, this._cl_minHeight, this._cl_maxHeight, this._cl_height) + 'px') : undefined;		
				this._cl_pendingViewElementProps.left = CLView._cl_updateXY(this, propXVal, this._cl_alignX, this._cl_parentView.width('inner'), 'width') + 'px';
				this._cl_pendingViewElementProps.top = CLView._cl_updateXY(this, propYVal, this._cl_alignY, this._cl_parentView.height('inner'), 'height') + 'px';
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				
				if(this._cl_redrawPending)
					this._cl_alertParentOfRedraw();
					
				this._cl_redrawPending = false;
				
				if(suppressRender !== true)
					this._cl_render();
				CLView._cl_initialRedraw(this);
				return {force:forceRedraw, shouldRedraw:true};
			}
			CLView._cl_initialRedraw(this);
			return {force:false, shouldRedraw:false};
		}
		
		proto._cl_alertParentOfRedraw = function(){
			//determine what changed
			var changes = {
				width: this._cl_pendingViewElementProps.width !== this._cl_currentViewElementProps.width,
				height: this._cl_pendingViewElementProps.height !== this._cl_currentViewElementProps.height,
				x: this._cl_pendingViewElementProps.left !== this._cl_currentViewElementProps.left,
				y: this._cl_pendingViewElementProps.top !== this._cl_currentViewElementProps.top
			}
			if(this._cl_parentView)
				this._cl_parentView._cl_childRedrawn(this, changes);
		}
		
		proto._cl_render = function(){
			if(CLView._cl_useTransforms && CLView._cl_transformProp){
				var val = '';
				if (this._cl_pendingViewElementProps.top !== undefined) {
					val += 'translateY(' + this._cl_pendingViewElementProps.top + ') ';
					this._cl_currentViewElementProps.top = this._cl_pendingViewElementProps.top;
				}
				if (this._cl_pendingViewElementProps.left !== undefined) {
					val += 'translateX(' + this._cl_pendingViewElementProps.left + ') ';
					this._cl_currentViewElementProps.left = this._cl_pendingViewElementProps.left;
				}
				if (val !== '') {
					if(CLView._cl_forceGPU)
						val += 'translateZ(0px)';
					this._cl_viewElement.style[CLView._cl_transformProp] = val;
				}				
			}
			
			for(var prop in this._cl_pendingViewElementProps){
				var value = this._cl_pendingViewElementProps[prop];
				if (this._cl_currentViewElementProps[prop] !== value)
					this._cl_currentViewElementProps[prop] = this._cl_viewElement.style[prop] = value;
			}
			this._cl_pendingViewElementProps = {};
			this.viewRedrawn();
		}
		
		proto._cl_setIndex = function(index){
			this._cl_viewElement.style.zIndex = index;
		}
		
		proto.Override.dispatchEvent = function(event, data, bubbles){
			var e = this._a5_createEvent(event, data, bubbles);
			var viewChain = this._cl_getViewChain();
			
			//capture phase
			e._a5_phase = a5.EventPhase.CAPTURING;
			for(var x = 0, y = viewChain.length ; x < y; x++){
				this._a5_dispatchEvent.call(viewChain[x], e);
			}
			
			//target phase
			e._a5_phase = a5.EventPhase.AT_TARGET;
			this._a5_dispatchEvent(e);
			
			//bubbling phase
			if(e.bubbles()){
				e._a5_phase = a5.EventPhase.BUBBLING;
				for(var x = viewChain.length - 1; x >= 0; x--){
					this._a5_dispatchEvent.call(viewChain[x], e);
				}
			}
			if(!e.shouldRetain()) e.destroy();
			e = null;
			viewChain = null;
		}
		
		proto._cl_getViewChain = function(){
			var chain = [];
			var link = this;
			while(link._cl_parentView){
				link = link._cl_parentView;
				chain.unshift(link);
			}
			return chain;
		}
		
		proto._cl_vdViewReady = function(){
			this._cl_vdViewIsReady = true;
			if(this._cl_parentView && !this._cl_controller)
				this._cl_parentView._cl_vdViewAdded();
			else if(this._cl_controller)
				this._cl_controller._cl_viewReady();
		}
		
		proto._cl_destroyElement = function(elem){
			this.MVC().garbageCollector().destroyElement(elem);
		}
		
		proto.dealloc = function(){
			if(this._cl_parentView)
				this.removeFromParentView();
			this._cl_destroyElement(this._cl_viewElement);
			this._cl_viewElement = null;
		}
});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLMVCBase')
	.Class('EnvManager', function(cls, im){
		
		var _scrollBarWidth,
			_windowProps = {},
			_forcedClientEnvironment,
			_clientEnvironment;
		
		cls.EnvManager = function(){
			cls.superclass(this);
			getScrollBarWidth();
			cls.cl().addEventListener(im.CLEvent.ORIENTATION_CHANGED, updateResize);
			cls.cl().addEventListener(im.CLEvent.WINDOW_RESIZED, updateResize);
			_forcedClientEnvironment = _clientEnvironment = cls.cl().clientEnvironment();
			updateResize();
		}	
		
		cls.cl().clientEnvironment = function(forced){
			return forced ? _forcedClientEnvironment:a5.cl.core.EnvManager.instance().clientEnvironment();
		}
		
		this.scrollBarWidth = function(){ return _scrollBarWidth; }
		this.windowProps = function(force){ 
			if (force) return updateResize(true);
			else return _windowProps;
		}
		
		
		var updateResize = function($directRequest){
			var directRequest = $directRequest === true ? true:false;
			var elem = null;
			if (document.body && document.body.clientHeight) elem = document.body;
			else if (document.documentElement && document.documentElement.clientHeight) elem = document.documentElement;
			if (elem) {
				_windowProps.height = elem.clientHeight;
				_windowProps.width = elem.clientWidth;
				_windowProps.scrollHeight = elem.scrollHeight;
				_windowProps.scrollWidth = elem.scrollWidth;
			} else if (typeof(window.innerHeight) == 'number') {
		        _windowProps.height = window.innerHeight;
				_windowProps.width = window.innerWidth;
				_windowProps.scrollHeight = window.innerHeight + window.scrollMaxY;
				_windowProps.scrollWidth = window.innerWidth + window.scrollMaxX;
		    }
			if(_windowProps.scrollHeight === 0) _windowProps.scrollHeight = _windowProps.height;
			if(_windowProps.scrollWidth === 0) _windowProps.scrollWidth = _windowProps.width;
			if(cls.config().clientEnvironmentOverrides){
				if(_forcedClientEnvironment === "MOBILE" && _windowProps.width >= cls.config().mobileWidthThreshold){
					_forcedClientEnvironment = _clientEnvironment;
					cls.cl().dispatchEvent(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, [_forcedClientEnvironment])
				} else if(_forcedClientEnvironment !== "MOBILE" && _windowProps.width < cls.config().mobileWidthThreshold){
					_forcedClientEnvironment = "MOBILE";
					cls.cl().dispatchEvent(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, [_forcedClientEnvironment])
				}
			}
			if (directRequest) {
				return _windowProps;
			} else {
				cls.cl().MVC().redrawEngine().triggerAppRedraw(true);
			}
		}
		
		var getScrollBarWidth = function(){
		    var outer = null, inner = null, width = 0, scrollWidth = 0;	
		    outer = document.createElement('div');
		    outer.style.position = 'absolute';
		   	outer.style.left = outer.style.top = '-500px';
		    outer.style.height = outer.style.width = '100px';
		    outer.style.overflow = 'hidden';
		    inner = document.createElement('div');
		    inner.style.width = '100%';
		    inner.style.height = '500px';
		    outer.appendChild(inner);
		    document.getElementsByTagName('body')[0].appendChild(outer);
		    width = outer.clientWidth;
		    outer.style.overflow = 'scroll';
		    scrollWidth = outer.clientWidth;
		    document.getElementsByTagName('body')[0].removeChild(outer);
		    _scrollBarWidth = width - scrollWidth;
			outer = inner = null;
		}	
})

a5.Package('a5.cl.mvc.core')
	.Static('XMLUtils', function(XMLUtils){
		
		XMLUtils.parseXML = function(xmlString){
			var xml;
			if (window.DOMParser) { // Standards method
				xml = (new DOMParser()).parseFromString(xmlString, "text/xml");
				//check for a parser error
				if (xml.documentElement.nodeName === "parsererror"){
					throw xml.documentElement.childNodes[0].nodeValue;
					return;
				}
			} else { // Internet Explorer method
				xml = new ActiveXObject("Msxml2.DOMDocument.3.0");
				xml.async = "false";
				xml.loadXML(xmlString);
				//check for a parser error
				if (xml.parseError.errorCode != 0){
				    throw ("Error parsing XML. Line " + xml.parseError.line +
					    " position " + xml.parseError.linePos +
					    "\nError Code: " + xml.parseError.errorCode +
		    			"\nError Reason: " + xml.parseError.reason +
					    "Error Line: " + xml.parseError.srcText);
					return;
				}
			}
			//check for a webkit parser error
			if(xml.documentElement.textContent && xml.documentElement.textContent.indexOf('This page contains the following errors:') === 0){
				var msg = xml.documentElement.textContent.replace('This page contains the following errors:', 'Error parsing XML: ');
				throw msg;
			}
			return xml;
		}
		
		XMLUtils.getElementsByTagNameNS = function(xmlElement, tagName, namespaceURI, prefix){
			if(typeof xmlElement.getElementsByTagNameNS === 'function')
				return xmlElement.getElementsByTagNameNS(namespaceURI, tagName);
			else
				return xmlElement.getElementsByTagName(prefix + ':' + tagName);
		}
		
		XMLUtils.getNamedItemNS = function(attributes, attrName, namespaceURI, prefix){
			if(typeof attributes.getNamedItemNS === 'function')
				return attributes.getNamedItemNS(namespaceURI, attrName);
			else
				return attributes.getNamedItem(prefix + ':' + attrName);
		}
		
		XMLUtils.localName = function(xml){
			if(typeof xml.localName === 'string')
				return xml.localName;
			else
				return (xml.tagName ? xml.tagName : xml.name).replace(/.+?:/, '');
		}
		
		XMLUtils.children = function(xmlNode){
			if(xmlNode.children){
				return xmlNode.children;
			} else {
				var children = [],
					x, y, thisNode;
				for(x = 0, y = xmlNode.childNodes.length; x < y; x++){
					thisNode = xmlNode.childNodes[x];
					if(thisNode.nodeType === 1)
						children.push(thisNode);
				}
				return children;
			}
		}
		
		XMLUtils.getPrefix = function(xml){
			if(typeof xml.prefix !== 'undefined'){
				return xml.prefix;
			} else {
				var splitName = xml.tagName ? xml.tagName.split(':') : xml.name.split(':');
				return (splitName.length > 1 ? splitName[0] : null);
			}
		}
	});


a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.*',
			'a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils')
	.Extends('a5.cl.CLMVCBase')
	.Static(function(ViewDefParser, im){
		ViewDefParser._cl_ns = 'http://corelayerjs.com/';
		ViewDefParser._cl_nsPrefix = 'cl';
		
		ViewDefParser.getImports = function(xml){
			//get the cl:Import nodes
			var importsNode = ViewDefParser.getElementsByTagName(xml.documentElement, 'Imports'),
				imports = (importsNode && importsNode.length > 0) ? ViewDefParser.getElementsByTagName(importsNode[0], 'Import') : [], 
				namespaces = [],
				x, y, importNode;
			for(x = 0, y = imports.length; x < y; x++){
				importNode = imports[x];
				namespaces.push(importNode.getAttribute('ns'));
			}
			return a5._a5_processImports(namespaces);
		}
		
		ViewDefParser._cl_getEnvironmentNode = function(rootNode, environmentName, environmentValue){
			var children = im.XMLUtils.children(rootNode);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if (thisNode.prefix === ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName) {
					//if this tag value contains the target value, return the node
					if (thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1) 
						return thisNode;
				}
			}
			return null;
		}
		
		ViewDefParser._cl_resolveQualifiedClass = function(ns, imports){
			var classRef = a5.GetNamespace(ns.replace(/_/g, '.'));
			if(typeof imports === 'object')
				imports[ns] = classRef;
			return classRef;
		}
		
		ViewDefParser.getElementsByTagName = function(xml, tagName){
			return im.XMLUtils.getElementsByTagNameNS(xml, tagName, ViewDefParser._cl_ns, ViewDefParser._cl_nsPrefix);
		}
		
		ViewDefParser.processAttribute = function(value){
			//first split the value (pipe delimited)
			var attributes = value.split('|'),
				json = window.JSON || a5.cl.core.JSON,
			//regex for detecting strict typing
				typeFlags = /{RegExp}|{Boolean}|{Number}|{Array}|{String}|{Object}|{Namespace}/,
			//loop through each attribute value and process it
				processed = [],
				x, y, attr, type;
			for(x = 0, y = attributes.length; x < y; x++){
				attr = attributes[x];
				//determine the type
				type = typeFlags.exec(attr);
				if(im.Utils.isArray(type))
					type = type[0];
				//remove the type flag from the value
				attr = attr.replace(typeFlags, '');
				switch(type){
					case '{Boolean}': //force to a boolean
						processed.push(attr === 'true');
						break;
					case '{Number}': //use parseInt to force to a number
						processed.push(parseInt(attr));
						break;
					case '{Array}':
					case '{Object}': //use JSON to parse an array or object
						processed.push(json.parse(attr));
						break;
					case '{String}': //force to String
						processed.push(attr + '');
						break;
					case '{Namespace}': //resolve namespace
						processed.push(a5.GetNamespace(attr, this._cl_imports));
						break;
					case '{RegExp}': // resolve regexp
						var split = attr.split('/');
						processed.push(new RegExp(split[1], split[2]));
						break;
					default: //try to guess by default
						if(!isNaN(attr)){ //check if it's a number
							processed.push(parseFloat(attr));
						} else if(attr === 'true' || attr === 'false') {//check if it's a boolean
							processed.push(attr === 'true');
						} else if(/(^\[.*\]$)|(\{.*\})$/.test(attr)){ //check if it looks like an object or an array
							try{ processed.push(json.parse(attr)) } catch(e) { processed.push(attr + ''); };
						} else { //otherwise, force to string
							processed.push(attr + '');
						}
				}
			}
			return processed;
		}
	})
	.Prototype('ViewDefParser', function(proto, im, ViewDefParser){
		
		proto.ViewDefParser = function(xml, controller){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = (typeof xml === 'string') ? im.XMLUtils.parseXML(xml) : xml;
			this._cl_rootView = controller.view();
			this._cl_imports = ViewDefParser.getImports(this._cl_xml);
			this._cl_definitionNode = this._cl_getDefinitionNode();
			this._cl_defaultsNode = this._cl_getDefaults();
			//this._cl_perfTest = this.cl().plugins().PerformanceTester().createTimer(this.instanceUID());
			
			if(!this._cl_definitionNode) {
				this.redirect(500, 'Unable to find a valid cl:Definition element in the view definition.');
				return;
			}
		}
		
		proto.parse = function(viewReadyCallback, buildCompleteCallback, scope){
			//this._cl_perfTest.startTest();
			if(this._cl_rootView)
				this._cl_definitionNode = this._cl_getDefinitionNode();
			var firstChild = im.XMLUtils.children(this._cl_definitionNode)[0],
				builder = this.create(a5.cl.core.viewDef.ViewBuilder, [this._cl_controller, firstChild, this._cl_defaultsNode, this._cl_imports, this._cl_rootView]);
			
			builder.build(
				//view ready
				function(view){
					this._cl_rootView = view;
					if(typeof viewReadyCallback === 'function') 
						viewReadyCallback.call(scope, view);
				},
				//build complete
				function(view){
					//this._cl_perfTest.completeTest();
					if(typeof buildCompleteCallback === 'function')
						buildCompleteCallback.call(scope, view);
				},
				this, this._cl_rootView
			);
		}
		
		proto.hasOrientationOptions = function(){
			var orientationNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Orientation');
			return (orientationNodes && orientationNodes.length > 0);
		}
		
		proto.hasEnvironmentOptions = function(targetEnv){
			var envNodes = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Environment');
			if(envNodes && envNodes.length > 0){
				if(typeof targetEnv === 'string'){
					for(var x = 0, y = envNodes.length; x < y; x++){
						var thisNode = envNodes[x];
						if(im.Utils.arrayIndexOf(thisNode.getAttribute('value').split('|'), targetEnv) > -1)
							return true;
					}
					return false;
				}
				return true;
			}
			return false;
		}
		
		proto._cl_getDefaults = function(){
			//get the cl:Defaults node
			var defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Defaults');
			return (defNode && defNode.length > 0) ? defNode[0] : null;
		}
		
		proto._cl_getDefinitionNode = function(){
			var clientEnvironment = this.cl()._core().envManager().clientEnvironment(true).toUpperCase(),
				clientPlatform = this.cl()._core().envManager().clientPlatform().toUpperCase(),
				clientOrientation = this.cl()._core().envManager().clientOrientation().toUpperCase(),
				defNode = ViewDefParser.getElementsByTagName(this._cl_xml.documentElement, 'Definition'),
				definition = (defNode && defNode.length > 0) ? defNode[0] : null,
				env = ViewDefParser._cl_getEnvironmentNode(definition, 'Environment', clientEnvironment);
			
			if(definition && env){
				//check it for an appropriate Platform node
				var plat = ViewDefParser._cl_getEnvironmentNode(env, 'Platform', clientPlatform);
				if(plat){
					//if an appropriate Platform node was found, check it for an appropriate Orientation node
					var orient = ViewDefParser._cl_getEnvironmentNode(plat, 'Orientation', clientOrientation);
					if(orient.length > 0)
						return orient;	//if one was found, return it
					else
						return plat;	//otherwise, platform is as specific as we can get, so return that
						
				} else {
					//if no Platform was found, check for a loose Orientation
					var orient = ViewDefParser._cl_getEnvironmentNode(env, 'Orientation', clientOrientation);
					if(orient)
						return orient;	//if one was found, return it
					else
						return env;		//otherwise, environment is as specific as we can get, so return that
				}
			} else {
				//no Environment tag was found, so just return the raw definition node
				return definition;
			}
		}
	});


a5.Package('a5.cl.core.viewDef')
	.Import('a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils',
			'a5.cl.CLView')
	.Extends('a5.cl.CLMVCBase')
	.Static(function(ViewBuilder, im){
		ViewBuilder._cl_isInternalNodeType = function(node){
			var internalNodes = ['Imports', 'Defaults', 'Definition', 'Environment', 'Platform', 'Orientation'];
			if(node.prefix !== im.ViewDefParser._cl_nsPrefix || node.namespaceURI !== im.ViewDefParser._cl_ns) return false;
			for(var x = 0, y = internalNodes.length; x < y; x++){
				if(im.XMLUtils.localName(node) === internalNodes[x]) return true;
			}
			return false;
		}
	})
	.Prototype('ViewBuilder', function(proto, im, ViewBuilder){
		
		this.Properties(function(){
			this._cl_xml = null;
			this._cl_defaults = null;
			this._cl_imports = null;
			this._cl_rootView = null;
			this._cl_ids = null;
			this._cl_id = null;
			this._cl_view = null;
			this._cl_childIndex = 0;
			this._cl_children = null;
			this._cl_viewName = null;
			this._cl_viewReadyCallback = null;
			this._cl_buildCompleteCallback = null;
			this._cl_callbackScope
			this._cl_isCustomNode = false;
		});
		
		proto.ViewBuilder = function(controller, xml, defaults, imports, rootView, ids){
			proto.superclass(this);
			
			this._cl_controller = controller;
			this._cl_xml = xml;
			this._cl_defaults = defaults;
			this._cl_imports = imports;
			this._cl_rootView = rootView;
			this._cl_ids = ids || [];
			this._cl_children = im.XMLUtils.children(xml);
			this._cl_viewName = im.XMLUtils.localName(xml);
			
			//if(!ViewBuilder.perfTest)
			//	ViewBuilder.perfTest = this.cl().plugins().PerformanceTester().createTimer('viewBuilder');
		}
		
		proto.build = function(viewReadyCallback, buildCompleteCallback, callbackScope, view){
			//ViewBuilder.perfTest.startTest();
			this._cl_viewReadyCallback = viewReadyCallback;
			this._cl_buildCompleteCallback = buildCompleteCallback;
			this._cl_callbackScope = callbackScope;
			var xml = this._cl_xml,
				ns = im.ViewDefParser._cl_ns,
				nsPrefix = im.ViewDefParser._cl_nsPrefix;
			if(view instanceof im.CLView){
				var customNodeAttr = xml.attributes.getNamedItem('_isCustomNode');
				if(customNodeAttr)
					this._cl_isCustomNode = customNodeAttr.value === 'true';
				//if a view was passed in, we don't need to build it
				this._cl_viewCreated(view);
			} else {
				//if this node has the proper namespace and is not an internal node type...
				var hasNamespace = xml.namespaceURI === ns && xml.prefix === nsPrefix,
					isInternalNode = im.ViewBuilder._cl_isInternalNodeType(xml);
				if(hasNamespace && !isInternalNode) {
					//get the 'id' attribute
					var idAttr = xml.attributes.getNamedItem('id');
					if(idAttr) this._cl_id = idAttr.value;
					//get the ViewDef attribute
					view = this._cl_findChild(this._cl_id);
					//if there's already a view for that ID, jump to this._cl_viewCreated().
					if(view instanceof im.CLView && im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {
						this._cl_viewCreated(view);
					} else if(!this._cl_id || im.Utils.arrayIndexOf(this._cl_ids, this._cl_id) === -1) {							
						var classDef = this._cl_imports[this._cl_viewName] || im.ViewDefParser._cl_resolveQualifiedClass(this._cl_viewName, this._cl_imports);
						if(!classDef){
							this.redirect(500, 'Error parsing the view definition. ' + im.XMLUtils.localName(xml) + ' could not be found.  Make sure this class was imported into the view definition and included in the dependencies.');
							return;
						}
						//check if constructor params were set on this node
						var constructAttr = im.XMLUtils.getNamedItemNS(xml.attributes, 'Construct', ns, nsPrefix),
							constructParams = constructAttr ? im.ViewDefParser.processAttribute(constructAttr.value) : [];
						//create an instance
						view = this.create(classDef, constructParams);
						if(view instanceof im.CLView) {
							//if it's a CLView, send it to this._cl_viewCreated()
							this._cl_viewCreated(view);
						} else if(view instanceof a5.cl.CLController){
							//if the new view is actually a controller, generate the view
							var controller = view;
							view = null;
							controller.id(this._cl_id);
							//compile a list of reserved node names for this class and all of its ancestors
							this._cl_compileCustomNodes(controller);
							this._cl_controller._cl_childControllers.push(controller);
							//get the view from the controller
							controller.generateView(this._cl_viewCreated, this);
						}
					} else {
						this.redirect(500, 'Error: Duplicate id (' + this._cl_id + ') found in view definition.');
						return;
					}
				} else {
					//if there's nothing to create, stop here
					if(typeof this._cl_buildCompleteCallback === 'function')
						this._cl_buildCompleteCallback.call(this._cl_callbackScope, null);
				}
			}
		}
		
		proto._cl_viewCreated = function(view){
			//ViewBuilder.perfTest.completeTest();
			this._cl_view = view;
			view._cl_fromViewDef = true;
			view._cl_vdViewIsReady = false;
			if (!this._cl_rootView) {
				this._cl_rootView = view;
				view._cl_controller = this._cl_controller;
			}
			if(this._cl_id)
				view.id(this._cl_id);
			this._cl_ids.push(view.id());
			//if this view doesn't have a controller, reset all the ViewDef stuff
			if(!view._cl_controller || view === this._cl_rootView){
				this._cl_removeViewDefViews(); //remove any previously added subviews 
				this._cl_resetViewProperties(); //reset any previously set properties
				//compile a list of reserved node names for this class and all of its ancestors
				this._cl_compileCustomNodes();
			}
			this._cl_applyAttributeTree();
			//alert the parent builder that the view is ready
			if(typeof this._cl_viewReadyCallback === 'function')
				this._cl_viewReadyCallback.call(this._cl_callbackScope, view);
			//create the child views, if necessary
			this._cl_childIndex = 0;
			view._cl_pendingChildren = this._cl_children.length;
			this._cl_buildNextChild();
		}
		
		proto._cl_buildNextChild = function(){
			if(this._cl_children && this._cl_childIndex < this._cl_children.length){
				this._cl_view._cl_buildingFromViewDef = true;
				var thisChild = this._cl_children[this._cl_childIndex],
					hasController = this._cl_view._cl_controller instanceof a5.cl.CLController && this._cl_view !== this._cl_rootView,
					customNodes = hasController ? this._cl_view._cl_controller.constructor._cl_customViewDefNodes : this._cl_view.constructor._cl_customViewDefNodes,
					customNodeTarget = hasController ? this._cl_view._cl_controller : this._cl_view,
					customControllerNodes = this._cl_view === this._cl_rootView ? this._cl_compileCustomNodes(this._cl_controller) : [],
					localName = im.XMLUtils.localName(thisChild);
				//if this node is a reserved custom node type, let the view handle it.
				if(im.Utils.arrayContains(customNodes, localName) || im.Utils.arrayContains(customControllerNodes, localName)){
					var nodeObj = this._cl_convertNodeToObject(thisChild);
					if(im.Utils.arrayContains(customControllerNodes, localName))
						customNodeTarget = this._cl_controller;
					customNodeTarget.processCustomViewDefNode(nodeObj._name, nodeObj, this._cl_imports, this._cl_defaults, this._cl_rootView);
					this._cl_childIndex++;
					//Added method check due to CLView being a possible node owner
					if(this._cl_view._cl_vdViewAdded && !this._cl_isCustomNode)
						this._cl_view._cl_vdViewAdded();
					this._cl_buildNextChild();
					return;
				} else if(!hasController || this._cl_view === this._cl_rootView){
					//otherwise, assume it's a subview, and build it.
					var builder = this.create(im.ViewBuilder, [this._cl_controller, thisChild, this._cl_defaults, this._cl_imports, this._cl_rootView, this._cl_ids]);
					builder.build(this._cl_viewReadyHandler, this._cl_buildCompleteHandler, this);
				} else {
					this.throwError("Error parsing view definition for " + this._cl_controller.id() + ".  Views cannot be applied to the controller '" + this._cl_view._cl_controller.id() + "'.  Use a separate view definition to define the view structure for each controller.");
					return;
				}
			} else {
				//Added method check due to CLView being a possible node owner
				if (this._cl_view._cl_vdViewReady && this._cl_childIndex === 0 && !this._cl_isCustomNode) 
					this._cl_view._cl_vdViewReady();
				if(typeof this._cl_buildCompleteCallback === 'function')
					this._cl_buildCompleteCallback.call(this._cl_callbackScope, this._cl_view);
				this._cl_view.suspendRedraws(false);
				this.destroy();
			}
		}
		
		proto._cl_findChild = function(id){
			if(typeof id !== 'string' || !this._cl_rootView)
				return null;
			//first, look in the child views of the root view
			var child = this._cl_rootView.getChildView(id),
				x, y, thisOrphan;
			if(child)
				return child;
			//if no matching child was found, check the orphanage
			for(x = 0, y = this._cl_controller._cl_orphanage.length; x < y; x++){
				thisOrphan = this._cl_controller._cl_orphanage[x];
				if(thisOrphan.id() === id)
					return thisOrphan;
			}
			//finally, check the child controllers
			return this._cl_controller.getChildController(id);
			
		}
		
		proto._cl_viewReadyHandler = function(childView){
			if (childView) {
				this._cl_view.addSubViewAtIndex(childView, this._cl_childIndex);
				if(childView._cl_controller)
					this._cl_view._cl_vdViewAdded();
			}
		}
		
		proto._cl_buildCompleteHandler = function(view){
			this._cl_childIndex++;
			this._cl_buildNextChild();
		}
		
		proto._cl_removeViewDefViews = function(view){
			if(!view)
				view = this._cl_view;
			if(!(view instanceof a5.cl.CLViewContainer) || !view._cl_fromViewDef)
				return;
			var childViews = view._cl_childViews.slice(0),
				x, y, thisChild;
			for(x = 0, y = childViews.length; x < y; x++){
				thisChild = childViews[x];
				if (thisChild._cl_fromViewDef) {
					this._cl_controller._cl_orphanage.push(thisChild);
					this._cl_removeViewDefViews(thisChild);
					view.removeSubView(thisChild, false);
				}
			}
		}
		
		proto._cl_resetViewProperties = function(){
			var view = this._cl_view;
			for(var prop in view._cl_viewDefDefaults){
				//make sure this property isn't supposed to be skipped
				if (im.Utils.arrayIndexOf(view.skipViewDefReset, prop) === -1) {
					//if it's a method, use call(), otherwise set the value directly
					if (typeof view[prop] === 'function') 
						view[prop].call(view, view._cl_viewDefDefaults[prop]);
					else
						view[prop] = view._cl_viewDefDefaults[prop];
				}
			}
		}
		
		proto._cl_applyAttributeTree = function(){
			var defaults = this._cl_defaults;
			//set the defaults first
			if (defaults) {
				//start at the top with the global defaults
				this._cl_applyDefaults(defaults);
				//get the environment variables
				var clientEnvironment = this.cl()._core().envManager().clientEnvironment(true).toUpperCase(),
					clientPlatform = this.cl()._core().envManager().clientPlatform().toUpperCase(),
					clientOrientation = this.cl()._core().envManager().clientOrientation().toUpperCase();
				//apply top-level environment attributes
				var envNodes = this._cl_applyEnvironmentDefaults(defaults, 'Environment', clientEnvironment);
				//apply loose orientation attributes
				for(var x = 0, y = envNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(envNodes[x], 'Orientation', clientOrientation);
				}
				//apply top-level platform attributes
				var platformNodes = [];
				for(var x = 0, y = envNodes.length; x < y; x++){
					var thesePlatforms = this._cl_applyEnvironmentDefaults(envNodes[x], 'Platform', clientPlatform);
					platformNodes.push.apply(platformNodes, thesePlatforms);
				}
				//apply orientation attributes nested within a platform node
				for(var x = 0, y = platformNodes.length; x < y; x++){
					this._cl_applyEnvironmentDefaults(platformNodes[x], 'Orientation', clientOrientation);
				}
			}
			//finally, set the instance-specific attributes
			this._cl_applyAttributes(this._cl_xml);
		}
		
		proto._cl_applyEnvironmentDefaults = function(defaults, environmentName, environmentValue){
			var nodes = [],
				children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(thisNode.prefix === im.ViewDefParser._cl_nsPrefix && im.XMLUtils.localName(thisNode) === environmentName){
					//if this tag value contains the target value...
					if(thisNode.getAttribute('value').toUpperCase().indexOf(environmentValue) !== -1){
						//apply the Env defaults
						this._cl_applyDefaults(thisNode);
						//cache this node for later
						nodes.push(thisNode);
					}
				}
			}
			return nodes;
		}
		
		proto._cl_applyDefaults = function(defaults){
			var children = im.XMLUtils.children(defaults);
			for (var x = 0, xl = children.length; x < xl; x++) {
				var thisNode = children[x];
				if(im.XMLUtils.localName(thisNode) === this._cl_viewName){
					this._cl_applyAttributes(thisNode);
				}
			}
		}
		
		proto._cl_applyAttributes = function(xmlNode){
			var x, y, attr, attrName, recipient;
			//loop through the attributes on the xmlNode
			for (var x = 0, y = xmlNode.attributes.length; x < y; x++) {
				attr = xmlNode.attributes[x];
				//if it's not 'id', apply it to the view
				attrName = im.XMLUtils.localName(attr);
				if(attrName !== 'id' && im.XMLUtils.getPrefix(attr) !== im.ViewDefParser._cl_nsPrefix){
					//if this view has a controller, try to set the property/method on the controller, but fall back to the view itself
					recipient = (this._cl_view._cl_controller && typeof this._cl_view._cl_controller[im.XMLUtils.localName(attr)] !== 'undefined') ? this._cl_view._cl_controller : this._cl_view;
					if (typeof recipient[attrName] === 'function') {
						//if this property hasn't been cached yet, do so before setting it
						if (!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName].apply(recipient, this._cl_getParamsForRetrievingDefault(attrName));
						recipient[attrName].apply(recipient, im.ViewDefParser.processAttribute(attr.value));
					} else {
						//if this property hasn't been cached yet, do so before setting it
						if(!recipient._cl_viewDefDefaults[attrName])
							recipient._cl_viewDefDefaults[attrName] = recipient[attrName];
						recipient[attrName] = im.ViewDefParser.processAttribute(attr.value)[0];
					}
				}
			}
		}
		
		proto._cl_getParamsForRetrievingDefault = function(attrName){
			switch(attrName){
				case 'width':
				case 'height':
					return ['value'];
				default:
					return [];
			}
		}
		
		proto._cl_compileCustomNodes = function(obj){
			var baseObj = obj || this._cl_view,
				descenderRef = baseObj.constructor,
				compiled = [];
			//if the list has already been compiled for this class, we don't have to do anything
			if(im.Utils.isArray(baseObj.constructor._cl_customViewDefNodes))
				return baseObj.constructor._cl_customViewDefNodes;
			//otherwise, climb the family tree
			while(descenderRef !== null) {
				var theseNodes = descenderRef.customViewDefNodes || [];
				Array.prototype.push.apply(compiled, theseNodes);
				descenderRef = descenderRef.superclass && descenderRef.superclass().constructor.namespace ? descenderRef.superclass().constructor : null;
			}
			baseObj.constructor._cl_customViewDefNodes = compiled;
			return compiled;
		}
		
		proto._cl_convertNodeToObject = function(node){
			var obj = {};
			obj._name = im.XMLUtils.localName(node);
			obj.node = node;
			for(var x = 0, y = node.attributes.length; x < y; x++){
				var thisAttr = node.attributes[x];
				obj[thisAttr.name] = im.ViewDefParser.processAttribute(thisAttr.value);
				if(obj[thisAttr.name].length === 1)
					obj[thisAttr.name] = obj[thisAttr.name][0];
			}
			node.setAttribute('_isCustomNode', 'true');
			return obj;
		}
	});



a5.Package("a5.cl.mvc.core")


	.Extends("a5.cl.CLMVCBase")
	.Class("Filters", 'singleton final', function(self){
		
		var filters;
		
		this.Filters = function(){
			self.superclass(this);
			filters = ['_cl_appPlaceholder'];
		}
		
		
		this.addFilter = function(params, $append){
			var append = $append || false;
			if(typeof append === 'number') filters.splice(append, 0, params);
			else if(append) filters.push(params);
			else filters.unshift(params);
		}
		
		this.addAppFilters = function($filters){
			var placeHolderIndex;
			for(var i = 0, l=filters.length; i<l; i++){
				if(filters[i] === '_cl_appPlaceholder'){
					placeHolderIndex = i;
					filters.splice(i, 1);
					break;	
				}
			}
			if($filters)
				for (var i = 0, l=$filters.length; i < l; i++){
					this.addFilter($filters[i], placeHolderIndex);
					placeHolderIndex++;
				}
		}
	
		this.test = function(loading, unloading, callback){
			loopControllers(loading, 'before', function(valid){
				if (valid) {
					if (unloading) {
						loopControllers(unloading, 'after', function(valid){
							callback(valid);
						})
					} else {
						callback(true);
					}
				} else {
					callback(false);
				}				
			});
		}
		
		var loopControllers = function(sig, type, callback){
			var noTest = true;
			var isValid = true;	
			var count = 0;
			
			function continueLoop(){
				count++;
				loop();
			}
			
			function loop(){
				if (count < filters.length) {
					if (isValid) {				
						var filter = filters[count];
						if (testCondition(sig.controller, filter.controller)) {
							if (!sig.action || filter.action == null || filter.action == undefined || testCondition(sig.action, filter.action)) {
								noTest = false;
								executeFilter(sig, filter, type, function(valid){
									isValid = valid;
									continueLoop();
								});
							} else {
								continueLoop();
							}
						} else {
							continueLoop();
						}
					}
				} else {
					if(noTest) callback(true);
					else callback(isValid);		
				}
			}
			loop();
		}
	
		var testCondition = function(test, filterCondition){
			/*
			(controller:'*', action:'*') {
			} (controller:'foo', action:'*') {
			} (uri:'/foo/*') {
			} (uri:'/**') {
			}
			 */
			if(filterCondition == '*' || filterCondition == test) return true;
			else return false;
		}
		
		var executeFilter = function(sig, filterParams, type, callback){
			var hasMethod = false;
			if (filterParams[type]) {
				hasMethod = true;
				var methods = {
					pass:function(){
						callback(true);
					},
					fail:function(){
						callback(false);
					},
					hash:sig.hash,
					controller:sig.controller,
					action:sig.action,
					id:sig.id
				}
				filterParams[type].call(self, methods);
			}
			if(!hasMethod) callback(true);	
		}

	
});


a5.Package('a5.cl.mvc.core')
	
	.Import('a5.cl.core.Instantiator')
	.Extends('a5.cl.CLMVCBase')
	.Class("Mappings", 'singleton final', function(self, im){

		var mappings,
			errorMappings,
			lastMapping = null,
			paramArray = ['controller', 'action', 'id'];
		
	
		this.Mappings = function(){
			self.superclass(this);
			mappings = ['_cl_appPlaceholder'];
			errorMappings = ['_cl_appPlaceholder'];
		}
		
		this.addMapping = function(mappingObj, $append){
			var append = $append || false,
				controller = mappingObj.controller ? im.Instantiator.instance().getClassInstance('Controller', mappingObj.controller, true):null;
			if(controller){
				if (!(controller instanceof a5.cl.CLController)) {
					this.throwError('Unable to instantiate the controller ' + mappingObj.controller);
					return;
				} else if (controller.instanceCount() > 1) {
					this.throwError('Cannot add a mapping to a controller with multiple instances (' + controller.namespace() + ').');
					return;
				}
				controller.setMappable();
			}
			
			if (typeof mappingObj.desc === 'number') {
				if (mappingObj.controller) {
					if(append) errorMappings.push(mappingObj);
					else errorMappings.unshift(mappingObj);
				}
			} else {
				if (typeof mappingObj.desc === 'string') {
					mappingObj.desc = mappingObj.desc.split('/');
					if(mappingObj.desc[0] === "")
						mappingObj.desc.shift();
				} else {
					self.throwError('invalid mapping: "desc" param must be a string');
				}
				if(typeof append === 'number') mappings.splice(append, 0, mappingObj);
				else if(append) mappings.push(mappingObj);
				else mappings.unshift(mappingObj);
			}
		}
		
		this.addAppMappings = function($mappings){
			var placeHolderIndex,
				errorPlaceHolderIndex;
			for(var i = 0, l=mappings.length; i<l; i++){
				if(mappings[i] === '_cl_appPlaceholder'){
					placeHolderIndex = i;
					mappings.splice(i, 1);
					break;	
				}
			}
			for(var i = 0, l=errorMappings.length; i<l; i++){
				if(errorMappings[i] === '_cl_appPlaceholder'){
					errorPlaceHolderIndex = i;
					errorMappings.splice(i, 1);
					break;	
				}
			}
			if($mappings)
				for (var i = 0, l=$mappings.length; i < l; i++){
					if(typeof $mappings[i].desc === 'number'){
						this.addMapping($mappings[i], errorPlaceHolderIndex);
						errorPlaceHolderIndex++;
					} else {
						this.addMapping($mappings[i], placeHolderIndex);
						placeHolderIndex++;
					}
				}
		}
		
		this.getCallSignature = function(hashArray){
			var matchedSig = matchSignature(hashArray);
			if (matchedSig) {
				matchedSig.hash = hashArray.join('/');
				lastMapping = matchedSig;
				return matchedSig;
			} else return null; 
		}
		
		this.geLastCallSignature = function(){
			return lastMapping;
		}
		
	
		this.getErrorSignature = function(num){
			for (var i = 0, l=errorMappings.length; i<l; i++)
				if(errorMappings[i].desc == num)
					return {controller:errorMappings[i].controller, action:errorMappings[i].action, id:errorMappings[i].id }
			return null;
		}
		
		var matchSignature = function(param){
			var hashArray = (typeof param == 'object' ? param:[param]);
			for(var prop in hashArray)
				if(hashArray[prop] == undefined)
					hashArray[prop] = "";
			if(!hashArray.length) hashArray = [""];
			var retSig = null;
			for (var i = 0, l=mappings.length; i < l; i++) {
				var matchData = runMatchAlgorithm(mappings[i], hashArray);
				if (matchData) {
					var sigObj = {
						controller:mappings[i].controller,
						action:mappings[i].action,
						id:mappings[i].id
					};
					for (var prop in matchData) 
						if (sigObj[prop] == undefined) 
							sigObj[prop] = matchData[prop];			
					var passedConstraints = true;
					if (mappings[i].constraints) passedConstraints = mappings[i].constraints(sigObj.controller, sigObj.action, sigObj.id);
					if (passedConstraints) retSig = sigObj;
				}
				if(retSig) break;
			}
			return retSig;
		}
		
		var runMatchAlgorithm = function(mapping, hashArray){
			var retObj = {};
			var isValid = false;
			var isDequalified = false;
			var hasIDProps = false;
			for (var i = 0, l= mapping.desc.length; i <l; i++) {
				if (!isDequalified) {
					var isDirect = mapping.desc[i].indexOf(':') == 0;
					if (isDirect) {
						var isOptional = mapping.desc[i].indexOf('?') == mapping.desc[i].length - 1;
						var foundProp = false;
						for (var j = 0, m = paramArray.length; j < m; j++) {
							if (!foundProp) {
								if (mapping.desc[i].substr(1, mapping.desc[i].length - (isOptional ? 2 : 1)) == paramArray[j]) {
									foundProp = isValid = true;
									if (i >= hashArray.length) {
										if (!isOptional) isValid = false;
									} else {
										if (paramArray[j] == 'id') {
											if (hashArray.length === 1 && hashArray[0] === "" && !isOptional) {
												isValid = false;
											} else {
												retObj.id = hashArray.slice(i);
												hasIDProps = true;
											}
										} else retObj[paramArray[j]] = hashArray[i];
									}
								} else {
									if (!isOptional) isValid = false;
								}
							}
						}
					} else {
						isValid = (i < hashArray.length && mapping.desc[i] == hashArray[i]);
						if (!isValid) isDequalified = true;
					}
				}
			}
			if(isValid){
				if(!hasIDProps && hashArray.length > mapping.desc.length)
					return null;
				else 
					return retObj;
			} else {
				return null;
			}
	
		}

	
});

a5.Package('a5.cl.mvc.core')

	.Extends('a5.cl.CLMVCBase')
	.Class('GarbageCollector', 'singleton final', function(self, im){

		var recycleBin = document.createElement('div'),
			gcElemCount = 0,
			capacity = 10;
		
		this.GarbageCollector = function(){
			self.superclass(this);
		}
		
		this.destroyElement = function(elem, force){
			if(!a5.cl.core.Utils.isArray(elem))
				elem = [elem];
			for(var x = 0, y = elem.length; x < y; x++)
				addElemToRecycleBin(elem[x]);
			
			if (gcElemCount >= capacity || force === true) {
				recycleBin.innerHTML = "";
				gcElemCount = 0;
			}
		}
		
		var addElemToRecycleBin = function(elem){
			try {
				recycleBin.appendChild(elem);
				gcElemCount++;
			} catch (e) {
				//the element must not have been a valid HTMLElement, but there's not currently an efficient cross-browser way to check before-hand.
			}
		}
	});




a5.Package('a5.cl.mvc.mixins')

	.Mixin('CSS3Props', function(mixin){
	
		mixin.MustExtend('a5.cl.CLView');
		
		mixin.CSS3Props = function(){
		}
		
		mixin._cl_processCSS3Prop = function(prop, check, value){
			if(value === true)
				return a5.cl.core.Utils.getCSSProp(prop) !== null;
			return this._cl_css(prop, value, true);
		}
		
		/**
		 * @name rotation
		 * @param {Object} value
		 */
		mixin.rotation = function(value){
			return this._cl_processCSS3Prop('transform', (value === true), 'rotate(' + value + 'deg)', true);
		}	
		
		mixin.maskImage = function(value){
			return this._cl_processCSS3Prop('maskImage', (value === true), 'url(' + value + ')', true);
		}
		
		mixin.shadow = function(value){
			return this._cl_processCSS3Prop('boxShadow', (value === true), value, true);
		}
		
		
})



/**
 * @class Implements a view with a direct html draw area.
 * @name a5.cl.CLHTMLView
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	
	.Import('a5.cl.CLEvent')
	.Extends('CLView')
	.Prototype('CLHTMLView', function(proto, im, CLHTMLView){
		
		CLHTMLView.customViewDefNodes = ['HTML'];
		
		/**#@+
	 	 * @memberOf a5.cl.CLHTMLView#
	 	 * @function
		 */
		
		this.Properties(function(){
			this._cl_pendingWrapperProps = {};
			this._cl_currentWrapperProps = {};
			this._cl_handleAnchors = false;
			this._cl_disallowHrefs = false;
			this._cl_scrollWidth = null;
			this._cl_scrollHeight = null;
			this._cl_cachedHTML = null;
			this._cl_loadURL = null;
			this._cl_clickHandlingEnabled = false;
			this._cl_isInDocument = false;
		});
		
		proto.CLHTMLView = function(html){
			proto.superclass(this);
			this.clickHandlingEnabled(true);
			if(html !== undefined)
				this.drawHTML(html);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			if (this._cl_cachedHTML !== null) {
				this.drawHTML(this._cl_cachedHTML);
				this._cl_cachedHTML = null;
			}
		}
		
		proto.Override.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			if(nodeName === 'HTML'){
				if(this.viewIsReady())
					this.drawHTML(node.node.textContent);
				else	
					this._cl_cachedHTML = node.node.textContent;
			} else {
				self.superclass().processCustomViewDefNode.apply(this, arguments);
			}
		}
		
		/**
		 * Returns the html wrapper dom element for direct dom manipulation.
		 * @name htmlWrapper
		 * @return [DOMElement] wrapper
		 */
		proto.htmlWrapper = function(){
			return this._cl_viewElement;
		}
		
		/**
		 * If true, clicks are processed, which enabled the functionality for handleAnchors and handleHrefClick().  Defaults to true.
		 * 
		 * @name clickHandlingEnabled
		 * @param {Object} value
		 */
		proto.clickHandlingEnabled = function(value){
			if(typeof value === 'boolean'){
				if(value !== this._cl_clickHandlingEnabled)
					var self = this;
					this._cl_viewElement.onclick = !value ? null : function(e){
						self._cl_handleClicks.call(self, e || window.event);
					};
				this._cl_clickHandlingEnabled = value;
				return this;
			}
			return this._cl_clickHandlingEnabled;
		}
		
		proto._cl_handleClicks = function(e){
			var targetElem = e.target || e.srcElement,
				href, anchorIndex, anchorValid;
			if (targetElem && targetElem.tagName.toUpperCase() === 'A') {
				href = targetElem.href;
				anchorIndex = href ? href.indexOf('#') : null;
				anchorValid = false;
				if(typeof href !== 'undefined'){
					if (anchorIndex === 0 || href.substr(0, anchorIndex - 1) === this.cl().appPath(true)) 
						anchorValid = true;
					if (this._cl_handleAnchors && anchorValid) {
						this.scrollToAnchor(href.substr(anchorIndex + 1));
						return false;
					} else {
						if (this._cl_disallowHrefs) 
							return false;
						return this.handleHrefClick(href);
					}
				}
			}
		}
		
		/**
		 * @name handleAnchors
		 * @param {Boolean} value
		 */
		proto.handleAnchors = function(value){
			if(typeof value === 'boolean'){
				this._cl_handleAnchors = value;
			}
			return this._cl_handleAnchors;
		}
		
		/**
		 * @name scrollToAnchor
		 * @param {Object} anchor
		 */
		proto.scrollToAnchor = function(anchor){
			var anchors = this._cl_viewElement.getElementsByTagName('a'),
				anchorElem, i, l;
			for(i = 0, l=anchors.length; i<l; i++){
				if(anchors[i].getAttribute('name') === anchor){
					anchorElem = anchors[i];
					break;
				}
			}
			try {
				if (anchorElem) {
					var topVal = 0;
					var obj = anchorElem;

					do {
					 if (obj == this._cl_viewElement) break;
					 topVal += obj.offsetTop;
					 } while (obj = obj.parentNode);
					 this.parentView().scrollY(topVal - anchorElem.offsetHeight)
				}
			} catch(e){
				
			}
		}
		
		/**
		 * @name disallowHrefs
		 * @param {Object} value
		 */
		proto.disallowHrefs = function(value){
			if(typeof value === 'boolean'){
				this._cl_disallowHrefs = value;
			}
			return this._cl_disallowHrefs;
		}
		
		/**
		 * @name handleHrefClick
		 * @param {Object} href
		 */
		proto.handleHrefClick = function(href){
			return true;
		}
		
		/**
		 * Draws an html value to the associated element.
		 * @name drawHTML
		 * @param {String} value The html to display.
		 */
		proto.drawHTML = function(value, data){
			if(data && typeof data === 'object'){
				var plgn = this.plugins().getRegisteredProcess('htmlTemplate');
				if(plgn)
					value = plgn.populateTemplate(value, data);
			}
			this._cl_replaceNodeValue(this._cl_viewElement, value);
			return this;
		}
		
		proto.loadURL = function(url){
			if (typeof url == 'string') {
				this._cl_loadURL = url;
				var self = this;
				this.cl().include(url, function(value){
					self.drawHTML(value);
				})
				return this;
			}
			return this._cl_loadURL;
		}
		
		/**
		 * Clears the html wrapper.
		 */
		proto.clearHTML = function(){
			while(this._cl_viewElement.childNodes.length)
				this._cl_destroyElement(this._cl_viewElement.firstChild);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * Appends an HTML element to the html wrapper.
		 * @name appendChild
		 * @param {HTMLElement} value The HTML element to append.
		 */
		proto.appendChild = function(value){
			this._cl_viewElement.appendChild(value);
			this.htmlUpdated();
			return this;
		}
		
		/**
		 * @name css
		 * @param {String} prop
		 * @param {String} value
		 * @param [Boolean] getBrowserImplementation=true
		 */
		proto.css = function(prop, value, getBrowserImplementation){
			getBrowserImplementation = getBrowserImplementation || false;
			if(getBrowserImplementation)
				prop = a5.cl.core.Utils.getCSSProp(prop);
			if(prop)
			this._cl_viewElement.style[prop] = value;
			return this;
		}
		
		/**
		 * @name cssClass
		 * @param {String} [value]
		 */
		proto.cssClass = function(value){
			if (typeof value === 'string') {
				this._cl_viewElement.className = value;
				return this;
			}
			return this._cl_viewElement.className;
		}
		
		/**
		 * @name htmlUpdated
		 */
		proto.htmlUpdated = function(clearScroll){
			if(clearScroll !== false)
				this._cl_scrollWidth = this._cl_scrollHeight = null;
			if ((this._cl_height.auto || this._cl_width.auto) && this.parentView())
				this.parentView().redraw();
		}
		
		proto.Override.width = function(value){
			if (value === 'scroll' || value === 'content') {
				//if(typeof this._cl_scrollWidth !== 'number')
				this._cl_scrollWidth = this._cl_viewElement.scrollWidth - this._cl_calculatedClientOffset.width;
				return value === 'content' ? this._cl_scrollWidth : Math.max(this._cl_scrollWidth + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this.width('offset'));
			}
			return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(value){
			if (value === 'scroll' || value === 'content') {
				//if (typeof this._cl_scrollHeight !== 'number') 
				this._cl_scrollHeight = this._cl_viewElement.scrollHeight - this._cl_calculatedClientOffset.height;
				return value === 'content' ? this._cl_scrollHeight : Math.max(this._cl_scrollHeight + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this.height('offset'));
			} 
			return proto.superclass().height.apply(this, arguments);
			
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var redrawVals = proto.superclass()._cl_redraw.call(this, force, true);
			if (redrawVals.shouldRedraw) {
				this._cl_pendingViewElementProps.paddingTop = this._cl_calculatedClientOffset.top + 'px';
				this._cl_pendingViewElementProps.paddingRight = this._cl_calculatedClientOffset.right + 'px';
				this._cl_pendingViewElementProps.paddingBottom = this._cl_calculatedClientOffset.bottom + 'px';
				this._cl_pendingViewElementProps.paddingLeft = this._cl_calculatedClientOffset.left + 'px';
				this._cl_pendingViewElementProps.width = this._cl_intFromPX(this._cl_pendingViewElementProps.width) - this._cl_calculatedClientOffset.width + 'px';
				this._cl_pendingViewElementProps.height = this._cl_intFromPX(this._cl_pendingViewElementProps.height) - this._cl_calculatedClientOffset.height + 'px';
				
				if(suppressRender !== true)
					this._cl_render();
				
				if(!this._cl_isInDocument && a5.cl.core.Utils.elementInDocument(this._cl_viewElement)) {
					this._cl_isInDocument = true;
					if (this._cl_viewElement.innerHTML !== "" && (this._cl_width.auto || this._cl_height.auto)){
						var nodes = [];
						for(var x = 0, y = this._cl_viewElement.childNodes.length; x < y; x++){
							nodes.push(this._cl_viewElement.childNodes[x]);
						}
						this._cl_replaceNodeValue(this._cl_viewElement, nodes);
					}
						
				}
			}
			return redrawVals;
		}
		
		proto._cl_intFromPX = function(value){
			return parseInt(value.replace(/px$/i, ''));
		}
		
		proto._cl_replaceNodeValue = function(node, value){
			function checkUpdated(){
				if(!this._cl_initialized){
					this.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false);
					return;
				}
				if (node.innerHTML !== "") {
					//if auto width/height, set back to auto
					if(autoWidth) node.style.width = 'auto';
					if(autoHeight) node.style.height = 'auto';
					this.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false);
					this.dispatchEvent('CONTENT_UPDATED');
					this.htmlUpdated(false);
				}
			}
			
			//if auto width/height, change auto to zero
			var autoWidth = (node === this._cl_viewElement) ? this._cl_width.auto : (node.style.width === 'auto'),
				autoHeight = (node === this._cl_viewElement) ? this._cl_height.auto : (node.style.height === 'auto');
			if(autoWidth) node.style.width = 0;
			if(autoHeight) node.style.height = 0;
			
			while(node.childNodes.length)
				node.removeChild(node.firstChild);
			
			this._cl_scrollWidth = this._cl_scrollHeight = null;
			
			if (value != '') {
				this.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, checkUpdated, false, this);
			} else {
				this.dispatchEvent('CONTENT_UPDATED');
				this.htmlUpdated(false);
			}
			if (typeof value == 'string') {
				node.innerHTML = value;
			} else {
				if (a5.cl.core.Utils.isArray(value)) {
					while(value.length)
						node.appendChild(value.shift());
				} else {
					node.appendChild(value);
				}
				//if auto width/height, set back to auto
				if(autoWidth) node.style.width = 'auto';
				if(autoHeight) node.style.height = 'auto';
			}
		}
		
		proto.dealloc = function(){
			this._cl_viewElement.onclick  = null;
		}
});



/**
 * @class Adds subview ownership and management capabilities to view elements.
 * @name a5.cl.CLViewContainer
 * @extends a5.cl.CLView
 */
a5.Package('a5.cl')
	.Extends('CLView')
	.Import('a5.ContractAttribute',
			'a5.cl.mvc.CLViewContainerEvent')
	.Static(function(CLViewContainer){
		CLViewContainer.redrawLog = {};
		
		CLViewContainer.logRedraw = function(view){
			var uid = view.instanceUID();
			if(CLViewContainer.redrawLog[uid])
				CLViewContainer.redrawLog[uid]++;
			else
				CLViewContainer.redrawLog[uid] = 1;
		}
		
		CLViewContainer.getRedrawCounts = function(){
			var redrawArray = [];
			for(var prop in CLViewContainer.redrawLog){
				redrawArray.push({id:prop, count:CLViewContainer.redrawLog[prop]});
			}
			redrawArray.sort(function(a, b){
				return b.count - a.count;
			});
			for(var x = 0, y = redrawArray.length; x < y; x++){
				var thisCount = redrawArray[x];
			}
		}
		
		CLViewContainer.clearRedrawLog = function(){
			CLViewContainer.redrawLog = {};
		}
		
		CLViewContainer.viewAffectsAutoWidth = function(view){
			return (view.visible() && view._cl_width.percent === false && view._cl_width.relative === false && view._cl_alignX !== 'right') || (view._cl_minWidth !== null && view._cl_width.inner <= view._cl_minWidth);
		}
		
		CLViewContainer.viewAffectsAutoHeight = function(view){
			return (view.visible() && view._cl_height.percent === false && view._cl_height.relative === false && view._cl_alignY !== 'bottom') || (view._cl_minHeight !== null && view._cl_height.inner <= view._cl_minHeight);
		}
	})
	.Prototype('CLViewContainer', function(proto, im, CLViewContainer){
		
		/**#@+
	 	 * @memberOf a5.cl.CLViewContainer#
	 	 * @function
		 */	
		 
		this.Properties(function(){
			this._cl_childViews = [];
			this._cl_queuedLoads = [];
			this._cl_relX = false;
			this._cl_relY = false;
			this._cl_outerW = null;
			this._cl_outerH = null;
			this._cl_lockedVal = false;
			this._cl_pendingChildren = 0;
			this._cl_isInitialVDReady = true;
			this._cl_constrainChildren = false;
			this._cl_scrollXEnabled = {value:false, state:false};
			this._cl_scrollYEnabled = {value:false, state:false};
			this._cl_passDataToChildren = true;
			this._cl_passedData = null;
			this._cl_scrollLeftVal = null;
			this._cl_scrollTopVal = null;
			this._cl_childViewTarget = this;
		})
		
		proto.CLViewContainer = function(){
			proto.superclass(this); 
		}
		
		/**
		 * Forces direct child views to constrain width/height values to the max vals of the view.
		 *  @name constrainChildren
		 *  @param {Boolean} [value]
		 */
		proto.constrainChildren = function(value){ return this._cl_propGetSet('_cl_constrainChildren', value); }
		
		/**
		 * @name passDataToChildren
		 * @param {Object} value
		 */
		proto.passDataToChildren = function(value){ return this._cl_propGetSet('_cl_passDataToChildren', value); }
		
		proto.Override.renderFromData = function(data){
			if(this._cl_passDataToChildren){
				this._cl_passedData = data;
				for(var i = 0, l = this._cl_childViews.length; i<l; i++)
					this._cl_childViews[i].renderFromData(data);				
			}
			a5.cl.CLViewContainer.superclass().renderFromData.apply(this, arguments);
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relX = function(value){
			if (value !== undefined) {
				this._cl_relX = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_x.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relX;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.relY = function(value){
			if (value !== undefined) {
				this._cl_relY = value;
				if (value === false) {
					for (var i = 0, l = this._cl_childViews.length; i < l; i++)
						this._cl_childViews[i]._cl_y.state = false;
				}
				this.redraw();
				return this;
			}
			return this._cl_relY;
		}
		
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollXEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollXEnabled.state;
				this._cl_scrollXEnabled.value = value;
				return this;
			}
			return this._cl_scrollXEnabled.value;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrollYEnabled = function(value){
			if (value !== undefined) {
				if(value === 'state') 
					return this._cl_scrollYEnabled.state;
				this._cl_scrollYEnabled.value = value;
				return this;
			}
			return this._cl_scrollYEnabled.value;
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollY = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollTopVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollTop;
			}
		}
		
		/**
		 * 
		 * @param {Number|a5.cl.CLView} val
		 */
		proto.scrollX = function(val, offset){
			if(val !== undefined){
				var setVal;
				if(typeof val === 'number')
					setVal = val;
				else 
					setVal = val.y(true);
				if(offset !== undefined)
					setVal += offset;
				this._cl_scrollLeftVal = setVal;
				this.redraw();
				return setVal;
			} else {
				return this._cl_viewElement.scrollLeft;
			}
			
		}
		
		/**
		 * 
		 */
		proto.subViewCount = function(){
			return this._cl_childViewTarget._cl_childViews.length;
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewAtIndex = function(id){
			return this._cl_childViewTarget._cl_childViews[id];
		}
		
		/**
		 * 
		 * @param {Object} id
		 */
		proto.subViewWithName = function(name){
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i].mvcName() == name)
					return this._cl_childViewTarget._cl_childViews[i];
			}
			return null;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToTop = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.push(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.subViewToBottom = function(view){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				this._cl_childViewTarget._cl_childViews.splice(view.index(), 1);
				this._cl_childViewTarget._cl_childViews.unshift(view);
				this._cl_childViewTarget._cl_orderChildren();
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * 
		 */
		proto._cl_orderChildren = function(){
			for (var i = 0, l = this._cl_childViews.length; i < l; i++) {
				var thisElem = this._cl_childViews[i]._cl_viewElement,
					scrollTop = thisElem ? thisElem.scrollTop : 0,
					scrollLeft = thisElem ? thisElem.scrollLeft : 0;
				this._cl_viewElement.appendChild(thisElem);
				this._cl_childViews[i]._cl_setIndex(i);
				this.redraw();
				//we have to cache the scroll positions, and then reset them because doing an appendChild() resets the scroll
				thisElem.scrollTop = scrollTop;
				thisElem.scrollLeft = scrollLeft;
			}
		}
		
		proto._cl_addChildView = function(view, $index, callback){
			if (!this._cl_lockedVal) {
				if(!(this instanceof a5.cl.mvc.core.WindowContainer) && view instanceof a5.cl.CLWindow){
					this.throwError('Cannot add a CLWindow to a generic view container.');
					return;
				}
				if(view.parentView() instanceof a5.cl.CLViewContainer && view.parentView() !== this)
					view.parentView().removeSubView(view, false);
				var index = (typeof $index == 'number') ? $index:null;
				if(index > this._cl_childViews.length-1) index = null;
				this.willAddView();
				view.draw(this);
				this.viewAdded();
				view._cl_addedToParent(this);
				if(callback) callback(view);
				if(index !== null) this._cl_childViews.splice(index, 0, view)
				else this._cl_childViews.push(view);
				view._cl_setParent(this);
				this._cl_orderChildren();
				if(this._cl_passDataToChildren && this._cl_passedData)
					view.renderFromData(this._cl_passedData)
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.containsSubView = function(view){
			for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
				if(this._cl_childViewTarget._cl_childViews[i] == view)
					return true;
			}
			return false;
		}
		
		/**
		 * 
		 * @param {Object} view
		 */
		proto.removeSubView = function(view, $shouldDestroy){
			if (!this._cl_childViewTarget._cl_lockedVal) {
				var shouldDestroy = $shouldDestroy === false ? false : true;
				for (var i = 0, l = this._cl_childViewTarget._cl_childViews.length; i < l; i++) {
					if (this._cl_childViewTarget._cl_childViews[i] === view) {
						this.willRemoveView(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.WILL_REMOVE_VIEW, {view:view});
						this._cl_childViewTarget._cl_childViews.splice(i, 1);
						view._cl_parentView = null;
						view._cl_removedFromParent(this);
						if(view._cl_viewElement && view._cl_viewElement.parentNode === this._cl_viewElement)
							this._cl_childViewTarget._cl_viewElement.removeChild(view._cl_viewElement);
						this.viewRemoved(view);
						this.dispatchEvent(a5.cl.mvc.CLViewContainerEvent.VIEW_REMOVED, {view:view});
						if (shouldDestroy === true) view.destroy();
						if(this._cl_childViewTarget._cl_relX || this._cl_childViewTarget._cl_relY || this._cl_childViewTarget._cl_width.auto || this._cl_childViewTarget._cl_height.auto)
							this.redraw();
						return;
					}
				}
				//throw 'Error removing subview ' + view.mvcName() + ', subview is not a child of the view container.';
				this.warn('Unable to remove subview ' + (view.id() || view.instanceUID()) + '.  Subview is not a child of the view container.');
			} else {
				this._cl_throwLockedError();
			}
		}
		
		proto.removeAllSubViews = function(shouldDestroy){
			while(this.subViewCount())
				this.removeViewAtIndex(0, shouldDestroy);
			return this;
		}
		
		/**
		 * 
		 * @param {Number} id
		 */
		proto.removeViewAtIndex = function(id, shouldDestroy){
			var view = this._cl_childViewTarget._cl_childViews[id];
			this.removeSubView(view, shouldDestroy);
		}
		
		/**
		 * 
		 * @param {Object} replacedView
		 * @param {Object} newView
		 */
		proto.replaceView = function(replacedView, newView){
			var replaceView;
			for (var i = 0, l=this._cl_childViewTarget._cl_childViews.length; i<l; i++){
				if(this._cl_childViewTarget._cl_childViews[i] === replaceView) 
					replaceView = this._cl_childViewTarget._cl_childViews[i];
					break;
			}
			if(replaceView)
				this.replaceViewAtIndex(newView, replaceView.index());
			else
				this.redirect(500, "cannot replace view " + (replaceView.id() || replaceView.instanceUID()) + ", view is not a child of container " + this.instanceUID());
		}
		
		/**
		 * 
		 * @param {Object} index
		 * @param {Object} newView
		 */
		proto.replaceViewAtIndex = function(newView, index){
			this.removeViewAtIndex(index);
			this.addSubViewAtIndex(newView, index);
		}
		
		/**
		 * 
		 * @param {Number} index_1
		 * @param {Number} index_2
		 */
		proto.swapViewsAtIndex = function(index_1, index_2){
			if (!this._cl_lockedVal) {
				var inst = this._cl_childViewTarget._cl_childViews, length = inst.length;
				if (index_1 < 0) index_1 = 0;
				if (index_2 < 0) index_2 = 0;
				if (index_1 > length - 1) index_1 = length - 1;
				if (index_2 > length - 1) index_1 = length - 1;
				if (index_1 != index_2) {
					var viewTemp = inst[index_1];
					inst[index_1] = inst[index_2];
					inst[index_2] = viewTemp;
					this._cl_childViewTarget._cl_orderChildren();
				}
			} else {
				this._cl_throwLockedError();
			}
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubView
		 * @param {a5.cl.CLView|Object} view
		 * @param {Function} [callback]
		 */
		proto.addSubView = this.Attributes(
			["Contract", {view:'a5.cl.CLView', callback:'function=null'}],
			function(args){
				if (args)
					this._cl_childViewTarget._cl_addChildView(args.view, null, args.callback)
		})
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAtIndex
		 * @param {a5.cl.CLView|Object} view
		 * @param {Number} index
		 * @param {Function} [callback]
		 */
		proto.addSubViewAtIndex = function(view, index, callback){
			this._cl_childViewTarget._cl_addChildView(view, index, callback)
			
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewBelow
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewBelow = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())-1), callback);
		}
		
		/**
		 * @function
		 * @name a5.cl.CLViewContainer#addSubViewAbove
		 * @param {a5.cl.CLView|Object} view
		 * @param {a5.cl.CLView} refView
		 * @param {Function} [callback]
		 */
		proto.addSubViewAbove = function(view, refView, callback){
			this.addSubViewAtIndex(view, (parseInt(refView.index())+1), callback);
		}
		
		proto.Override.width = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_width.content + this._cl_calculatedClientOffset.left + this._cl_calculatedOffset.left, this._cl_width.offset);
			else
				return proto.superclass().width.apply(this, arguments);
		}
		
		proto.Override.height = function(val){
			if (val === 'scroll')
				return Math.max(this._cl_height.content + this._cl_calculatedClientOffset.top + this._cl_calculatedOffset.top, this._cl_height.offset);
			else
				return proto.superclass().height.apply(this, arguments);
		}
		
		proto.Override.suspendRedraws = function(value, inherited){
			if(typeof value === 'boolean') {
				for(var x = 0, y = this.subViewCount(); x < y; x++){
					this.subViewAtIndex(x).suspendRedraws(value, true);
				}
			}
			return proto.superclass().suspendRedraws.call(this, value);
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var forceChildren = this._cl_redrawPending,
				redrawVals = proto.superclass()._cl_redraw.call(this, force, true),
				scrollBarWidth = a5.cl.mvc.core.EnvManager.instance().scrollBarWidth(),
				shouldRedraw = im.CLView._cl_viewCanRedraw(this),
				contentWidthChanged = false,
				contentHeightChanged = false;
			if(shouldRedraw){
				//a5.cl.CLViewContainer.logRedraw(this);
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				forceChildren = forceChildren || redrawVals.force;
				var outerW = 0, outerH = 0,
					view, prevView, maxW, maxH, i, l,
					shouldXScroll = false,
					shouldYScroll = false, 
					didXScrollChange = false, 
					didYScrollChange = false,
					percentChildren = [];
				for (i = 0, l = this._cl_childViews.length; i < l; i++) {
					view = this._cl_childViews[i];
					if(((this._cl_height.auto || this._cl_scrollYEnabled.value) && view._cl_height.percent !== false) || ((this._cl_width.auto || this._cl_scrollXEnabled.value) && view._cl_width.percent !== false))
						percentChildren.push(view);
					if (this._cl_relX || this._cl_relY) {
						if (i > 0) {
							prevView = this._cl_childViews[i - 1];
							if (this._cl_relX) 
								view._cl_x.state = prevView.x(true) + view.x() + prevView.width();
							if (this._cl_relY) 
								view._cl_y.state = prevView.y(true) + view.y() + prevView.height();
						} else {
							if (this._cl_relX) 
								view._cl_x.state = view.x();
							if (this._cl_relY) 
								view._cl_y.state = view.y();
						}
					}		
					view._cl_redraw(force || forceChildren, true);
					
					if (CLViewContainer.viewAffectsAutoWidth(view)) {
						maxW = view.width() + view.x(true);
						if (maxW > outerW) 
							outerW = maxW;
					}
					if(CLViewContainer.viewAffectsAutoHeight(view)) {
						maxH = view.height() + view.y(true);
						if (maxH > outerH) 
							outerH = maxH;
					}
				}
				//update the content width/height
				contentWidthChanged = this._cl_width !== outerW;
				contentHeightChanged = this._cl_height !== outerH;
				this._cl_height.content = outerH;
				this._cl_width.content = outerW;
				
				//redraw any percent-based children again so they'll be based on the new content size
				for(i = 0, l = percentChildren.length; i < l; i++) {
					view = percentChildren[i];
					if ((view._cl_width.percent !== false && contentWidthChanged) || (view._cl_height.percent !== false && contentHeightChanged))
						view._cl_redraw(force || forceChildren, true);
				}
				
				if (this._cl_width.auto !== false || this._cl_height.auto !== false){
					proto.superclass()._cl_redraw.call(this, true, true);
					this._cl_height.content = outerH;
					this._cl_width.content = outerW;
					this._cl_alertParentOfRedraw();
				}
				
				if (this._cl_scrollXEnabled.value && outerW > this._cl_width.client + this._cl_calculatedClientOffset.right) 
					shouldXScroll = true;
				if (this._cl_scrollYEnabled.value && outerH > this._cl_height.client + this._cl_calculatedClientOffset.bottom) 
					shouldYScroll = true;
				
				if( (this._cl_scrollXEnabled.value && this._cl_scrollYEnabled.value) 			// if both X and Y can scroll
					&&	scrollBarWidth > 0 														//and the scrollbar will actually take up space
					&& ((shouldXScroll && !shouldYScroll) || (shouldYScroll && !shouldXScroll)) //and only one direction is scheduled scroll right now
				){																				//then check if the other direction will need to scroll once the scrollbar is added
					if (shouldYScroll && (this._cl_width.client - scrollBarWidth) < outerW) 
						shouldXScroll = true;
					else if (shouldXScroll && (this._cl_height.client - scrollBarWidth) < outerH) 
						shouldYScroll = true;
				}
				
				//show or hide the scrollbars if necessary
				if (shouldYScroll !== this._cl_scrollYEnabled.state) {
					this._cl_scrollYEnabled.state = shouldYScroll;
					this._cl_pendingViewElementProps.overflowY = shouldYScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didYScrollChange = true;
				}
				if (shouldXScroll !== this._cl_scrollXEnabled.state) {
					this._cl_scrollXEnabled.state = shouldXScroll;
					this._cl_pendingViewElementProps.overflowX = shouldXScroll ? 'auto' : (this._cl_showOverflow ? 'visible' : 'hidden');
					didXScrollChange = true;
				}
				
				//if we're scrolling, adjust the inner sizes accordingly
				this._cl_width.inner = this._cl_width.client - (this._cl_scrollYEnabled.state ? scrollBarWidth : 0);
				this._cl_height.inner = this._cl_height.client - (this._cl_scrollXEnabled.state ? scrollBarWidth : 0);
				
				//redraw the children again, if necessary
				if (scrollBarWidth > 0 && (didXScrollChange || didYScrollChange)) {
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_redraw(true);
				} else {
					//if we're not redrawing the children one final time, then we must render them
					for (i = 0, l = this._cl_childViews.length; i < l; i++) 
						this._cl_childViews[i]._cl_render();
				}
				
				if ('ontouchstart' in window) {
					var prop = a5.cl.core.Utils.getCSSProp('overflowScrolling');
					if (prop) 
						this._cl_pendingViewElementProps[prop] = 'touch';
				}
				
				if (suppressRender !== true) 
					this._cl_render();
			}
			return redrawVals;
		}
		
		proto.Override._cl_render = function(){
			proto.superclass()._cl_render.call(this);
			
			if (this._cl_scrollLeftVal) {
				this._cl_viewElement.scrollLeft = this._cl_scrollLeftVal;
				this._cl_scrollLeftVal = null;
			}
			
			if (this._cl_scrollTopVal) {
				this._cl_viewElement.scrollTop = this._cl_scrollTopVal;
				this._cl_scrollTopVal = null;
			}
		}
		
		proto._cl_locked = function(value){ return this._cl_propGetSet('_cl_lockedVal', value, 'boolean'); }
		
		proto._cl_throwLockedError = function(){
			this.redirect(500, 'Error: attempted to modify child views on a structure locked view.');
		}
		
		proto._cl_childRedrawn = function(child, changes){
			var autoWidth = this._cl_width.auto !== false && (changes.width || changes.x) && CLViewContainer.viewAffectsAutoWidth(child),
				autoHeight = this._cl_height.auto !== false && (changes.height || changes.y) && CLViewContainer.viewAffectsAutoHeight(child),
				relX = this._cl_relX && (changes.width || changes.x),
				relY = this._cl_relY && (changes.height || changes.y),
				scrollX = this._cl_scrollXEnabled.value && (changes.width || changes.x),
				scrollY = this._cl_scrollYEnabled.value && (changes.height || changes.y),
				alignY = child._cl_alignY !== 'top'  && (changes.height || changes.y),
				alignX = child._cl_alignX !== 'left'  && (changes.width || changes.x);
				
			if(autoWidth || autoHeight || relX || relY || scrollX || scrollY || alignX || alignY)
				this.redraw();
		}
		
		proto.Override._cl_addedToTree = function(){
			proto.superclass()._cl_addedToTree.call(this);
			for (var i = 0, l = this.subViewCount(); i < l; i++)
				this.subViewAtIndex(i)._cl_addedToTree();
		}
		
		proto.Override._cl_removedFromTree = function(){
			proto.superclass()._cl_removedFromTree.call(this);
			for(var i=0, l=this.subViewCount(); i<l; i++)
				this.subViewAtIndex(i)._cl_removedFromTree();
		}		
		
		proto.getChildView = function(id){
			var x, y, thisChild, childFound;
			for(x = 0, y = this.subViewCount(); x < y; x++){
				thisChild = this.subViewAtIndex(x);
				if(thisChild._cl_controller)
					continue; //if this child has a controller, don't go any deeper
				if(thisChild.id() === id)
					return thisChild;
				childFound = thisChild instanceof CLViewContainer ? thisChild.getChildView(id) : false;
				if(childFound)
					return childFound;
			}
			return null;
		}
		
		proto.getChildViews = function(){
			return this._cl_childViews.slice(0);
		}
		
		proto.getMaximumViewDepth = function(){
			var maxDepth = 0;
			if(this.subViewCount() > 0){
				(function(parent, depth){
					depth++;
					if(depth > maxDepth)
						maxDepth = depth;
					for(var x = 0, y = parent.subViewCount(); x < y; x++){
						var thisChild = parent.subViewAtIndex(x);
						if(thisChild.subViewCount() > 0)
							arguments.callee.call(this, thisChild);
					}
				})(this, 0);
			}
			return maxDepth;
		}
		
		proto.Override._cl_vdViewReady = function(){
			this.childrenReady(this._cl_isInitialVDReady);
			this._cl_isInitialVDReady = this._cl_buildingFromViewDef = false;
			proto.superclass()._cl_vdViewReady.call(this);
		}
		
		proto._cl_vdViewAdded = function(){
			this._cl_pendingChildren--;
				if(this._cl_pendingChildren <= 0)
					this._cl_vdViewReady();
		}
		
		/**
		 * Called when all of the child views have finished loading.
		 * Note that this method will only be called if this view was generated from a view definition.
		 * @param {Boolean} initialCall  
		 */
		proto.childrenReady = function(initialCall){
			this.dispatchEvent(im.CLViewContainerEvent.CHILDREN_READY);
		};
		
		/**
		 * Called when a view is about to be added to the view container.
		 * @param {Object} e
		 * @param {Object} e.view
		 */
		proto.willAddView = function(e){}
		
		/**
		 * Called when a view is about to be removed from the view container.
		 * @param {Object} e
		 */
		proto.willRemoveView = function(e){}
		
		/**
		 * Called when a view has been successfully removed from the view container.
		 */
		proto.viewRemoved = function(){}
		
		/**
		 * Called when a view has been successfully loaded to the view container.
		 */
		proto.viewAdded = function(){}
		
		proto.dealloc = function(){
			this._cl_lockedVal = false;
			this.removeAllSubViews(true);
		}
});



/**
 * @class Base class for windows in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLWindow
 * @extends a5.cl.CLViewContainer
 */
a5.Package('a5.cl')

	.Extends('CLViewContainer')
	.Prototype('CLWindow', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWindow#
	 	 * @function
		 */
		
		this.Properties(function(){
			this._cl_windowLevel = a5.cl.CLWindowLevel.APPLICATION;
			this._cl_isRootWindow = false;
		});
		
		proto.CLWindow = function(){
			proto.superclass(this);
			this._cl_width.percent = this._cl_height.percent = 1;
			this._cl_width.value = this._cl_height.value = '100%';
			proto.backgroundColor.call(this, '#fff');
		}
		
		/**
		 * Returns whether the window is the root window in the window stack.
		 * @name isRootWindow
		 * @type Boolean
		 */
		proto.isRootWindow = function(){
			return this._cl_isRootWindow;
		}
		
		/**
		 * @name application
		 */
		proto.application = function(){
			return this.MVC().application();
		}
		
		proto.Override.moveToParentView = function(view){
			this.throwError('moveToParentView is not a valid manipulation method on a5.cl.CLWindow.');
		}
		
		/**
		 * @name didFinishLoading
		 * @description Called on the root window only when the application has completed launching.
		 * @params {CLApplication} application The application instance.
		 */
		proto.didFinishLoading = function(application){}

		proto.Override.hide = function(){
			if(!this.isRootWindow()) 
				a5.cl.CLWindow.superclass().hide.call(this);
		}
		
		proto._cl_setRootWindow = function(){ 
			this._cl_isRootWindow = true; 
		}
});

/**
 * @class 
 * @name a5.cl.CLWindowLevel
 */
a5.Package('a5.cl')

	.Static(function(CLWindowLevel){
		
		/**#@+
	 	 * @memberOf a5.cl.CLWindowLevel
	 	 * @constant
		 */
		
		/**
		 * @name APPLICATION
		 */
		CLWindowLevel.APPLICATION = 'Application';
		
		/**
		 * @name MODAL
		 */
		CLWindowLevel.MODAL = 'Modal';
		
		/**
		 * @name CONTEXT
		 */
		CLWindowLevel.CONTEXT = 'Context';
		
		/**
		 * @name ALERT
		 */
		CLWindowLevel.ALERT = 'Alert';
		
		/**
		 * @name SYSTEM
		 */
		CLWindowLevel.SYSTEM = 'System';
	})
	.Class('CLWindowLevel', function(){
		
})



/**
 * @class Base class for view controllers in the AirFrame CL framework.
 * <br/><b>Abstract</b>
 * @name a5.cl.CLController
 * @extends a5.cl.CLBase
 */
a5.Package('a5.cl')
	.Import('a5.cl.core.viewDef.ViewDefParser')
	.Extends('CLMVCBase')
	.Mix('a5.cl.mixins.Binder')
	.Prototype('CLController', function(proto, im, CLController){
		
		CLController.ASSUME_XML_VIEW = 'clControllerAssumeXMLView'
		
		this.Properties(function(){
			this._cl_view = null;
			this._cl_mappable = false;
			this._cl_viewDefDefaults = [];
			this._cl_viewDefParser = null;
			this._cl_viewDefCallback = null;
			this._cl_viewDefCallbackScope = null;
			this._cl_defaultViewDef = null;
			this._cl_viewReadyPending = true;
			this._cl_renderTarget = null;
			this._cl_orphanage = [];
			this._cl_childControllers = [];
			this._cl_id = null;
			this._cl_viewIsInTree = false;
		});
		
		/**#@+
	 	 * @memberOf a5.cl.CLController#
	 	 * @function
		 */	
		
		proto.CLController = function(defaultView){
			var inst = CLController.instance();
			if(inst && inst._cl_mappable){
				this.throwError('Cannot create multiple instances of a controller which has a mapping associated with it.');
				return;
			}
			
			proto.superclass(this);
			this._cl_setMVCName(this.className().replace('Controller', ''));
			if (defaultView === CLController.ASSUME_XML_VIEW) {
				this.defaultViewDefinition(CLController.ASSUME_XML_VIEW);
			} else if (typeof defaultView === 'string') {
				this.defaultViewDefinition(defaultView);
			} else if (defaultView instanceof a5.cl.CLView) {
				this._cl_viewCreated(defaultView);
				this._cl_viewReady();
			} else if(defaultView === true){
				this._cl_viewCreated(this.create(a5.cl.CLViewContainer));
				this._cl_viewReady();
			}
		}
		
		/**
		 * Default action for the controller, override to define custom functionality.
		 * @name index
		 * @param {Object} [data]
		 */
		proto.index = function(data){
			this.render();
		}
		
		/**
		 * @name view
		 * @returns {a5.cl.CLView} 
		 */	
		proto.view = function(){
			return this._cl_view;
		}
		
		proto.id = function(value){
			if(typeof value === 'string'){
				this._cl_id = value;
				return this;
			}
			return this._cl_id || this.instanceUID();
		}
		
		/**
		 * Retrieves the view for this controller, generating it if necessary.
		 * @name generateView
		 * @param {Function} callback Callback method which will be called when the view is ready.  The view will be passed as the sole parameter.
		 * @param {Object} [scope] Optional scope in which to call callback. 
		 */
		proto.generateView = function(callback, scope){
			if(this._cl_view){
				if(typeof callback === 'function')
					callback.call(scope, this._cl_view);
			} else {
				var isXML = /<.+>/.test(this._cl_defaultViewDef);
				if(isXML){
					this._cl_buildViewDef(this._cl_defaultViewDef, callback, scope);
				} else {
					var url,
						isAssumed = false,
						self = this;
					if (this._cl_defaultViewDef) {
						if (this._cl_defaultViewDef === CLController.ASSUME_XML_VIEW) {
							isAssumed = true;
							url = this.config().applicationViewPath + this.mvcName() + '.xml';
						} else {
							url = (this._cl_defaultViewDef.indexOf('://') == -1 ? this.config().applicationViewPath : '') + this._cl_defaultViewDef;
						}
					}					
					this.cl().include(url, function(xml){
						self._cl_buildViewDef(xml, callback, scope);
					}, null, function(e){
						//if an error occurred while loading the viewdef, throw a 404
						if (isAssumed) {
							self._cl_viewCreated(self.create(a5.cl.CLViewContainer));
							self._cl_viewReady();
							callback.call(scope, self._cl_view);
						} else {
							self.redirect(404, url)
						}
					}) ;
				}
			}
		}
		
		/**
		 * This method is called when the view for this controller has been instantiated.
		 */
		proto.viewReady = function(){
			
		}
		
		/**
		 * Renders a view into the render target for this controller.  The default render target is the root view.
		 * Note that all other subviews in the render target will be removed.
		 * If this controller is mappable, calling render() will force this controller to be the active presenter.
		 * To render this controller in the application render target without modifying the contents of this controller's root view, skip the view parameter.
		 * @name render
		 * @param {a5.cl.CLView} [view] The view to render into the render target for this controller.
		 * @param {Function} [callback] This method is called when the view for this controller has been generated.
		 */
		proto.render = function(view, callback){
			
			var callback = typeof view === 'function' ? view : callback,
				target;
			
			this.generateView(function(rootView){
				
				target = this._cl_renderTarget || rootView;
				if(view instanceof a5.cl.CLWindow)
					target = a5.cl.mvc.core.AppViewContainer.instance();
				if(view instanceof a5.cl.CLView){
					if (!target.containsSubView(view)) {
						if (!(target instanceof a5.cl.mvc.core.AppViewContainer)) {
							target.removeAllSubViews(false);
							target.addSubView(view);
						} else {
							target.addWindow(view);
						}
					}
					this._cl_renderComplete(callback);
				} else if(view instanceof CLController){
					var self = this;
					view.generateView(function(view){
						if (!target.containsSubView(view)) {
							target.removeAllSubViews(false);
							target.addSubView(view);
						}
						self._cl_renderComplete(callback);
					});
				} else {
					this._cl_renderComplete(callback);
				}
			}, this);
		}
		
		proto._cl_renderComplete = function(callback){
			if(this._cl_mappable)
				this.MVC().application().dispatchEvent(this.create(im.CLEvent, [im.CLEvent.RENDER_CONTROLLER, false]), {controller:this});
			if(callback)
				callback.call(this);
		}
		
		/**
		 * The view container in which subviews should be added when calling render().
		 * @name renderTarget
		 * @param {a5.cl.CLViewContainer} [view]
		 */
		proto.renderTarget = function(view){
			if(view !== undefined){
				this._cl_renderTarget = view;
				return this;
			}
			return this._cl_renderTarget || this._cl_view;
		}
		
		proto.Override.bind = function(source, receiver, params, mapping, scope, persist){
			//TODO: doesnt work - need to determine whether to bind on initial setup based on view in tree status or persist true
			//if (this.view().isInTree() || persist)
			proto.mixins().bind.call(this, source, receiver, params, mapping, scope, persist);
		}
		
		proto._cl_viewAddedToTree = function(){
			if(!this.bindingsConnected())
				this.setBindingEnabled(true);
			this.cl().addEventListener(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, this.clientEnvironmentUpdated, false, this);
			this.cl().addEventListener(im.CLEvent.ORIENTATION_CHANGED, this.orientationChanged, false, this);
			this._cl_viewIsInTree = true;
			this.viewAddedToTree();
		}
		
		proto.viewAddedToTree = function(){
			
		}
		
		proto._cl_viewRemovedFromTree = function(){
			if (this._cl_bindingsConnected)
				this.setBindingEnabled(false);
			this.cl().removeEventListener(im.CLEvent.CLIENT_ENVIRONMENT_UPDATED, this.clientEnvironmentUpdated);
			this.cl().removeEventListener(im.CLEvent.ORIENTATION_CHANGED, this.orientationChanged);
			this._cl_viewIsInTree = false;
			this.viewRemovedFromTree();
		}
		
		proto.viewRemovedFromTree = function(){
			
		}
		
		proto.viewIsInTree = function(){
			return this._cl_viewIsInTree;
		}
		
		/**
		 * Get or set the default view definition.  Can be a path to XML, or a string of XML.
		 * @name defaultViewDefinition
		 * @param {String} viewDef The path to the view definition XML file, or a string of XML.
		 */
		proto.defaultViewDefinition = function(viewDef){
			if(typeof viewDef === 'string'){
				this._cl_defaultViewDef = viewDef;
				return this;
			}
			return this._cl_defaultViewDef;
		}
		
		/**
		 * Finds a child view controller by ID.
		 * @param {String} id The ID of the controller to find.
		 */
		proto.getChildController = function(id){
			var x, y, thisChild;
			for(x = 0, y = this._cl_childControllers.length; x < y; x++){
				thisChild = this._cl_childControllers[x];
				if(thisChild.id() === id)
					return thisChild;
			}
			return null;
		}
		
		/**
		 * Called when the client orientation has changed.
		 * @name orientationChanged
		 * @param {Object} orientation The new orientation ('LANDSCAPE' or 'PORTRAIT')
		 */
		proto.orientationChanged = function(orientation){
			if(this._cl_viewDefParser && this._cl_viewDefParser.hasOrientationOptions())
				this._cl_viewDefParser.parse();
		}
		
		/**
		 * Called when the client environment is forced to change as a result of a resize.
		 * @name clientEnvironmentUpdated
		 * @param {Object} forcedEnvironment The new client environment.
		 */
		proto.clientEnvironmentUpdated = function(forcedEnvironment){
			if(this._cl_viewDefParser && this._cl_viewDefParser.hasEnvironmentOptions())
				this._cl_viewDefParser.parse();
		}
		
		proto.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			
		}
		
		/**
		 * @name setMappable
		 */
		proto.setMappable = function(){
			if(CLController.instanceCount() > 1)
				return this.throwError('Cannot call setMappable on a controller with multiple instances.');
			this._cl_mappable = true;
		}
		
		proto._cl_buildViewDef = function(viewDef, callback, scope){
			this._cl_viewDefCallback = callback;
			this._cl_viewDefCallbackScope = scope;
			this._cl_viewDefParser = this.create(im.ViewDefParser, [viewDef, this]);
			this._cl_viewDefParser.parse(this._cl_viewCreated, this._cl_viewDefComplete, this);
		}
		
		proto._cl_viewCreated = function(view){
			this._cl_view = view;
			view._cl_controller = this;
		}
		
		proto._cl_viewDefComplete = function(view){
			if (this._cl_viewDefCallback)
				this._cl_viewDefCallback.call(this._cl_viewDefCallbackScope, view);
			this._cl_viewReady();
		}
		
		proto._cl_viewReady = function(){
			if (this._cl_viewReadyPending) {
				this._cl_viewReadyPending = false;
				this.viewReady();
			}
		}
		
		proto.dealloc = function(){
			if(this.view())
				this.view().destroy();				
		}
});


/**
 * @class Acts as a delegate for application level events.
 * @name a5.cl.CLApplication
 * @extends a5.EventDispatcher
 */
a5.Package("a5.cl")

	.Extends("CLController")
	.Prototype("CLApplication", function(proto, im){
		
		this.Properties(function(){
			this._cl_activePresenter = null;
			this._cl_rootWindow = null;
		})
		
		/**#@+
	 	 * @memberOf a5.cl.CLApplication#
	 	 * @function
		 */	
		
		proto.CLApplication = function(){
			proto.superclass(this);
			this.addEventListener(im.CLEvent.RENDER_CONTROLLER, this._cl_eRenderControllerHandler, false, this);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_RELAUNCH, this.applicationWillRelaunch);
			this.cl().addEventListener(im.CLEvent.ONLINE_STATUS_CHANGE, this.onlineStatusChanged);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_CLOSED, this.applicationClosed);
			this.cl().addOneTimeEventListener(im.CLEvent.AUTO_INSTANTIATION_COMPLETE, this.autoInstantiationComplete);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, this.applicationWillLaunch);
			this.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_LAUNCHED, this.applicationLaunched);
			this._cl_view = this.create(a5.cl.mvc.core.AppViewContainer);
			this.viewReady();
			return [false];
		}
		
		proto.addWindow = function(window){
			return this.view().addWindow(window);
		}
		
		proto.removeWindow = function(view, destroy){
			return this.view().removeWindow(view, destroy);
		}
		
		proto.containsWindow = function(window){
			return this.view().containsWindow(window);
		}
		
		proto.backgroundColor = function(value){
			if(value){
				document.body.style.backgroundColor = value;
				return this;	
			}
			return document.body.style.backgroundColor;
		}
		
		/**
		 * Gets the controller whose view is being actively presented in the view stack.
		 */
		proto.activePresenter = function(){
			return this._cl_activePresenter;
		}
		
		/**
		 * @name viewReady
		 */
		proto.Override.viewReady = function(){}
		
		/**
		 * @name activePresenterChanged
		 * @description Called by the framework when the controller which is being actively displayed changes.
		 * @param {Object} presenter The controller being actively displayed.
		 */
		proto.activePresenterChanged = function(presenter){}
		
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
		 * @name rootWindowLoaded 
		 * @description Called by the framework when the root window has been successfully instantiated.
		 */
		proto.rootWindowLoaded = function(window){
			if(!this._cl_renderTarget)
				this._cl_renderTarget = window;
			this._cl_rootWindow = window;
		}
		
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
		
		/**
		 * @name window
		 * @returns {a5.cl.CLWindow} The root window of the application.
		 */
		proto.rootWindow = function(){
			return this._cl_rootWindow;	
		}
		
		proto._cl_renderError = function(type, msg, error){
			if (!this._cl_errorStopped) {
				var trace = msg.replace(/\n/g, '<br/>') + '<br/>';
				if (type === 500) {
					if (error) {
						if (error.line && error.url) 
							trace += error.url + ', ' + error.line + '<br/>';
						if (error.stack && typeof error.stack == 'object') {
							if (error.stack.length) {
								trace += '<br/><br/>Call Stack [' + error.stack.length + ']:<br/>';
								for (var i = 0, l = error.stack.length; i < l; i++) 
									trace += unescape(error.stack[i]) + '<br/>';
							} else {
								trace += '<br/><br/>Call stack not supported.';
							}
						}
					}
				}
				var win = this.create(a5.cl.mvc.core.SystemWindow);
				this.addWindow(win);
				win.scrollYEnabled(true).scrollXEnabled(true);
				var htmlView = a5.Create(a5.cl.CLHTMLView);
				htmlView.height('auto').padding(30).alignX('center').alignY('middle');
				win.addSubView(htmlView);
				htmlView.drawHTML(a5.cl.core.Utils.generateSystemHTMLTemplate(type, trace));	
				if (type == 500) {
					this._cl_errorStopped = true;
					a5.cl.core.GlobalUpdateTimer.instance()._cl_killTimer();
				}
			}
		}
		
		proto._cl_eRenderControllerHandler = function(e){
			this.render(e.data().controller.view());
			var previousPresenter = this._cl_activePresenter;
			this._cl_activePresenter = e.data().controller;
			if(previousPresenter !== this._cl_activePresenter)
				this.activePresenterChanged(this._cl_activePresenter);
		}
});


a5.Package('a5.cl.plugins.hashManager')
	
	.Import('a5.cl.CLEvent')
	.Extends('a5.cl.CLPlugin')
	.Class('HashManager', 'singleton final', function(cls, im, HashManager){

		var lastHash,
		trackHash,
		iframe,
		forceOnNext,
		hashDelimiter;
		
		cls.HashManager = function(){
			cls.superclass(this);
			iframe = null;
			lastHash = null;
			forceOnNext = false;
			cls.configDefaults({
				delimiter:'#!'
			});
			browserSupportCheck();
		}	
		
		cls.Override.initializePlugin = function(){
			hashDelimiter = cls.pluginConfig().delimiter;
			if(getHash(true) == "") setLocHash(hashDelimiter);
		}
		
		cls.initialize = function(){
			update();
			var oldIE = cls.cl().clientPlatform() === 'IE' && cls.cl().browserVersion() < 9;
			if ('onhashchange' in window && !oldIE) {
				window.onhashchange = update;
			} else cls.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, update);
		}
		
		cls.getHash = function(asString){
			if (asString === true) {
				return lastHash;
			} else {
				var spl = lastHash.split('/');
				spl.shift();
				return spl;
			}
		}
		
		cls.setHash = function(hash, skipUpdate, forceRedirect) {
			var concatHash = '';
			if(hash instanceof Array) hash = hash.join('/');
			if(hash == null || hash == '/') hash = "";
			if (forceRedirect === true || (hash !== lastHash && hash !== getHash())) {
				if (hash == "") {
					if (skipUpdate === true) lastHash = hashDelimiter;
					setLocHash(hashDelimiter);
				} else {
					if (typeof hash == 'object') {
						for (var i = 0, l=hash.length; i < l; i++) {
							if (hash[i] == undefined && hash[i] == null) {
								hash.splice(i, 1);
								l=hash.length;
								i--;
							}
						}
						for (i = 0, l=hash.length; i < l; i++) 
							concatHash += (hash[i] + (i < hash.length - 1 ? '/' : ''));
					}
					else {
						concatHash = hash;
					}
					if (concatHash.substr(0, 1) == '/') concatHash = concatHash.substr(1);
					if (concatHash.substr(0, hashDelimiter.length) != hashDelimiter) concatHash = hashDelimiter + '/' + concatHash;
					if (skipUpdate === true) lastHash = concatHash;
					setLocHash(concatHash);
				}
				if (forceRedirect) {
					forceOnNext = true;
					update();
				}
			}
		}
		
		var processHash = function(hash){
			hash = hash.substring(hashDelimiter.length);
			var parsedLinks = hash.split('/');
			if(parsedLinks[0] === "")
				parsedLinks.shift();
			return parsedLinks;
		},
		
		update = function(){
			var hash = getHash();
			if(hash != lastHash || forceOnNext) {
				forceOnNext = false;
				lastHash = hash;
				if(iframe && lastHash != null) setLocHash(lastHash);
				var parsedLinks = processHash(lastHash);
				cls.dispatchEvent(im.CLHashEvent.HASH_CHANGE, {hashArray:parsedLinks});
			}
		},
		
		getHash = function($ignoreDelimiter){
			var val;
			if (iframe) {
				try {
					if (lastHash != location.hash) val = location.hash;
					else val = getIframeDoc().body.innerText;
				} catch (e) {
					val = lastHash || "";
				}
			} else {
				val = location.hash;
			}
			return val;
		},
		
		
		browserSupportCheck = function(){
	        if (cls.cl().clientPlatform() == 'IE'&& cls.cl().browserVersion() < 8) createIframe();
			else if (history.navigationMode) history.navigationMode = 'compatible';
		},	
		
		setLocHash = function (newHash, $forceIframe) {
			var forceIframe = $forceIframe || false;
			if (!forceIframe) location.hash = newHash;
			if (iframe) {
				var doc = getIframeDoc();
				doc.open();
				doc.write('<html><body>' + newHash + '</body></html>');
				doc.close();
			}
		},
	
		createIframe = function () {
			iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			document.getElementsByTagName("head")[0].appendChild(iframe);
		},
		
		getIframeDoc = function(){
			return (iframe.contentDocument) ? iframe.contentDocument:iframe.Document;
		}
		
		
});

a5.Package('a5.cl.plugins.hashManager')

	.Extends('a5.cl.CLEvent')
	.Prototype('CLHashEvent', function(cls, im, CLHashEvent){
		
		CLHashEvent.HASH_CHANGE = 'clHashChangeEvent';
		
		cls.CLHashEvent = function(){
			cls.superclass(this);
		}		
});



a5.Package('a5.cl.mvc')

	.Import('a5.cl.CLEvent',
			'a5.cl.plugins.hashManager.CLHashEvent')
	.Extends('a5.cl.CLAddon')
	.Class('MVC', function(cls, im, MVC){
		
		var _mappings,
		_filters,
		_redrawEngine,
		_hash,
		_locationManager,
		_application,
		_garbageCollector,
		_envManager,
		_window,
		isFirstRender = true,
		controller;
		
		cls.MVC = function(){
			cls.superclass(this);
			cls.configDefaults({
				rootController: null,
				rootViewDef: null,
				rootWindow:null
			});
			cls.createMainConfigMethod('filters');
			cls.createMainConfigMethod('mappings');
		}
		
		this.rootController = function(){
			return controller;
		}
		
		this.rootWindow = function(){
			return _window;
		}
		
		this.application = function(){	return _application; }	
		this.mappings = function(){ return _mappings; }
		this.filters = function(){ return _filters; }	
		this.hash = function(){		return _hash; 	}
		this.redrawEngine = function(){ return _redrawEngine; }
		this.locationManager = function(){ return _locationManager; }
		this.garbageCollector = function(){return _garbageCollector;}
		this.envManager = function(){ return _envManager; }
		this.triggerAppRedraw = function(){ this.redrawEngine().triggerAppRedraw(); }
		
		/**
		 * Adds a filter test case to the filters list.
		 *
		 * @param {Object} params Object value, specifies properties of the filter test.
		 * @param {String} params.controller The controller name to test on or a wildcard '*'.
		 * @param {String} [params.action] The action name to test on or a wildcard '*'.
		 * @param {Array} [params.id] The id values to test on or a wildcard '*'.
		 * @param {Function} params.before Test function, passed a param with the values of controller/action/id and methods pass() and fail().
		 * @param {Boolean} [append=false]
		 */
		this.addFilter = function(params, append){	return this.MVC().filters().addFilter(params, append); }
		
		/**
		 * Adds a hash mapping to the mappings list.
		 *
		 * @param {Object} mappingObj Object value, specifies properties of the hash mapping.
		 * @param {String|Number} mappingObj.desc The string hash value or error number to respond to. See wiki for more info on options.
		 * @param {String} mappingObj.controller The controller name to pass functionality to.
		 * @param {String} [mappingObj.action] The controller action to pass functionality to.
		 * @param {Array} [mappingObj.id] The parameters to pass to the controller action.
		 * @param {Function} [mappingObj.constraints] Constraints are not yet implemented in mappings.
		 * @param {Boolean} [append=false]
		 */
		this.addMapping = function(mappingObj, append){	return this.MVC().mappings().addMapping(mappingObj, append); }
		
		/**
		 * Get or set the render target for the application.
		 * This is a shortcut to application().renderTarget().
		 * 
		 * @name applicationRenderTarget
		 * @param {a5.cl.CLViewContainer} [view] The view container in which to render the root view of the active presenter.
		 */
		this.applicationRenderTarget = function(view){
			if(view !== undefined){
				_application.renderTarget(view);
				return this
			}
			return _application.renderTarget();
		}
		
		cls.Override.initializePlugin = function(){
			var appCls = a5.GetNamespace(cls.cl().applicationPackage(true) + '.Application');
			if (appCls) {
				_application = cls.create(appCls);
				if(!_application instanceof a5.cl.CLApplication) throw 'Error: application must extend a5.cl.CLApplication.';
			} else {
				_application = cls.create(a5.cl.CLApplication);
			}
			if(cls.cl().clientEnvironment() == 'MOBILE') a5.cl.mvc.core.AppSetup.mobileSetup(); 
			else if(cls.cl().clientEnvironment() == 'TABLET') a5.cl.mvc.core.AppSetup.tabletSetup();
			else if (cls.cl().clientEnvironment() == 'DESKTOP') a5.cl.mvc.core.AppSetup.desktopSetup();
			_redrawEngine = cls.create(a5.cl.mvc.core.RedrawEngine);
			_envManager = cls.create(a5.cl.mvc.core.EnvManager);
			_mappings = cls.create(a5.cl.mvc.core.Mappings);
			_filters = cls.create(a5.cl.mvc.core.Filters);
			_hash = cls.plugins().HashManager();
			_garbageCollector = cls.create(a5.cl.mvc.core.GarbageCollector);
			_locationManager = cls.create(a5.cl.mvc.core.LocationManager);
			_locationManager.addEventListener('CONTROLLER_CHANGE', eControllerChangeHandler);
			_hash.addEventListener(im.CLHashEvent.HASH_CHANGE, eHashChangeHandler);
			cls.cl().addOneTimeEventListener(im.CLEvent.DEPENDENCIES_LOADED, dependenciesLoaded);
			cls.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_WILL_LAUNCH, appWillLaunch);
			cls.cl().addEventListener(im.CLEvent.ERROR_THROWN, eErrorThrownHandler);
			a5.cl.core.Utils.purgeBody();
			cls.application().view().draw();
			cls.cl().addOneTimeEventListener(im.CLEvent.APPLICATION_PREPARED, eApplicationPreparedHandler);
		}
		
		var eApplicationPreparedHandler = function(){
			var $filters = cls.getMainConfigProps('filters');
			_filters.addAppFilters($filters);
			var $mappings = cls.getMainConfigProps('mappings');
			_mappings.addAppMappings($mappings);
		}
		
		/**
		 * Defines parameters of the browser window.
		 *
		 * @type Object
		 * @param {Number} e.width
		 * @param {Number} e.height
		 */
		this.windowProps = function(){	return _envManager.windowProps();	}
		
		/**
		 * The redirect method throws a control change to A5 CL.
		 * @name redirect
		 * @param {Object|String|Array|Number} params Numbers are explicitly parsed as errors. String parsed as location redirect if is a url, otherwise processed as a hash change.
		 * @param {String|Array} [param.hash] A string value to pass as a hash change. 
		 * @param {String} [param.url] A string value to pass as a location redirect. 
		 * @param {String} [param.controller] A string value referencing the name of a controller to throw control to, defaulting to the index method of the controller. 
		 * @param {String} [param.action] A string value of the name of the method action to call. 
		 * @param {Array} [param.id] An array of parameters to pass to the action method. 
		 * @param {String|Array} [param.forceHash] A string to set the hash value to. Note that unlike standard hash changes, forceHash will not be parsed as a mappings change and is strictly for allowing finer control over the address bar value.
		 * @param {String} [info] For errors only, a second parameter info is used to pass custom error info to the error controller. 
		 */
		this.redirect = function(params, info, forceRedirect){
			if(_locationManager){
				return _locationManager.redirect(params, info, forceRedirect);
			} else {
				if(params === 500){
					var isError = info instanceof a5.Error;
					if(isError && !info.isWindowError())
						this.throwError(info);
					else
						throw info;
				}
			}
		}
		
		cls.setTitle = function(value, append){
			var str = cls.config().appName,
			delimiter = cls.config().titleDelimiter;
			if(value !== undefined){
				if(append === true)
					str = str + delimiter + value;
				else if (append !== undefined)
					str = str + append + value;
				else
					str = value;	
			}
			document.title = str; 
		}
		
		var eErrorThrownHandler = function(e){
			cls.redirect(e);
		}
		
		var dependenciesLoaded = function(){
			_envManager.windowProps(true);
		}
		
		var appWillLaunch = function(){
			_hash.initialize();
			document.body.tabIndex = 0;
			document.body.focus();
			document.body.removeAttribute('tabIndex');
			_window.didFinishLoading(cls.application());
		}
		
		var eControllerChangeHandler = function(e){
			
			var newController,
				data = e.data(),
				action = data.action ? data.action : 'index';
			if(data.controller instanceof a5.cl.CLController)
				newController = data.controller;
			else
				newController = cls.cl()._core().instantiator().getClassInstance('Controller', data.controller, true);
			if(!newController){
				cls.redirect(500, 'Error trying to instantiate controller ' + data.controller + ', controller does not exist in package "' + cls.config().applicationPackage + '.controllers".');
				return;
			}
			
			if(!newController._cl_mappable)
				newController.setMappable();
			if (typeof newController[action] === 'function'){
				newController[action].apply(newController, (data.id || []));
			} else {
				cls.redirect(500, 'Error calling action "' + action + '" on controller "' + data.controller + '", action not defined.');
			}
			if (isFirstRender) {
				isFirstRender = false;
				a5.cl.mvc.core.AppViewContainer.instance()._cl_initialRenderCompete();
			}
		}	
		
		var eHashChangeHandler = function(e){
			_locationManager.processMapping(e.data().hashArray);
		}
		
		cls.Override.initializeAddOn = function(){
			var resourceCache = a5.cl.core.ResourceCache.instance(),
				isAsync = false,
				cfg = cls.pluginConfig();
			
			var generateWindow = function(){
				if (cfg.rootWindow) {
					var nm = applicationPackage + '.views.' + cfg.rootWindow;
					if (a5.GetNamespace(nm)) {
						windowSourceLoaded(nm);
					} else {
						cls.throwError('root window specified in namespace "' + nm + '" does not exist.')
					}
				} else {
					windowAssetsCached(a5.cl.CLWindow);
				}
			}
			
			var windowAssetsCached = function(namespace){
				_window = cls.create(namespace);
				controller._cl_view = _window;
				windowViewLoaded();
			}
			
			var windowViewLoaded = function(){
				_window._cl_setRootWindow();
				cls.application().addWindow(_window);
				windowReady();
			}
			
			var windowReady = function(){
				if (_window) 
					cls.application().rootWindowLoaded(_window);
				if(isAsync)
					cls.dispatchEvent(a5.cl.CLAddon.INITIALIZE_COMPLETE);
			}
			var controllerNS;
			if (cfg.rootController) {
				if(cfg.rootController.indexOf('.') !== -1)
					controller = cls.create(a5.GetNamespace(cfg.rootController));
				else	
					controller = cls.cl()._core().instantiator().createClassInstance(cfg.rootController, 'Controller');
				if (!controller || !(controller instanceof a5.cl.CLController)) {
					cls.redirect(500, 'Invalid rootController specified, "' + cfg.rootController + '" controller does not exist in application package "' + cls.config().applicationPackage + '.controllers".');
					return;
				}
				controllerNS = controller.namespace();
			} else {
				a5.Package('a5.cl.mvc.core')
					.Extends('a5.cl.CLController')
					.Class('RootController', function(cls){ 

						cls.RootController = function(){ 
							cls.superclass(this); 
						} 
						
						cls.Override.index = function(){ 
							cls.redirect(500, "No mapping created for default '/' mapping.")
						}
				});
				controller = cls.create('a5.cl.mvc.core.RootController');	
				controllerNS = 'a5.cl.mvc.core.RootController';
			}
			cls.addMapping({desc:'/', controller:controllerNS}, true);
			if (cfg.rootViewDef) {
				controller.defaultViewDefinition(cfg.rootViewDef);
				isAsync = !(/<.+>/.test(cfg.rootViewDef));
				controller.generateView(function(view){
					_window = view;
					windowViewLoaded();
				});
			}
			else 
				if (controller.view()) {
					if (!(controller.view() instanceof a5.cl.CLWindow)) {
						throw 'not a window';
					} else { 
						_window = controller.view();
						windowViewLoaded();
					}	
				} else {
					generateWindow();
				}
			return isAsync;
		}
})



})(a5);

//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
(function( a5, undefined ) {
a5.Package('a5.cl.ui')
	.Extends('a5.cl.CLAddon')
	.Class('UI', function(self, im){
		var themeManager;
		
		self.UI = function(){
			self.superclass(this);
			
			this.configDefaults({
				themeURL:null
			});
			themeManager = this.create(a5.cl.ui.core.ThemeManager);
		}
		
		self.Override.initializePlugin = function(){
			var themeURL = self.pluginConfig().themeURL;
			if(themeURL)
				a5.cl.ui.core.ThemeManager.instance().loadTheme(themeURL);
		}
				
})



a5.Package('a5.cl.ui.core')
	.Static('UIUtils', function(UIUtils){
		UIUtils.drawTriangle = function(direction, color, width, height){
			var elem = document.createElement('div');
			elem.style.width = elem.style.height = '0';
			elem.style.borderStyle = 'solid';
			switch(direction){
				case 'up':
					elem.style.borderColor = 'transparent transparent ' + color;
					elem.style.borderWidth = '0 ' + (width / 2) + 'px ' + height + 'px';
					break;
				case 'down':
					elem.style.borderColor = color + ' transparent transparent transparent';
					elem.style.borderWidth = height + 'px ' + (width / 2) + 'px 0';
					break;
				case 'left':
					elem.style.borderColor = 'transparent ' + color + ' transparent transparent';
					elem.style.borderWidth = (height / 2) + 'px ' + width + 'px' + (height / 2) + 'px 0';
					break;
				case 'right':
					elem.style.borderColor = 'transparent transparent transparent ' + color;
					elem.style.borderWidth = (height / 2) + 'px 0 ' + (height / 2) + 'px ' + width + 'px';
					break;
			}
			return elem;
		}
		
		UIUtils.getGlobalPosition = function(elem, context){
			//if views were passed in, get the actual dom elements
			if(elem instanceof a5.cl.CLView)
				elem = elem._cl_viewElement;
			if(context instanceof a5.cl.CLView)
				context = context._cl_viewElement;
			else
				context = a5.cl.instance().application().view();
			
			var obj = elem,
				topVal = 0,
				leftVal = 0;
			do { //climb the DOM
				if(context && obj === context)
					break;
				topVal += obj.offsetTop - obj.scrollTop + obj.clientTop;
				leftVal += obj.offsetLeft - obj.scrollLeft + obj.clientLeft;
			} while (obj = obj.offsetParent);
			topVal -= elem.clientTop;
			leftVal -= elem.clientLeft;
			
			return {top:topVal, left:leftVal};
		}
		
		UIUtils.selectTextRange = function(start, end, field){
			if(field.createTextRange) {
				var newend = end - start,
					selRange = field.createTextRange();
				selRange.collapse(true);
				selRange.moveStart("character", start);
				selRange.moveEnd("character", newend);
				selRange.select();
			} else if( field.setSelectionRange ){
				field.setSelectionRange(start, end);
			}
			field.focus();
		}
});



a5.Package('a5.cl.ui.core')
	.Static('Keyboard', function(Keyboard){
		Keyboard.BACKSPACE = 8;
		Keyboard.TAB = 9;
		Keyboard.ENTER = 13;
		Keyboard.PAUSE = 19;
		Keyboard.ESCAPE = 27;
		Keyboard.SPACE = 32;
		Keyboard.PAGE_UP = 33;
		Keyboard.PAGE_DOWN = 34;
		Keyboard.END = 35;
		Keyboard.HOME = 36;
		Keyboard.LEFT_ARROW = 37;
		Keyboard.UP_ARROW = 38;
		Keyboard.RIGHT_ARROW = 39;
		Keyboard.DOWN_ARROW = 40;
		Keyboard.INSERT = 45;
		Keyboard.DELETE = 46;
		Keyboard.F1 = 112;
		Keyboard.F2 = 113;
		Keyboard.F3 = 114;
		Keyboard.F4 = 115;
		Keyboard.F5 = 116;
		Keyboard.F6 = 117;
		Keyboard.F7 = 118;
		Keyboard.F8 = 119;
		Keyboard.F9 = 120;
		Keyboard.F10 = 121;
		Keyboard.F11 = 122;
		Keyboard.F12 = 123;
		
		Keyboard.isVisibleCharacter = function(keyCode){
			if(typeof keyCode !== 'number')
				return false;
			else
				return keyCode === 32 || (keyCode >= 48 && keyCode <= 90) || (keyCode >= 96 && keyCode <= 111) || (keyCode >= 186 && keyCode <= 222);
		}
});



a5.Package('a5.cl.ui.core')
	.Import('a5.cl.mvc.core.XMLUtils',
			'a5.cl.core.Utils',
			'a5.cl.core.viewDef.ViewDefParser')
	.Extends('a5.cl.CLBase')
	.Class('ThemeParser', 'singleton', function(self, im, ThemeParser){
		ThemeParser._cl_ns = 'http://corelayerjs.com/';
		ThemeParser._cl_nsPrefix = 'cl';
		
		ThemeParser.getQualifiedClassName = function(classRef){
			return classRef.namespace().replace(/\./g, '_');
		}
		
		ThemeParser.getElementsByTagName = function(xml, tagName){
			return im.XMLUtils.getElementsByTagNameNS(xml, tagName, ThemeParser._cl_ns, ThemeParser._cl_nsPrefix);
		}
		
		var theme = null,
			imports = null;
		
		self.ThemeParser = function(){
			self.superclass(this);
		}
		
		self.parseTheme = function(rawTheme){
			theme = im.XMLUtils.parseXML(rawTheme);
			imports = im.ViewDefParser.getImports(theme);
			return theme;
		}
		
		/**
		 * Compile the styles for the given class, considering variant, state, and client environment.  Styles are inherited from parent classes.
		 * 
		 * @param {function|Object} classRef	The class (or instance) to build the styles for.
		 * @param {Object} modifiers	An object containing values for variant, state, environment, platform, or orientation.
		 */
		self.buildStyles = function(classRef, modifiers){
			var compiled = {},
				styleChain = [],
				ancestor = typeof classRef === 'function' ? classRef : classRef.constructor,
				x, prop, thisStyle;
			while(ancestor.isA5ClassDef && ancestor.isA5ClassDef()){
				styleChain.push(getClassStyles(ancestor, modifiers));
				ancestor = typeof ancestor.superclass === 'function' ? ancestor.superclass().constructor : false;
			}
			for(x = styleChain.length - 1; x >= 0; x--){
				thisStyle = styleChain[x];
				for(prop in thisStyle){
					compiled[prop] = thisStyle[prop];
				}
			}
			return compiled;
		}
		
		var getClassStyles = function(classRef, modifiers){
			var styles = classRef._cl_themeStyles || parseStyles(classRef),
				defaults = classRef.themeDefaults || {},
				compiled = {},
				prop, x, y, thisStyle;
			//apply the hard-coded defaults
			applyStyles(defaults, compiled);
			if(modifiers.state && defaults._states_ && defaults._states_[modifiers.state])
				applyStyles(defaults._states_[modifiers.state], compiled);
			//if we've loaded a theme, apply that
			if (theme) {
				//apply the theme-specific defaults
				applyVariant(styles._default_, compiled, modifiers);
				//if a variant was specified, and the theme has a matching variant, apply the variant styles
				if (modifiers.variant && styles[modifiers.variant]) 
					applyVariant(styles[modifiers.variant], compiled, modifiers);
			}
			return compiled;
		}
		
		var parseStyles = function(classRef){
			standardizeDefaults(classRef);
			if(!theme) return {};
			var styles = {},
				className = classRef.className(),
				matchingNodes, x, y, thisNode, variantAttr, parsedNode;
			if (imports[classRef.className()] !== classRef) 
				className = ThemeParser.getQualifiedClassName(classRef);
			matchingNodes = ThemeParser.getElementsByTagName(theme, className);
			styles['_default_'] = [];
			for(x = 0, y = matchingNodes.length; x < y; x++){
				thisNode = matchingNodes[x];
				parsedNode = parseNode(thisNode);
				variantAttr = im.XMLUtils.getNamedItemNS(thisNode.attributes, 'Variant', ThemeParser._cl_ns, ThemeParser._cl_nsPrefix);
				if(variantAttr) {
					if(!styles[variantAttr.value])
						styles[variantAttr.value] = [];
					styles[variantAttr.value].push(parsedNode);
				} else 
					styles._default_.push(parsedNode);
			}
			classRef._cl_themeStyles = styles;
			return styles;
		}
		
		var parseNode = function(styleNode){
			var obj = {}, 
				x, y, thisAttr, states, thisState, stateName,
				environmentAttr = im.XMLUtils.getNamedItemNS(styleNode.attributes, 'Environment', ThemeParser._cl_ns, ThemeParser._cl_nsPrefix),
				platformAttr = im.XMLUtils.getNamedItemNS(styleNode.attributes, 'Platform', ThemeParser._cl_ns, ThemeParser._cl_nsPrefix),
				orientationAttr = im.XMLUtils.getNamedItemNS(styleNode.attributes, 'Orientation', ThemeParser._cl_ns, ThemeParser._cl_nsPrefix);
			obj._environment_ = environmentAttr ? environmentAttr.value : '*';
			obj._platform_ = platformAttr ? platformAttr.value : '*';
			obj._orientation_ = orientationAttr ? orientationAttr.value : '*';
			for(x = 0, y = styleNode.attributes.length; x < y; x++){
				thisAttr = styleNode.attributes[x];
				if(im.XMLUtils.getPrefix(thisAttr) === null)
					obj[thisAttr.name] = im.ViewDefParser.processAttribute(thisAttr.value);
			}
			obj._states_ = {};
			states = im.ThemeParser.getElementsByTagName(styleNode, 'State');
			for(x = 0, y = states.length; x < y; x++){
				thisState = states[x];
				stateName = im.XMLUtils.getNamedItemNS(thisState.attributes, 'Name', ThemeParser._cl_ns, ThemeParser._cl_nsPrefix).value;
				obj._states_[stateName] = parseNode(thisState);
			}
			return obj;
		}
		
		var applyVariant = function(variant, obj, modifiers){
			for(x = 0, y = variant.length; x < y; x++){
				thisStyle = variant[x];
				//apply this style if it matches the client environment/platform/orientation
				if (styleMatchesEnvironment(thisStyle, modifiers.environment, modifiers.platform, modifiers.orientation)) {
					applyStyles(thisStyle, obj);
					//if a state was specified, and this style has a matching state, apply that as well
					if(modifiers.state && thisStyle._states_[modifiers.state])
						applyStyles(thisStyle._states_[modifiers.state], obj);
				}
			}
		}
		
		var applyStyles = function(styles, obj){
			for(var prop in styles){
				if(!isInternal(prop))
					obj[prop] = styles[prop];
			}
			return obj;
		}
		
		var isInternal = function(prop){
			return /^_(environment|platform|orientation|states|default)_$/.test(prop);
		}
		
		var styleMatchesEnvironment = function(style, environment, platform, orientation){
			var envMatch = !environment || style._environment_ === '*' || im.Utils.arrayContains(style._environment_.split('|'), environment),
				platMatch = !platform || style._platform_ === '*' || im.Utils.arrayContains(style._platform_.split('|'), platform),
				orMatch = !orientation || style._orientation_ === '*' || im.Utils.arrayContains(style._orientation_.split('|'), orientation);
			return envMatch && platMatch && orMatch;
		}
		
		var standardizeDefaults = function(classRef){
			var defaults = classRef.themeDefaults || {},
				prop;
			for(prop in defaults){
				if(!isInternal(prop) && !im.Utils.isArray(defaults[prop]))
					defaults[prop] = [defaults[prop]];
			}
		}
});



a5.Package('a5.cl.ui.core')
	
	.Import('a5.cl.core.Utils')
	.Extends('a5.cl.CLBase')
	.Class('ThemeManager', 'singleton', function(self, im, ThemeManager){
		var currentTheme = null,
			themables = [],
			parser;
		
		self.ThemeManager = function(){
			self.superclass(this);
			parser = this.create(im.ThemeParser);
		}
		
		self.loadTheme = function(url){
			self.cl().include(a5.cl.core.Utils.makeAbsolutePath(url), eThemeLoaded);
		}
		
		var eThemeLoaded = function(data){
			currentTheme = parser.parseTheme(data);
			for(var x = 0, y = themables.length; x < y; x++){
				themables[x]._cl_applyTheme();
			}
		}
		
		self._cl_registerThemable = function(obj){
			if(im.Utils.arrayIndexOf(themables, obj) === -1)
				themables.push(obj);
		}
		
		self._cl_deregisterThemable = function(obj){
			var idx = im.Utils.arrayIndexOf(themables, obj)
			if(idx > -1)
				themables.splice(idx, 1);
		}
		
		self._cl_applyTheme = function(obj, variant, state){
			var styles = parser.buildStyles(obj.constructor, {
				variant: variant,
				state: state,
				environment: this.cl().clientEnvironment(),
				platform: this.cl().clientPlatform(),
				orientation: this.cl().clientOrientation()
			}), prop;
			for(prop in styles){
				var spl = prop.split('_'),
					checkedProp,
					checkedObj = obj;
				if (spl.length > 1) {
					checkedProp = spl.pop();
					for (var i = 0, l = spl.length; i < l; i++) {
						if(spl[i].substr(0, 5) === 'CHILD'){
							checkedObj = checkedObj.getChildView(spl[i].substr(5));
						} else
							checkedObj = checkedObj[spl[i]]();
					}
				} else {
					checkedProp = spl[0];
				}
				if (checkedObj) {
					if (typeof checkedObj[checkedProp] === 'function') 
						checkedObj[checkedProp].apply(checkedObj, styles[prop]);
					else if (checkedObj.hasOwnProperty(checkedProp)) 
						checkedObj[checkedProp] = styles[prop][0];
				}
			}
		}
});



/**
 * @class 
 * @name a5.cl.ui.events.UIEvent
 */
a5.Package('a5.cl.ui.events')

	.Extends('a5.Event')
	.Static(function(UIEvent){
		
		/**
		 * @event
		 */
		UIEvent.CHANGE = 'UI_Change';
		
		/**
		 * @event
		 */
		UIEvent.CLOSE = 'UI_Close';
		
		/**
		 * @event
		 */
		UIEvent.SELECT = 'UI_Select';
		
		/**
		 * @event
		 */
		UIEvent.RESIZE_STARTED = 'UI_Resize_Started';
		
		/**
		 * @event
		 */
		UIEvent.RESIZE_STOPPED = 'UI_Resize_Stopped';
		
		/**
		 * @event
		 */
		UIEvent.RESIZED = 'UI_Resized';
		
		/**
		 * @event
		 */
		UIEvent.FOCUS = 'UI_Focus';
		
		/**
		 * @event
		 */
		UIEvent.BLUR = 'UI_Blur';

	})
	.Prototype('UIEvent', function(proto, im){
		
		proto.UIEvent = function($type, $nativeEvent, $bubbles){
			proto.superclass(this, [$type, $bubbles]);
			this._cl_nativeEvent = $nativeEvent;
			this._cl_preventDefault = false;
		}	
		
		proto.nativeEvent = function(){ 
			return this._cl_nativeEvent; 
		};
		
		proto.preventDefault = function(){
			this._cl_preventDefault = true;
		}
});


/**
 * @class 
 * @name a5.cl.ui.events.UIMouseEvent
 * @extends a5.cl.ui.events.UIEvent
 */
a5.Package('a5.cl.ui.events')

	.Extends('UIEvent')
	.Static(function(UIMouseEvent){
		
		/**
		 * 
		 */
		UIMouseEvent.CLICK = 'UI_Click';
		
		UIMouseEvent.DOUBLE_CLICK = 'UI_DoubleClick';
		
		/**
		 * 
		 */
		UIMouseEvent.RIGHT_CLICK = 'UI_RightClick';
		
		/**
		 * 
		 */
		UIMouseEvent.MOUSE_OVER = 'UI_MouseOver';
		
		/**
		 * 
		 */
		UIMouseEvent.MOUSE_OUT = 'UI_MouseOut';
		
		/**
		 * 
		 */
		UIMouseEvent.MOUSE_UP = 'UI_MouseUp';
		
		/**
		 * 
		 */
		UIMouseEvent.MOUSE_DOWN = 'UI_MouseDown';
	})
	.Prototype('UIMouseEvent', function(proto, im){
		
		proto.UIMouseEvent = function($type, $nativeEvent){
			proto.superclass(this, arguments);
		}
		
		/**
		 * @return Number
		 */
		proto.clientX = function(){
			if(this.nativeEvent)
				return this.nativeEvent().clientX;
		};
		
		/**
		 * @return Number
		 */
		proto.clientY = function(){
			if(this.nativeEvent)
				return this.nativeEvent().clientY;
		};
		
		/**
		 * @return Number
		 */
		proto.screenX = function(){
			if(this.nativeEvent)
				return this.nativeEvent().screenX;
		};
		
		/**
		 * @return Number
		 */
		proto.screenY = function(){
			if(this.nativeEvent)
				return this.nativeEvent().screenY;
		};	
});


a5.Package('a5.cl.ui.events')

	.Extends('UIEvent')
	.Static(function(UIListEvent){
		
		UIListEvent.ITEM_SELECTED = "UI_ListItemSelected";
		
		UIListEvent.ITEM_EXPANDED = "UI_ListItemExpanded";
		
		UIListEvent.ITEM_COLLAPSED = "UI_ListItemCollapsed";
	})
	.Prototype('UIListEvent', function(proto, im){
		
		proto.UIListEvent = function($type, $bubbles, $listItem){
			proto.superclass(this, [$type, null, $bubbles])
			this._cl_listItem = $listItem;
		}
		
		proto.listItem = function(){
			return this._cl_listItem;
		}
});


a5.Package('a5.cl.ui.events')
	.Import('a5.cl.ui.table.*')
	.Extends('UIEvent')
	.Static(function(UITableEvent){
		UITableEvent.SORT_ROWS = 'sortRows';
	})
	.Prototype('UITableEvent', function(proto, im){
		
		proto.UITableEvent = function(type, bubbles, headerCell, sortDirection){
			proto.superclass(this, [type, null, bubbles]);
			this._cl_headerCell = headerCell;
			this._cl_sortDirection = sortDirection;
		}
		
		proto.headerCell = function(){
			return this._cl_headerCell;
		}
		
		proto.sortDirection = function(){
			return this._cl_sortDirection;
		}
	});



a5.Package('a5.cl.ui.events')
	.Extends('UIEvent')
	.Static(function(UIKeyboardEvent){
		UIKeyboardEvent.KEY_UP = 'UI_KeyUp';
		UIKeyboardEvent.KEY_DOWN = 'UI_KeyDown';
		UIKeyboardEvent.KEY_PRESS = 'UI_KeyPress';
		UIKeyboardEvent.ENTER_KEY = 'UI_EnterKey';
	})
	.Prototype('UIKeyboardEvent', function(proto, im, UIKeyboardEvent){
		proto.UIKeyboardEvent = function(type, nativeEvent, bubbles){
			proto.superclass(this, arguments);
		}
		
		proto.keyCode = function(){
			return this.nativeEvent().keyCode;// || this.nativeEvent().which;
		}
		
		proto.keyCharacter = function(){
			var charCode = this.nativeEvent().charCode || this.keyCode();
			return charCode > 0 ? String.fromCharCode(charCode) : "";
		}
});
	



a5.Package('a5.cl.ui.interfaces')
	.Interface('ITabView', function(cls){
		cls.label = function(){};
		cls.activated = function(){};
		cls.deactivated = function(){};
		cls.staticWidth = function(){};
		cls.clickEnabled = function(){};
	});



a5.Package('a5.cl.ui.mixins')
	.Import('a5.cl.ui.events.UIEvent',
			'a5.cl.ui.form.UIOptionGroup')
	.Mixin('UIGroupable', function(proto, im){
		
		this.Properties(function(){
			this._cl_optionGroup = null;
			this._cl_selected = false;
		})
		
		proto.UIGroupable = function(){
			im.rebuild();
		}
		
		proto.selected = function(value, suppressEvent){
			if(typeof value === 'boolean' && value !== this._cl_selected){
				this._cl_selected = value;
				if(suppressEvent !== true)
					this.dispatchEvent(im.UIEvent.CHANGE);
				return this;
			}
			return this._cl_selected;
		}
		
		proto.optionGroup = function(value){
			if((value instanceof im.UIOptionGroup || value === null) && value !== this._cl_optionGroup){
				if(this._cl_optionGroup)
					this._cl_optionGroup._cl_removeOption(this);
				this._cl_optionGroup = value;
				if(value) value._cl_addOption(this);
				return this;
			}
			return this._cl_optionGroup;
		}
		
		proto.groupName = function(value){
			if (typeof value === 'string' && value != "") {
				this.optionGroup(im.UIOptionGroup.getGroupByName(value));
				return this;
			}
			return this._cl_optionGroup ? this._cl_optionGroup.groupName() : null;
		}
	
});


/**
 * @class Mixin class for all UI controls.  Primarily adds mouse interaction.
 * @name a5.cl.ui.mixins.UIInteractable
 */
a5.Package('a5.cl.ui.mixins')
	.Import('a5.cl.ui.events.UIMouseEvent')
	.Mixin('UIInteractable', function(proto, im){
		
		this.MustExtend('a5.cl.CLView');
		
		this.Properties(function(){
			this._cl_enabled = true;
			this._cl_clickEnabled = false;
			this._cl_usePointer = false;
			this._cl_contextMenuWindow = null;
			this._cl_preventRightClick = false;
		})
		
		proto.UIInteractable = function(){
			
		}
		
		/**
		 * 
		 * @param {Boolean} [value]
		 */
		proto.usePointer = function(value){
			if (typeof value === 'boolean') {
				this.cursor(value ? 'pointer' : '');
				return this;
			}
			return this._cl_usePointer;
		}
		
		proto.cursor = function(value){
			if(typeof value === 'string'){
				this._cl_cursor = value;
				this._cl_viewElement.style.cursor = value;
				return this;
			}
			return this._cl_viewElement.style.cursor;
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.clickEnabled = function(value){
			if(typeof value === 'boolean'){
				this._cl_clickEnabled = value;
				var self = this;
				this._cl_viewElement.onclick = !value ? null : function($e){
					var e = $e || window.event,
						preventDefault = proto._cl_eClickHandler.call(self, e);
					if(preventDefault){
						if(e.preventDefault)
							e.preventDefault();
						if(e.stopPropagation)
							e.stopPropagation();
						return false
					}
				}
				this._cl_viewElement.ondblclick = !value ? null : function($e){
					var e = $e || window.event,
						preventDefault = proto._cl_eDoubleClickHandler.call(self, e);
					if(preventDefault){
						if(e.preventDefault)
							e.preventDefault();
						if(e.stopPropagation)
							e.stopPropagation();
						return false
					}
				}
				this._cl_viewElement.onmousedown = !value ? null : function($e){
					var e = $e || window.event,
						preventDefault = proto._cl_eMouseDownHandler.call(self, e || window.event);
					if(preventDefault){
						if(e.preventDefault)
							e.preventDefault();
						if(e.stopPropagation)
							e.stopPropagation();
						return false
					}
				}
				this._cl_viewElement.onmouseup = !value ? null : function($e){
					var e = $e || window.event,
						preventDefault = proto._cl_eMouseUpHandler.call(self, e || window.event);
					if(preventDefault){
						if(e.preventDefault)
							e.preventDefault();
						if(e.stopPropagation)
							e.stopPropagation();
						return false
					}
				}
				return this;
			}
			return this._cl_clickEnabled;
		}
		
		proto.preventRightClick = function(value){
			if(typeof value === 'boolean'){
				this._cl_preventRightClick = value;
				return this;
			}
			return this._cl_preventRightClick;
		}
		
		proto.contextMenu = function(view){
			if(view instanceof a5.cl.CLView || view === null || view === false){
				if(!this._cl_contextMenuWindow)
					this._cl_contextMenuWindow = this.create(a5.cl.ui.modals.UIContextMenuWindow);
				this._cl_contextMenuWindow.menuView(view);
				if(view)
					this.addEventListener(im.UIMouseEvent.RIGHT_CLICK, proto._cl_showContextMenu, false, this);
				else
					this.removeEventListener(im.UIMouseEvent.RIGHT_CLICK, proto._cl_showContextMenu);
			}
			return this._cl_contextMenuWindow.menuView();
		}
		
		proto._cl_showContextMenu = function(e){
			e.preventDefault();
			this._cl_contextMenuWindow.open(e.nativeEvent());
		}
		
		proto._cl_eClickHandler = function(e){
			if(this.enabled()){
				var isRightClick = e.button === 2;
				if(!isRightClick){
					var evt = this.create(im.UIMouseEvent, [im.UIMouseEvent.CLICK, e]);
					evt.shouldRetain(true);
					this.dispatchEvent(evt);
					var preventDefault = evt._cl_preventDefault;
					evt.destroy();
					return preventDefault;
				}
				return this._cl_preventRightClick;
			}
		}
		
		proto._cl_eDoubleClickHandler = function(e){
			if(this.enabled()){
				var evt = this.create(im.UIMouseEvent, [im.UIMouseEvent.DOUBLE_CLICK, e]);
				evt.shouldRetain(true);
				this.dispatchEvent(evt);
				var preventDefault = evt._cl_preventDefault;
				evt.destroy();
				return preventDefault;
			}
		}
		
		proto._cl_eMouseDownHandler = function(e){
			if(this.enabled()){
				var evt = this.create(im.UIMouseEvent, [im.UIMouseEvent.MOUSE_DOWN, e]);
				evt.shouldRetain(true);
				this.dispatchEvent(evt);
				var preventDefault = evt._cl_preventDefault;
				evt.destroy();
				return preventDefault;
			}
		}
		
		proto._cl_eMouseUpHandler = function(e){
			if (this.enabled()) {
				var isRightClick = e.button === 2,
					evt = this.create(im.UIMouseEvent, [isRightClick ? im.UIMouseEvent.RIGHT_CLICK : im.UIMouseEvent.MOUSE_UP, e]);
				evt.shouldRetain(true);
				this.dispatchEvent(evt);
				var preventDefault = evt._cl_preventDefault;
				evt.destroy();
				return preventDefault || (isRightClick && this._cl_preventRightClick);
			}
		}
		
		/**
		 * 
		 * @param {Boolean} [value]
		 * @type Boolean
		 * @return
		 */
		proto.enabled = function(value){
			//Override this to add custom enable/disable functionality
			if (typeof value === 'boolean') {
				this._cl_enabled = value;
				this.alpha(value ? 1:.5);
				return this;
			}
			return this._cl_enabled;
		}
		
		proto.dealloc = function(){
			this._cl_viewElement.onclick = this._cl_viewElement.onmouseup = this._cl_viewElement.onmousedown = null;
		}
});



/**
 * @class Mixin class for themable components.  Adds the ability to apply a theme to the view.
 * @name a5.cl.ui.mixins.UIThemable
 */
a5.Package('a5.cl.ui.mixins')
	.Import('a5.cl.ui.core.ThemeManager',
			'a5.cl.mvc.CLViewEvent',
			'a5.cl.mvc.CLViewContainerEvent')
	.Mixin('UIThemable', function(proto, im){
		
		this.MustExtend('a5.cl.CLView');
		
		this.Properties(function(){
			this._cl_themeVariant = null;
			this._cl_themeState = null;
		});
		
		proto.UIThemable = function(){
			im.ThemeManager.instance()._cl_registerThemable(this);
		}
		
		proto.mixinReady = function(){
			var self = this;
			if (this.viewIsReady()) {
				this._cl_applyTheme();
			} else {
				this.addEventListener((this instanceof a5.cl.CLViewContainer ? im.CLViewContainerEvent.CHILDREN_READY : im.CLViewEvent.VIEW_READY), function(){
					self._cl_applyTheme();
				})
			}
		}
		
		proto.themeVariant = function(value){
			if(value !== undefined){
				this._cl_themeVariant = value;
				this._cl_applyTheme();
				return this;
			}
			return this._cl_themeVariant;
		}
		
		proto.themeState = function(value){
			if(value !== undefined){
				this._cl_themeState = value;
				this._cl_applyTheme();
				return this;
			}
			return this._cl_themeState;
		}
		
		proto._cl_applyTheme = function(){
			im.ThemeManager.instance()._cl_applyTheme(this, this._cl_themeVariant, this._cl_themeState);
		}
		
		proto.dealloc = function(){
			im.ThemeManager.instance()._cl_deregisterThemable(this);
		}
});



a5.Package('a5.cl.ui.mixins')
	.Import('a5.cl.ui.events.UIKeyboardEvent',
			'a5.cl.core.Utils')
	.Mixin('UIKeyboardEventDispatcher', function(proto, im){
		
		proto.MustExtend('a5.EventDispatcher');
		
		proto.Properties(function(){
			this._cl_keyEventTarget = null;
			this._cl_keyUpEvent = null;
			this._cl_keyDownEvent = null;
			this._cl_keyPressEvent = null;
			this._cl_enterKeyEvent = null;
		})
		
		proto.UIKeyboardEventDispatcher = function(){
			//create events that will be retained and reused
			this._cl_keyUpEvent = this.create(im.UIKeyboardEvent, [im.UIKeyboardEvent.KEY_UP]).shouldRetain(true);
			this._cl_keyDownEvent = this.create(im.UIKeyboardEvent, [im.UIKeyboardEvent.KEY_DOWN]).shouldRetain(true);
			this._cl_keyPressEvent = this.create(im.UIKeyboardEvent, [im.UIKeyboardEvent.KEY_PRESS]).shouldRetain(true);
			this._cl_enterKeyEvent = this.create(im.UIKeyboardEvent, [im.UIKeyboardEvent.ENTER_KEY]).shouldRetain(true);
			
			//create the event handlers
			var self = this;
			this._cl_eKeyUpNativeHandler = function($e){
				var e = $e || window.event,
					preventDefault = proto._cl_eKeyUpHandler.call(self, e);
				if(preventDefault){
					if(e.preventDefault)
						e.preventDefault();
					if(e.stopPropagation)
						e.stopPropagation();
					return false
				}
			}
			
			this._cl_eKeyDownNativeHandler = function($e){
				var e = $e || window.event,
					preventDefault = proto._cl_eKeyDownHandler.call(self, e);
				if(preventDefault){
					if(e.preventDefault)
						e.preventDefault();
					if(e.stopPropagation)
						e.stopPropagation();
					return false
				}
			}
			
			this._cl_eKeyPressNativeHandler = function($e){
				var e = $e || window.event,
					preventDefault = proto._cl_eKeyPressHandler.call(self, e);
				if(preventDefault){
					if(e.preventDefault)
						e.preventDefault();
					if(e.stopPropagation)
						e.stopPropagation();
					return false
				}
			}
		}
		
		proto.keyboardEventTarget = function(elem){
			if(elem !== undefined){
				if(this._cl_keyEventTarget)
					this._cl_removeKeyboardEventListeners();
				this._cl_keyEventTarget = elem;
				this._cl_addKeyboardEventListeners();
				return this;
			}
			return this._cl_keyEventElement;
		}
		
		proto._cl_addKeyboardEventListeners = function(){
			im.Utils.addEventListener(this._cl_keyEventTarget, 'keyup', this._cl_eKeyUpNativeHandler);
			im.Utils.addEventListener(this._cl_keyEventTarget, 'keydown', this._cl_eKeyDownNativeHandler);
			im.Utils.addEventListener(this._cl_keyEventTarget, 'keypress', this._cl_eKeyPressNativeHandler);
		}
		
		proto._cl_removeKeyboardEventListeners = function(){
			im.Utils.removeEventListener(this._cl_keyEventTarget, 'keyup', this._cl_eKeyUpNativeHandler);
			im.Utils.removeEventListener(this._cl_keyEventTarget, 'keydown', this._cl_eKeyDownNativeHandler);
			im.Utils.removeEventListener(this._cl_keyEventTarget, 'keypress', this._cl_eKeyPressNativeHandler);
		}
		
		proto._cl_eKeyUpHandler = function(e){
			this._cl_keyUpEvent._cl_preventDefault = false;
			this._cl_keyUpEvent._cl_nativeEvent = e;
			this.dispatchEvent(this._cl_keyUpEvent);
			return this._cl_keyUpEvent._cl_preventDefault;
		}
		
		proto._cl_eKeyDownHandler = function(e){
			this._cl_keyDownEvent._cl_preventDefault = false;
			this._cl_keyDownEvent._cl_nativeEvent = e;
			this.dispatchEvent(this._cl_keyDownEvent);
			return this._cl_keyDownEvent._cl_preventDefault;
		}
		
		proto._cl_eKeyPressHandler = function(e){
			var preventPressDefault = false,
				preventEnterDefault = false;
			this._cl_keyPressEvent._cl_nativeEvent = this._cl_enterKeyEvent._cl_nativeEvent = e;
			this._cl_keyPressEvent._cl_preventDefault = this._cl_enterKeyEvent._cl_preventDefault = false;
			this.dispatchEvent(this._cl_keyPressEvent);
			if(this._cl_keyPressEvent.keyCode() === 13)
				this.dispatchEvent(this._cl_enterKeyEvent);
			return this._cl_keyPressEvent._cl_preventDefault || this._cl_enterKeyEvent._cl_preventDefault;
		}
		
		proto.dealloc = function(){
			this._cl_removeKeyboardEventListeners();
			this._cl_keyUpEvent.destroy();
			this._cl_keyDownEvent.destroy();
			this._cl_keyPressEvent.destroy();
			this._cl_enterKeyEvent.destroy();
		}
});



/**
 * @class Base class for UI controls that extend CLViewContainer.
 * @name a5.cl.ui.UIControl
 * @extends a5.cl.CLViewContainer
 */
a5.Package('a5.cl.ui')
	.Extends('a5.cl.CLViewContainer')
	.Mix('a5.cl.ui.mixins.UIInteractable',
		 'a5.cl.ui.mixins.UIThemable')
	.Prototype('UIControl', function(proto, im){
		
		proto.UIControl = function(){
			proto.superclass(this);
			this.usePointer(false)
			this.width('auto').height('auto');
		}
		
});


/**
 * @class Base class for UI controls that extend CLHTMLView.
 * @name a5.cl.ui.UIHTMLControl
 * @extends a5.cl.CLHTMLView
 */
a5.Package('a5.cl.ui')
	.Extends('a5.cl.CLHTMLView')
	.Mix('a5.cl.ui.mixins.UIInteractable',
		 'a5.cl.ui.mixins.UIThemable')
	.Prototype('UIHTMLControl', function(proto, im){
		
		proto.UIHTMLControl = function(){
			proto.superclass(this);
			this.usePointer(false).width('auto').height('auto').clickHandlingEnabled(false);
		}
		
});


a5.Package('a5.cl.ui')
	.Import('a5.cl.CLController')
	.Extends('CLController')
	.Prototype('UIController', function(proto, im){
		
		proto.UIController = function(defaultView){
			proto.superclass(this, [defaultView || this.create(a5.cl.CLWindow)]);
		}
});



a5.Package('a5.cl.ui')
	
	.Extends('UIHTMLControl')
	.Static(function(UICanvas){
		
		UICanvas._cl_canvasAvailable = !!document.createElement('canvas').getContext;
		
		UICanvas.canvasAvailable = function(){
			return UICanvas._cl_canvasAvailable;
		}
		
		UICanvas.supportsText = function(){
			return typeof document.createElement('canvas').getContext('2d').context.fillText == 'function';
		}		
	})
	.Prototype('UICanvas', function(proto, im, UICanvas){
		
		proto.UICanvas = function(){
			proto.superclass(this);
			this._cl_overflowHeight = 0;
			this._cl_overflowWidth = 0;
			this._cl_canvasElement = null;
			this._cl_context = null;
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			if (UICanvas.canvasAvailable) {
				this._cl_canvasElement = document.createElement('canvas');
				this.appendChild(this._cl_canvasElement);
				this._cl_context = this._cl_canvasElement.getContext('2d');
			} else {
				this.redirect(500, 'Cannot draw UICanvas element, canvas is unavailable in this browser.');
			}
		}
		
		proto.overflowHeight = function(value){ return this._cl_propGetSet('_cl_overflowHeight', value); }
		
		proto.overflowWidth = function(value){ return this._cl_propGetSet('_cl_overflowWidth', value); }
		
		proto.clear = function(){
			this._cl_canvasElement.width = this._cl_canvasElement.width;
		}
		
		proto.context = function(type){
			if (type && type !== '2d') {
				try {
					return this._cl_canvasElement.getContext(type);
				} catch(e){
					return null;
				}
			} else {
				return this._cl_context;
			}
		}
		
		proto.Override._cl_redraw = function(){
			proto.superclass()._cl_redraw.apply(this, arguments);
			this._cl_canvasElement.width = this.width('client') + this._cl_overflowWidth;
			this._cl_canvasElement.height = this.height('client') + this._cl_overflowHeight;
		}	
});

a5.Package('a5.cl.ui')
	.Static('UIScaleMode', function(UIScaleMode){
		UIScaleMode.CLIP = 'clip';
		UIScaleMode.MAINTAIN = 'maintain';
		UIScaleMode.FILL = 'fill';
		UIScaleMode.STRETCH = 'stretch';
});

/**
 * @class 
 * @name a5.cl.ui.UIImage
 * @extends a5.cl.ui.UIHTMLControl
 */
a5.Package('a5.cl.ui')
	.Import('a5.cl.*',
			'a5.cl.core.Utils')
	.Extends('UIHTMLControl')
	.Prototype('UIImage', function(proto, im, UIImage){
		
		this.Properties(function(){
			this._cl_isBG = false;
			this._cl_imgElement = null;
			this._cl_src = null;
			this._cl_imgHeight = 0;
			this._cl_imgWidth = 0;
			this._cl_nativeWidth = 0;
			this._cl_nativeHeight = 0;
			this._cl_scaleMode = im.UIScaleMode.CLIP;
			this._cl_isBase64 = false;
			this._cl_imageAlignX = 'left';
			this._cl_imageAlignY = 'top';
			this._cl_imgLoaded = false;
			this._cl_pendingImgSize = false;
			this._cl_pendingFirstDraw = false;		
			this.skipViewDefReset = ['src'];
		})
		
		proto.UIImage = function(src, isBG){
			proto.superclass(this);
			if (isBG !== undefined) {
				this._cl_isBG = isBG;
			} else {
				this.width('auto').height('auto');
				this._cl_imgElement = new Image();
			}
			if(src !== undefined)
				this.src(src);
		}
		
		proto._cl_applySrc = function(){
			var self = this,
				onLoad = function(){
					self._cl_nativeWidth = self._cl_imgElement.naturalWidth || self._cl_imgElement.width;
					self._cl_nativeHeight = self._cl_imgElement.naturalHeight || self._cl_imgElement.height;
					self._cl_imgLoaded = true;
					self._cl_pendingFirstDraw = true;
					self._cl_updateImgSize();
					self._cl_imgElement.onload = self._cl_imgElement.onerror = null;
					self.drawHTML(self._cl_imgElement);
					self.redraw();
				},
				onError = function(e){
					self.MVC().redirect(500, "UIImage Error: Error loading image at url " + self._cl_src);
					self._cl_imgElement.onload = self._cl_imgElement.onerror = null;
				};
			this._cl_imgLoaded = false;
			this._cl_imgElement.style.width = this._cl_imgElement.style.height = null; 
			if(!this._cl_src){
				this._cl_imgElement.src = "";
				self._cl_nativeWidth = 0;
				self._cl_nativeHeight = 0;
				self._cl_updateImgSize();
				self.drawHTML(self._cl_imgElement);
				self.redraw();
			}else if (!this._cl_isBG) {
				this._cl_imgElement.style.visibility = 'hidden';
				this._cl_imgElement.style.position = 'relative';
				this._cl_imgElement.onload = onLoad;
				this._cl_imgElement.onerror = onError;
				this._cl_imgElement.src = this._cl_src !== null && this._cl_src !== "" ? (this.isBase64() ? this._cl_src: im.Utils.makeAbsolutePath(this._cl_src)) : null;
			} else {
				this._cl_css('backgroundImage', "url('" + this._cl_src + "')");
			}
		}
		
		proto.isBase64 = function(value){
			if(typeof value === 'boolean'){
				this._cl_isBase64 = value;
				return this;
			}
			return this._cl_isBase64;
		}
		
		proto._cl_updateImgSize = function(){
			if(!this._cl_imgLoaded) return;
			var imgWidth = 0, imgHeight = 0,
				thisWidth = this.width(),
				thisHeight = this.height();
			switch(this._cl_scaleMode){
				case im.UIScaleMode.CLIP:
					imgWidth = this._cl_nativeWidth;
					imgHeight = this._cl_nativeHeight;
					break;
				case im.UIScaleMode.STRETCH:
					this._cl_imgElement.style.width = this._cl_imgElement.style.height = '100%';
					break;
				case im.UIScaleMode.MAINTAIN:
				case im.UIScaleMode.FILL:
					//if the width or height is zero, wait until next redraw
					if(thisWidth <= 0 || thisHeight <= 0){
						this._cl_pendingImgSize = true;
						return;
					}	
					var viewAspect = thisWidth / thisHeight,
						nativeAspect = this._cl_nativeWidth / this._cl_nativeHeight;
					if(isNaN(nativeAspect) || nativeAspect === Infinity)
						nativeAspect = 1;
					if(this.height('value') === 'auto' || (this._cl_scaleMode === im.UIScaleMode.FILL && viewAspect > nativeAspect && !this._cl_width.auto) || (this._cl_scaleMode === im.UIScaleMode.MAINTAIN && viewAspect < nativeAspect && !this._cl_width.auto)){
						imgWidth = thisWidth;
						imgHeight = this._cl_nativeHeight / this._cl_nativeWidth * thisWidth;
					} else {
						imgHeight = thisHeight;
						imgWidth = nativeAspect * thisHeight;
					}
					break;
			}
			if(imgWidth > 0 && imgHeight > 0){
				this._cl_imgElement.style.width = imgWidth + 'px';
				this._cl_imgElement.style.height = imgHeight + 'px';
				
				switch(this._cl_imageAlignX){
					case 'left':
						this._cl_imgElement.style.left = 0;
						break;
					case 'center':
						this._cl_imgElement.style.left = (thisWidth / 2 - imgWidth / 2) + 'px';
						break;
					case 'right':
						this._cl_imgElement.style.right = 0;
						break;
				}
				
				switch(this._cl_imageAlignY){
					case 'top':
						this._cl_imgElement.style.top = 0;
						break;
					case 'middle':
						this._cl_imgElement.style.top = (thisHeight / 2 - imgHeight / 2) + 'px';
						break;
					case 'bottom':
						this._cl_imgElement.style.bottom = 0;
						break;
				}
			}
			this._cl_pendingImgSize = false;
			//this.redraw();
		}
		
		/**
		 * 
		 * @param {String} url
		 */
		proto.src = function(src){
			if(typeof src === 'string' || src === null){
				var didChange = src !== this._cl_src;
				this._cl_src = src;
				if(didChange)
					this._cl_applySrc();
				return this;
			}
			return this._cl_src;
		}
		
		proto.tileMode = function(value){ 
			if (typeof value === 'string') {
				this._cl_css('backgroundRepeat', value);
				return this;
			}
			//return this._cl_getCSS('background-repeat');
		}
		
		proto.scaleMode = function(value){
			if(typeof value === 'string'){
				this._cl_scaleMode = value;
				this._cl_updateImgSize();
				return this;
			}
			return this._cl_scaleMode;
		}
		
		proto.imageAlignX = function(value){
			if(typeof value === 'string'){
				if(this._cl_imageAlignX !== value){
					this._cl_imageAlignX = value;
					this._cl_updateImgSize();
				}
				return this;
			}
			return this._cl_imageAlignX;
		}
		
		proto.imageAlignY = function(value){
			if(typeof value === 'string'){
				if(this._cl_imageAlignY !== value){
					this._cl_imageAlignY = value;
					this._cl_updateImgSize();
				}
				return this;
			}
			return this._cl_imageAlignY;
		}
		
		proto.nativeWidth = function(){
			return this._cl_nativeWidth;
		}
		
		proto.nativeHeight = function(){
			return this._cl_nativeHeight;
		}
		
		proto.Override.alignX = function(value){
			var returnVal = proto.superclass().alignX.apply(this, arguments);
			if(typeof value === 'string')
				this.css('textAlign', value);
			return returnVal;
		}
		
		proto.Override.width = function(value){
			var returnVal = proto.superclass().width.call(this, value);
			if((typeof value === 'number' || typeof value === 'string') && value !== 'client' && value !== 'inner' && value !== 'value' && value !== 'scroll' && value !== 'content')
				this._cl_updateImgSize();
			else if(!this._cl_isBG && value === 'scroll' || value === 'content')
				return this._cl_imgElement.scrollWidth;
				//return this._cl_width.auto ? this._cl_nativeWidth : this._cl_imgElement.scrollWidth;
			return returnVal; 
		}
		
		proto.Override.height = function(value){
			var returnVal = proto.superclass().height.call(this, value);
			if((typeof value === 'number' || typeof value === 'string') && value !== 'client' && value !== 'inner' && value !== 'value' && value !== 'scroll' && value !== 'content')
				this._cl_updateImgSize();
			else if(!this._cl_isBG && value === 'scroll' || value === 'content')
				return this._cl_imgElement.scrollHeight;
				//return this._cl_height.auto ? this._cl_nativeHeight : this._cl_imgElement.scrollHeight;
			return returnVal;
		}
		
		proto.Override._cl_redraw = function(){
			var initialRenderComplete = this._cl_initialRenderComplete,
				returnVal = proto.superclass()._cl_redraw.apply(this, arguments),
				dynamicScale = (this._cl_scaleMode === im.UIScaleMode.FILL || this._cl_scaleMode === im.UIScaleMode.MAINTAIN), 
				relativeSize = (this._cl_width.percent !== false || this._cl_height.percent !== false || this._cl_width.relative !== false || this._cl_height.relative !== false);
			if(this._cl_pendingImgSize || !initialRenderComplete || (returnVal.shouldRedraw && dynamicScale && relativeSize))
				this._cl_updateImgSize();
			if(this._cl_pendingFirstDraw)
				this._cl_imgElement.style.visibility = 'visible';
			return returnVal;
		}
		
		proto.dealloc = function(){
			this._cl_destroyElement(this._cl_imgElement);
			this._cl_imgElement = null;
		}
});



/**
 * @class 
 * @name a5.cl.ui.UITextField
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Extends('UIHTMLControl')
	.Prototype('UITextField', function(proto, im){
		
		proto.UITextField = function(text){
			proto.superclass(this);
			this._cl_text = "";
			this._cl_nonBreaking = false;
			this._cl_textColor = '#000';
			this._cl_textAlign = 'left';
			this._cl_textDecoration = 'none';
			this._cl_fontSize = '14px';
			this._cl_fontWeight = 'normal';
			this._cl_fontStyle = 'normal';
			this._cl_fontFamily = null;
			this._cl_formElement = null;
			this._cl_element = this.htmlWrapper();
			this.height('auto');
			this.fontFamily('Arial');
			if(typeof text === 'string')
				this.text(text);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this._cl_element.style.minHeight = '1em';
		}
		
		/**
		 * 
		 * @param {String} value
		 */
		proto.text = function(value){
			if(value !== undefined && value !== null){
				this._cl_text = String(value);
				this._cl_setText();
				return this;
			}
			return this._cl_text;
		}
		
		proto.nonBreaking = function(value){
			if(typeof value === 'boolean'){
				this._cl_nonBreaking = value;
				this._cl_setText();
				return this;
			}
			return this._cl_nonBreaking;
		}
		
		/**
		 * 
		 * @param {a5.cl.ui.form.UIFormElement} input
		 */
		proto.isLabelFor = function(input){
			//make sure an input was passed
			if(input instanceof a5.cl.ui.form.UIFormElement){
				var inputID = null;
				inputID = input.element().id;
				this._cl_formElement = input;
				//make sure that we have a valid ID to use
				if(typeof inputID === 'string' && inputID.length > 0){
					if(this._cl_element.tagName.toUpperCase() === "LABEL"){
						//if the element is already a label, just update the 'for' param
						this._cl_element.setAttribute('for', inputID);
					} else {
						//otherwise, create a new <label> element, and copy the appropriate properties from the current element
						var label = document.createElement('label');
						label.setAttribute('for', inputID);
						label.style.cursor = 'inherit';
						label.className = this._cl_element.className;
						label.innerHTML = this._cl_element.innerHTML;
						this._cl_element.innerHTML = "";
						//add the new element
						this.appendChild(label);
						//update the element reference
						this._cl_element = label;
						label = null;
					}
				}
			}
		}
		
		proto.textColor = function(value){
			if(typeof value === 'string'){
				this._cl_textColor = this._cl_element.style.color = value;
				return this;
			}
			return this._cl_textColor;
		}
		
		proto.textAlign = function(value){
			if(typeof value === 'string'){
				this._cl_textAlign = this._cl_element.style.textAlign = value;
				return this;
			}
			return this._cl_textAlign;
		}
		
		proto.textDecoration = function(value){
			if(typeof value === 'string'){
				this._cl_textDecoration = this._cl_element.style.textDecoration = value;
				return this;
			}
			return this._cl_textDecoration;
		}
		
		proto.fontSize = function(value){
			if(typeof value === 'number')
				value = value + 'px';
			if(typeof value === 'string'){
				this._cl_fontSize = value;
				this.css('fontSize', value);
				return this;
			}
			return this._cl_fontSize;
		}
		
		proto.fontWeight = function(value){
			if(typeof value === 'string'){
				this._cl_fontWeight = value;
				this.css('fontWeight', value);
				return this;
			}
			return this._cl_fontWeight;
		}
		
		proto.fontStyle = function(value){
			if(typeof value === 'string'){
				this._cl_fontStyle = value;
				this.css('fontStyle', value);
				return this;
			}
			return this._cl_fontStyle;
		}
		
		proto.fontFamily = function(value){
			if(typeof value === 'string'){
				this._cl_fontFamily = value;
				this.css('fontFamily', value);
				return this;
			}
			return this._cl_fontFamily;
		}
		
		proto.bold = function(value){
			if(typeof value === 'boolean'){
				this.fontWeight(value ? 'bold' : 'normal');
				return this;
			}
			return this.fontWeight() === 'bold';
		}
		
		proto.italic = function(value){
			if(typeof value === 'boolean'){
				this.fontStyle(value ? 'italic' : 'normal');
				return this;
			}
			return this.fontStyle() === 'italic';
		}
		
		proto.underline = function(value){
			if(typeof value === 'boolean'){
				this.textDecoration(value ? 'underline' : 'none');
				return this;
			}
			return this.textDecoration() === 'underline';
		}
		
		/**
		 * 
		 */
		proto.element = function(){ return this._cl_element; }
		
		proto._cl_setText = function(){
			var value;
			if(this._cl_nonBreaking)
				value = this._cl_text.replace(/(\s)/gm, function(x){ return new Array(x.length + 1).join('&nbsp;') });
			else
				value = this._cl_text;
			this._cl_replaceNodeValue(this._cl_element, value);
		}
		
		proto.Override._cl_redraw = function(){
			var firstRender = !this._cl_initialRenderComplete,
				returnVal = proto.superclass()._cl_redraw.apply(this, arguments);
			if (firstRender && this._cl_text !== '' && (this._cl_width.auto || this._cl_height.auto))
				this._cl_setText(this._cl_text);
			return returnVal;
		}
		
		proto.dealloc = function(){
			if(this._cl_element !== this.htmlWrapper())
				this._cl_destroyElement(this._cl_element);
			this._cl_element = null;
		}	
});


a5.Package('a5.cl.ui')
	.Import('a5.cl.ui.events.*')
	.Extends('UITextField')
	.Prototype('UILink', function(proto, im){
		
		proto.UILink = function(){
			proto.superclass(this);
			this.clickEnabled(true).usePointer(true);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			
			this.addEventListener(im.UIMouseEvent.MOUSE_OVER, this.onRollOver, false, this);
			this.addEventListener(im.UIMouseEvent.MOUSE_OUT, this.onRollOut, false, this);
			
			var self = this;
			this._cl_viewElement.onmouseover = function(e){
				if(self._cl_enabled)
					self.dispatchEvent(self.create(im.UIMouseEvent, [im.UIMouseEvent.MOUSE_OVER, e || window.event]));
			}
			this._cl_viewElement.onmouseout = function(e){
				if(self._cl_enabled)
					self.dispatchEvent(self.create(im.UIMouseEvent, [im.UIMouseEvent.MOUSE_OUT, e || window.event]));
			}
		}
		
		proto.onRollOver = function(){
			this.underline(true);
		}
		
		proto.onRollOut = function(){
			this.underline(false);
		}
	});



/**
 * @class 
 * @name a5.cl.ui.UIFrameView
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Import('a5.cl.*',
			'a5.cl.CLEvent')
	.Extends('UIHTMLControl')
	.Static(function(UIFrameView){
		
		UIFrameView.ALLOW_SAME_ORIGIN = "allow-same-origin";
		
		UIFrameView.ALLOW_FORMS = "allow-forms";
		
		UIFrameView.ALLOW_SCRIPTS = "allow-scripts";
	})
	.Prototype('UIFrameView', function(proto, im){
		
		proto.UIFrameView = function(){
			proto.superclass(this);
			this._cl_iframe = document.createElement('iframe');
			this._cl_iframe.frameBorder = 0;
			this._cl_iframe.style.width = this._cl_iframe.style.height = '100%';
			this._cl_url = null;
			this._cl_iframeDoc = null;
			
			this.superclass().appendChild.call(this, this._cl_iframe);
			this.cl().addEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, this._cl_checkFrameDOM, false, this);	
		}
		
		proto.iframe = function(){
			return this._cl_iframe;
		}
		
		proto._cl_checkFrameDOM = function(){
			if(this._cl_iframe.contentDocument)
		    	this._cl_iframeDoc = this._cl_iframe.contentDocument;
			else if(this._cl_iframe.contentWindow)
				this._cl_iframeDoc = this._cl_iframe.contentWindow.document;
			else if(this._cl_iframe.document)
				this._cl_iframeDoc = this._cl_iframe.document;
			if (this._cl_iframeDoc) {
				this.cl().removeEventListener(im.CLEvent.GLOBAL_UPDATE_TIMER_TICK, this._cl_checkFrameDOM);
				this.dispatchEvent('READY');
			}		
				
		}
		
		/**
		 * 
		 * @param {String} url
		 */
		proto.url = function(url){
			this._cl_iframe.src = url;
		}
		
		proto.Override.drawHTML = function(value){
			if(typeof value !== 'string'){
				var elem = document.createElement('div');
				elem.appendChild(value);
				value = elem.innerHTML;
				elem = null;
			}
			this._cl_iframeDoc.write(value);
		}
		
		proto.sandboxSettings = function(){
			args = Array.prototype.slice.call(arguments);
			if(args.length){
				var str = '';
				for (var i = 0, l = args.length; i < l; i++) {
					str += args[i];
					if(i<l-1)
						str += ' ';
				}
				this._cl_iframe.setAttribute('sandbox', str);
			} else {
				this._cl_iframe.removeAttribute('sandbox');
			}
				
		}
		
		proto.eval = function(str){
			this._cl_iframe.contentWindow.focus();
			if(this._cl_iframe.contentWindow.execScript)
				return this._cl_iframe.contentWindow.execScript(str);
			else 
				return this._cl_iframe.contentWindow.eval(str);
		}
		
		/**
		 * 
		 * @param {Boolean} value
		 */
		proto.scrolling = function(value){
			this._cl_iframe.scrolling = value ? 'auto':'no'; 
		}
		
		proto.dealloc = function(){
			this._cl_destroyElement(this._cl_iframe);
			this._cl_iframeDoc = null;
			this._cl_iframe = null;
		}
		
});


/**
 * @class 
 * @name a5.cl.ui.UIResizable
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Import('a5.cl.ui.events.*',
			'a5.cl.core.Utils')
	.Extends('UIControl')
	.Prototype('UIResizable', function(proto, im){
		
		
		proto.UIResizable = function(coordinates){
			this._cl_contentView = this.create(a5.cl.ui.UIControl).width('100%').height('100%');
			this._cl_handles = {};
			if(typeof coordinates == 'string'){
				this._cl_coordinates = [];
				var splitCoords = coordinates.split(',');
				for(var x = 0, y = splitCoords.length; x < y; x++){
					var thisCoord = splitCoords[x];
					if(this._cl_validateDirection(thisCoord))
						this._cl_coordinates.push(thisCoord);
				}
			} else {
				this._cl_coordinates = ['e', 'se', 's'];
			}
			this._cl_handleSize = 5;
			this._cl_resizing = false;
			this._cl_cachedWidth = 0;
			this._cl_cachedHeight = 0;
			this._cl_cachedY = 0;
			this._cl_cachedX = 0;
			this._cl_cachedMouseX = 0;
			this._cl_cachedMouseY = 0;
			this._cl_viewIsReady = false;
			this._cl_resizeEventsEnabled = false;
			
			proto.superclass(this);
			
			this.minWidth(50);
			this.minHeight(50);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			this._cl_viewIsReady = true;
			//add the content view
			a5.cl.CLViewContainer.prototype.addSubViewAtIndex.call(this, this._cl_contentView, 0);
			//make sure scrollX/scrollY are applied to the contentView and NOT the main view
			if(this.scrollXEnabled())
				this._cl_contentView.scrollXEnabled(true);
			if(this.scrollYEnabled())
				this._cl_contentView.scrollYEnabled(true);
			proto.superclass().scrollXEnabled.call(this, false);
			proto.superclass().scrollYEnabled.call(this, false);
			
			//create the handles
			this.setCoordinates(this._cl_coordinates);
		}
		
		proto.Override.childrenReady = function(){
			proto.superclass().childrenReady.apply(this, arguments);
			//move any sub-views added by the viewdef into the contentView
			for(var x = 0; x<this.subViewCount(); x++){
				var thisView = this.subViewAtIndex(x);
				var shouldMove = thisView !== this._cl_contentView;
				if(shouldMove){
					for(var prop in this._cl_handles){
						if(this._cl_handles[prop] === thisView){
							shouldMove = false;
							break;
						}
					}
				}
				if(shouldMove)
					this._cl_contentView.addSubView(thisView);
			}
			//this._cl_locked(true);
		}
		
		/**
		 * Set the directions in which this object should be resizable.
		 * 
		 * @param {Array|String} coords An array of coordinate strings, or a comma-delimited list. (n, ne, e, se, s, sw, w, nw)
		 */
		proto.setCoordinates = this.Attributes(
			["a5.Contract", {coords:'array'}, {coords:'string'}], 
			function(args){
				if(args && this._cl_viewIsReady){
					var coords = args.coords;
					if(args.overloadID === 1)
						coords = args.coords.split(',');
					this._cl_coordinates = coords;
					if (this._cl_viewIsReady) {
						var allCoords = ['n', 's', 'e', 'w', 'ne', 'se', 'sw', 'nw'];
						for (var x = 0, y = allCoords.length; x < y; x++) {
							var thisCoord = allCoords[x];
							if (im.Utils.arrayIndexOf(coords, thisCoord) === -1) 
								this.disableCoordinate(thisCoord);
							else this.enableCoordinate(thisCoord);
						}
					}
				}
			})
		
		/**
		 * Enable resizing for the specified direction.
		 * 
		 * @param {String} coord The direction in which to enable resizing. (n, ne, e, se, s, sw, w, nw)
		 */
		proto.enableCoordinate = function(coord){
			if(this._cl_validateDirection(coord) && !this._cl_handles[coord]){
				this._cl_createHandle(coord);
			}
		}
		
		/**
		 * Disable resizing for the specified direction
		 * 
		 * @param {String} coord The direction in which to disable resizing. (n, ne, e, se, s, sw, w, nw)
		 */
		proto.disableCoordinate = function(coord){
			if(this._cl_validateDirection(coord) && this._cl_handles[coord]){
				this.removeSubView(this._cl_handles[coord]);
				delete this._cl_handles[coord];
			}
		}
		
		proto.getHandle = function(coord){
			return this._cl_handles[coord];
		}
		
		proto._cl_createHandle = function(direction){
			//create a new button to act as the handle
			var handle = this.create(a5.cl.ui.UIControl).clickEnabled(true);
			handle.handleDirection = direction;
			this._cl_handles[direction] = handle;
			a5.cl.CLViewContainer.prototype.addSubView.call(this, handle);
			//give it the appropriate cursor
			handle.cursor(direction + '-resize');
			//set the size and position based on the direction
			handle.width(direction.match(/e|w/) !== null ? this._cl_handleSize : '100%');//((0 - this._cl_handleSize * 2) + ''));
			handle.height(direction.match(/n|s/) !== null ? this._cl_handleSize : '100%');//((0 - this._cl_handleSize * 2) + ''));
			//handle.x(direction.match(/e|w/) !== null ? (0) : this._cl_handleSize);
			//handle.y(direction.match(/n|s/) !== null ? (0) : this._cl_handleSize);
			handle.x(0).y(0);
			handle.alignX(direction.indexOf('e') !== -1 ? 'right' : 'left');
			handle.alignY(direction.indexOf('s') !== -1 ? 'bottom' : 'top');
			
			//add event listeners
			var self = this;
			var mouseDown = function(e){
				self._cl_resizing = true;
				self._cl_cachedWidth = self.width();
				self._cl_cachedHeight = self.height();
				self._cl_cachedX = self.x();
				self._cl_cachedY = self.y();
				self._cl_cachedMouseX = e.screenX();
				self._cl_cachedMouseY = e.screenY();
				
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.RESIZE_STARTED]));
				im.Utils.addEventListener(window, 'mousemove', mouseMove, false);
				im.Utils.addEventListener(window, 'mouseup', mouseUp, false);
				e.preventDefault();
			};
			
			var mouseUp = function(e){
				self._cl_resizing = false;
				im.Utils.removeEventListener(window, 'mousemove', mouseMove, false);
				im.Utils.removeEventListener(window, 'mouseup', mouseUp, false);
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.RESIZE_STOPPED]));
			}
			
			var mouseMove = function(e){
				if(!e) e = window.event;
				if(handle.handleDirection.match(/e|w/) !== null)
					self.width(self._cl_cachedWidth + (e.screenX - self._cl_cachedMouseX) * (handle.handleDirection.indexOf('w') !== -1 ? -1 : 1));
				if(handle.handleDirection.match(/n|s/) !== null)
					self.height(self._cl_cachedHeight + (e.screenY - self._cl_cachedMouseY) * (handle.handleDirection.indexOf('n') !== -1 ? -1 : 1));
				if(handle.handleDirection.indexOf('n') !== -1)
					self.y(self._cl_cachedY - (self._cl_cachedMouseY - e.screenY));
				if(handle.handleDirection.indexOf('w') !== -1)
					self.x(self._cl_cachedX - (self._cl_cachedMouseX - e.screenX));
				
				self.resized.call(self);
				if(self._cl_resizeEventsEnabled)
					self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.RESIZED]));
				return false;
			}
			
			handle.addEventListener(im.UIMouseEvent.MOUSE_DOWN, mouseDown);
		}
		
		/**
		 * Called each time the view is resized by dragging the mouse.
		 */
		proto.resized = function(){};
		
		proto._cl_validateDirection = function(dir){
			switch(dir){
				//TODO: make redraw more stable before enabling NW coordinates
				case 'n':
				case 'ne':
				case 'sw':
				case 'w':
				case 'nw':
				case 'e':
				case 'se':
				case 's':
					return true;
				default:
					return false;
			}
		}
		
		proto.resizeEventsEnabled = function(value){
			if(typeof value === 'boolean'){
				this._cl_resizeEventsEnabled = value;
				return this;
			}
			return this._cl_resizeEventsEnabled;
		}
		
		proto.Override.enabled = function(value){
			if(typeof value === 'boolean'){
				this._cl_enabled = value;
				for(var prop in this._cl_handles){
					this._cl_handles[prop].enabled(value);
				}
			}
			return this._cl_enabled;
		}
		
		proto.contentView = function(){
			return this._cl_contentView;
		}
		
		proto.Override.scrollXEnabled = function(value){
			if(this._cl_contentView)
				return this._cl_contentView.scrollXEnabled(value);
			else
				return proto.superclass().scrollXEnabled.call(this, value);
		}
		
		proto.Override.scrollYEnabled = function(value){
			if(this._cl_contentView)
				return this._cl_contentView.scrollYEnabled(value);
			else
				return proto.superclass().scrollYEnabled.call(this, value);
		}
		
		
		proto.Override.addSubView = function(){
			this._cl_contentView.addSubView.apply(this._cl_contentView, arguments);
		}
		
		proto.Override.addSubViewAtIndex = function(){
			this._cl_contentView.addSubViewAtIndex.apply(this._cl_contentView, arguments);
		}
		
		proto.Override.addSubViewBelow = function(){
			this._cl_contentView.addSubViewBelow.apply(this._cl_contentView, arguments);
		}
		
		proto.Override.addSubViewAbove = function(){
			this._cl_contentView.addSubViewAbove.apply(this._cl_contentView, arguments);
		}
});


/**
 * @class 
 * @name a5.cl.ui.UIAccordionView
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Extends('UIControl')
	.Static(function(UIAccordionView){
		UIAccordionView.HORIZONTAL = 0;
		UIAccordionView.VERTICAL = 1;
	})
	.Prototype('UIAccordionView', function(proto, im){
		proto.UIAccordionView = function(){
			proto.superclass(this);
			this._cl_direction = 1;
			this.relY(true);
			this._cl_handleSize = null;
			this._cl_singleSelection = false;
			this._cl_fillView = false;
			this._cl_panels = null;
			this._cl_expandedPanels = [];
			this._cl_expandDuration = 0;
			this._cl_collapseDuration = 0;
			
			var self = this;
			this.addEventListener(a5.cl.ui.events.UIEvent.SELECT, function(e){
				var targetPanel = e.target();
				if(targetPanel.isExpanded() && !self._cl_fillView)
					self.collapsePanel(targetPanel);
				else
					self.expandPanel(targetPanel);
			});
		}

		proto.Override.childrenReady = function(){
			this.build();
		}
		
		/**
		 * Builds (or re-builds) the accordion view.
		 */
		proto.build = function(){
			this._cl_panels = [];
			for(var x = 0, y = this.subViewCount(); x < y; x++){
				var thisView = this.subViewAtIndex(x);
				if(thisView._cl_initialized && thisView instanceof a5.cl.ui.UIAccordionPanel){
					thisView._cl_accordion = this;
					//add this view to the array of panels
					this._cl_panels.push(thisView);
				}
			}
			//expand the panels that were expanded before building
			this._cl_updatePanels();
		}
		
		proto._cl_updatePanels = function(){
			var x, y, thisPanel, prevPanel, size, shouldExpand, didExpand, didCollapse, targetSize, duration;
			for(x = 0, y = this._cl_panels.length; x < y; x++){
				thisPanel = this._cl_panels[x];
				prevPanel = x > 0 ? this._cl_panels[x - 1] : null
				//adjust for horizontal vs vertical
				size = this._cl_direction === im.UIAccordionView.HORIZONTAL ? a5.cl.CLViewContainer.prototype.width : a5.cl.CLViewContainer.prototype.height;
				//determine if this panel should be expanded or collapsed
				shouldExpand = a5.cl.core.Utils.arrayIndexOf(this._cl_expandedPanels, x) > -1 || !thisPanel.collapsible();
				didExpand = shouldExpand && !thisPanel.isExpanded();
				didCollapse = !shouldExpand && thisPanel.isExpanded();
				//size this panel accordingly
				if(this._cl_handleSize !== null)
					thisPanel.collapsedSize(this._cl_handleSize);
				targetSize = shouldExpand							//if this panel should be expanded... 
					? (this._cl_fillView							//and if we should be filling the view...
						? ((0 - this._cl_handleSize * (y - 1)) + '')//then calculate the size to fill the view
						: thisPanel.expandedSize())					//if not filling, set to the expandedSize
					: thisPanel.collapsedSize();					//else collapse to just the handle
				duration = (didExpand && this._cl_expandDuration > 0) ? this._cl_expandDuration : (didCollapse && this._cl_collapseDuration > 0 ? this._cl_collapseDuration : false);
				if(duration)
					thisPanel.animate(duration, {
						height: targetSize,
						redrawOnProgress: true
					});
				else
					size.call(thisPanel, targetSize);
				//alert the panel of its new state
				thisPanel._cl_expanded = shouldExpand;
				if(didExpand)
					thisPanel.expanded.call(thisPanel);
				else if(didCollapse)
					thisPanel.collapsed.call(thisPanel);
			}
		}
		
		/**
		 * Append a UIAccordionPanel.
		 * @param {a5.cl.ui.UIAccordionPanel} panel The panel to add.
		 */
		proto.addPanel = this.Attributes(
		["a5.Contract", {panel:'a5.cl.ui.UIAccordionPanel'}], 
		function(args){
			if(args){
				this.addSubView(args.panel);
				this.build();
			}
		})
		
		proto.addPanelAtIndex = this.Attributes(
		["a5.Contract", {panel:'a5.cl.ui.UIAccordionPanel', index:'number'}], 
		function(args){
			if(args){
				this.addSubViewAtIndex(args.panel, args.index);
				this.build();
			}
		})
		
		proto.removePanel = this.Attributes(
		["a5.Contract", {panel:'a5.cl.ui.UIAccordionPanel'}], 
		function(args){
			if(args){
				this.removeSubView(args.panel);
			}
		})
		
		proto.removePanelAtIndex = function(index){
			this.removeViewAtIndex(index);
		}
		
		proto.removeAllPanels = function(){
			this.removeAllSubViews();
		}
		
		/**
		 * 
		 * @param {Object} panel
		 */
		proto.expandPanel = function(panel){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				var thisPanel = this._cl_panels[x];
				if(thisPanel === panel){
					this.expandPanelAtIndex(x);
				}
			}
		}
		
		/**
		 * 
		 * @param {Object} panel
		 */
		proto.collapsePanel = function(panel){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				var thisPanel = this._cl_panels[x];
				if(thisPanel === panel){
					this.collapsePanelAtIndex(x);
				}
			}
		}
		
		/**
		 * 
		 * @param {Object} index
		 */
		proto.expandPanelAtIndex = function(index){
			if(this._cl_singleSelection){
				this._cl_expandedPanels = [index];
				this._cl_updatePanels();
				return this.getPanelAtIndex(index);
			} else if (a5.cl.core.Utils.arrayIndexOf(this._cl_expandedPanels, index) === -1) {
				this._cl_expandedPanels.push(index);
				this._cl_updatePanels();
				return this.getPanelAtIndex(index);
			}
			return null;
		}
		
		/**
		 * 
		 * @param {Object} index
		 */
		proto.collapsePanelAtIndex = function(index){
			var indexSquared = a5.cl.core.Utils.arrayIndexOf(this._cl_expandedPanels, index);
			if (indexSquared > -1){
				var collapsedPanel = this._cl_expandedPanels.splice(indexSquared, 1)[0];
				this._cl_updatePanels();
				return collapsedPanel;
			}
			return null;
		}
		
		/**
		 * Expands all of the panels in this accordion view.
		 */
		proto.expandAllPanels = function(){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				this.expandPanelAtIndex(x);
			}
		}
		
		/**
		 * Collapses all of the panels in this accordion view.
		 */
		proto.collapseAllPanels = function(){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				this.collapsePanelAtIndex(x);
			}
		}
		
		/**
		 * 
		 */
		proto.totalPanels = function(){
			return this._cl_panels.length;
		}
		
		proto.getPanelAtIndex = function(index){
			return this._cl_panels[index];
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.direction = function(value){
			if (value === im.UIAccordionView.HORIZONTAL || value === im.UIAccordionView.VERTICAL){
				this._cl_direction = value;
				this.relX(value === im.UIAccordionView.HORIZONTAL);
				this.relY(value === im.UIAccordionView.VERTICAL);
				this.build();
				return this;
			}
			return this._cl_direction;
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.handleSize = function(value){
			if (typeof value === 'number') {
				this._cl_handleSize = value;
				this.build();
				return this;
			}
			return this._cl_handleSize;
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.singleSelection = function(value){
			if (typeof value === 'boolean') {
		if(!this._cl_fillView) //only allow single selection to be modified if fillView is false (otherwise it must be true)
			this._cl_singleSelection = value;
				return this;
			}
			return this._cl_singleSelection;
		}

		/**
		 * 
		 * @param {Object} value
		 */
		proto.fillView = function(value){
			if (typeof value === 'boolean') {
				this._cl_fillView = value;
				if(value) this._cl_singleSelection = true;
				return this;
			}
			return this._cl_fillView;
		}
		
		proto.expandDuration = function(value){
			if(typeof value === 'number'){
				this._cl_expandDuration = value;
				return this;
			}
			return this._cl_expandDuration;
		}
		
		proto.collapseDuration = function(value){
			if(typeof value === 'number'){
				this._cl_collapseDuration = value;
				return this;
			}
			return this._cl_collapseDuration;
		}
		
		proto.Override.removeSubView = function(){
			proto.superclass().removeSubView.apply(this, arguments);
			this.build();
		}
	});



/**
 * @class 
 * @name a5.cl.ui.UIAccordionView
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Import('a5.cl.ui.events.*')
	.Extends('UIControl')
	.Prototype('UIAccordionPanel', function(proto, im){
		
		this.Properties(function(){
			this._cl_expanded = true;
			this._cl_expandedSize = 100;
			this._cl_collapsedSize = 30;
			this._cl_accordion = null;
			this._cl_collapsible = true;
		})
		
		proto.UIAccordionPanel = function(){
			proto.superclass(this);
			this.width('100%');
			this.initHandle();
		}
		
		proto.initHandle = function(){
			var self = this;
			this.clickEnabled(true);
			this.addEventListener(im.UIMouseEvent.CLICK, function(e){
				self.dispatchEvent(this.create(im.UIEvent, [im.UIEvent.SELECT]));
			});
		}
		
		proto.expanded = function(){
			
		}
		
		proto.collapsed = function(){
			
		}
		
		proto.isExpanded = function(){
			return this._cl_expanded;
		}
		
		proto.collapsible = function(value){
			if(typeof value === 'boolean'){
				this._cl_collapsible = value;
				return this;
			}
			return this._cl_collapsible;
		}
		
		proto.accordionView = function(){
			return this._cl_accordion;
		}
		
		proto.expandedSize = function(value){
			if (typeof value === 'number' || typeof value === 'string') {
				this._cl_expandedSize = value;
				return this;
			}
			return this._cl_expandedSize;
		}
		
		proto.collapsedSize = function(value){
			if (typeof value === 'number' || typeof value === 'string') {
				this._cl_collapsedSize = value;
				return this;
			}
			return this._cl_collapsedSize;
		}
		
		proto.location = function(){
			if(this._cl_accordion)
				return (this._cl_accordion.direction() === im.UIAccordionPanel.HORIZONTAL ? this.x() : this.y());
			else
				return 0;
		}
		
		
		proto.Override.width = function(value){
			if(typeof value !== 'number' || !this._cl_accordion || this._cl_accordion.direction() == a5.cl.ui.UIAccordionView.VERTICAL)
				return proto.superclass().width.call(this, value);
			else
				this._cl_expandedSize = value;
		}
		
		proto.Override.height = function(value){
			if(typeof value !== 'number' || !this._cl_accordion || this._cl_accordion.direction() == a5.cl.ui.UIAccordionView.HORIZONTAL)
				return proto.superclass().height.call(this, value);
			else
				this._cl_expandedSize = value;
		}
});


/**
 * @class A view that can only be added to UIContainer.  It will fill up any empty space not occupied by a non-UIFlexSpace view.  If multiple UIFlexSpaces are added to a UIControl, the remaining space will be divided evenly among them.
 * @name a5.cl.ui.UIFlexSpace
 * @description If the UIContainer is relX, the width of this view will be adjusted to fill any remaining space.  Likewise for height if the UIContainer is relY.  Whichever dimension is not relative will always be 100%.
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Extends('UIControl')
	.Prototype('UIFlexSpace', function(proto, im){
		
		/**#@+
	 	 * @memberOf a5.cl.ui.UIFlexSpace#
	 	 * @function
		 */
		
		proto.UIFlexSpace = function(){
			proto.superclass(this);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			
			proto.superclass().width.call(this, '100%');
			proto.superclass().height.call(this, '100%');
		}
		
		proto.Override.addedToParent = function(parentView){
			if(parentView instanceof a5.cl.ui.UIContainer)
				proto.superclass().addedToParent.apply(this, arguments);
			else
				this.redirect(500, 'Error: UIFlexSpace can only be added to a UIContainer view.');
		}
		
		/**
		 * The width of a UIFlexSpace cannot be set.  If its UIContainer is relX, the width will be calculated on the fly, otherwise it will always be 100%.
		 * @name width 
		 */
		proto.Override.width = function(value){
			if(value === undefined || value === 'scroll' || value === 'inner' || value === 'client' || value === 'value')
				return proto.superclass().width.apply(this, arguments);
			else
				return this;
		}
		
		/**
		 * The height of a UIFlexSpace cannot be set.  If its UIContainer is relY, the height will be calculated on the fly, otherwise it will always be 100%.
		 * @name height 
		 */
		proto.Override.height = function(value){
			if(value === undefined || value === 'scroll' || value === 'inner' || value === 'client' || value === 'value')
				return proto.superclass().height.apply(this, arguments);
			else
				return this;
		}
	});


/**
 * @class Container for UIControls.  Allows for flexible spaces.  Either relX or relY must be true, so setting one will automatically toggle the other.
 * @name a5.cl.ui.UIContainer
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui')
	.Import('a5.cl.CLViewContainer')
	.Extends('UIControl')
	.Prototype('UIContainer', function(proto, im){
		
		proto.UIContainer = function(){
			proto.superclass(this);
			this.relX(true);
			this.constrainChildren(false);
		}
		
		proto.Override.constrainChildren = function(){}
		
		proto.Override.relX = function(value){
			if(typeof value === 'boolean')
				proto.superclass().relY.call(this, !value);
			return proto.superclass().relX.call(this, value);
		}
		
		proto.Override.relY = function(value){
			if(typeof value === 'boolean')
				proto.superclass().relX.call(this, !value);
			return proto.superclass().relY.call(this, value);
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var returnVals = proto.superclass()._cl_redraw.call(this, force, true);
			if(returnVals.shouldRedraw){
				//if there are any UFlexSpaces, adjust their size
				var flexSpaces = [],
					relDimension = this._cl_relX ? 'width' : 'height',
					freeSpace = this['_cl_' + relDimension].inner,
					flexSize, x, y;
				//determine the amount of free space
				for(x = 0, y = this.subViewCount(); x < y; x++){
					var thisView = this.subViewAtIndex(x);
					if (thisView instanceof im.UIFlexSpace)
						flexSpaces.push(thisView)
					else
						freeSpace -= thisView['_cl_' + relDimension].offset;
					freeSpace -= thisView[this._cl_relX ? 'x' : 'y']();
				}
				if(flexSpaces.length > 0) {
					//set the sizes of the flex spaces
					flexSize = freeSpace > 0 ? (freeSpace / flexSpaces.length) : 0;
					for (x = 0, y = flexSpaces.length; x < y; x++) {
						im.CLViewContainer.prototype[relDimension].call(flexSpaces[x], flexSize);
						im.CLViewContainer.prototype[relDimension === 'width' ? 'height' : 'width'].call(flexSpaces[x], '100%');
					}
					//redraw again
					proto.superclass()._cl_redraw.call(this, true, suppressRender);
				} else if(suppressRender !== true) {
					this._cl_render();
				}
			}
			return returnVals;
		}
	});


a5.Package('a5.cl.ui')
	.Import('a5.cl.*', 
			'a5.cl.ui.interfaces.ITabView')
	.Extends('UIControl')
	.Implements('ITabView')
	.Prototype('UIDefaultTabView', function(proto, im){
		
		proto.UIDefaultTabView = function(){
			proto.superclass(this);
			this._cl_staticWidth = false;
			this._cl_backgroundView = this.create(im.CLView);
			this._cl_backgroundView.border(1, 'solid', '#c8c6c4').backgroundColor('#e6e4e3');
			this._cl_labelView = this.create(im.UITextField);
			this._cl_labelView.alignY('middle');
			this._cl_labelView.textAlign('center');
			
			this.usePointer(true);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.addSubView(this._cl_backgroundView);
			this.addSubView(this._cl_labelView);
		}
		
		proto.label = function(value){
			if(typeof value === 'string'){
				this._cl_labelView.text(value);
				return this;
			}
			return this._cl_labelView.text();
		}
		
		proto.activated = function(){
			this._cl_backgroundView.alpha(1);
		}
		
		proto.deactivated = function(){
			this._cl_backgroundView.alpha(0.5);
		}
		
		proto.staticWidth = function(value){
			if(typeof value !== 'undefined'){
				this._cl_staticWidth = value;
				return this;
			}
			return this._cl_staticWidth;
		}
		
		proto.Override.clickEnabled = function(){
			proto.superclass().clickEnabled.apply(this, arguments);
		}
		
	});



/**
 * @class 
 * @name a5.cl.ui.UISplitViewController
 * @extends a5.cl.ui.UIController
 */
a5.Package('a5.cl.ui.controllers')

	.Import('a5.cl.ui.*')
	
	.Extends('UIController')
	.Prototype('UISplitViewController', function(proto, im){
		
		proto.UISplitViewController = function(){
			this._cl_menuView;
			this._cl_contentView;
			this._cl_menuView = this.create(im.UIResizable);
			this._cl_menuView.height('100%');
			this._cl_contentView = this.create(a5.cl.CLViewContainer);
			this._cl_menuView.width(300).minWidth(150).maxWidth(500).border(1);
			this._cl_contentView.border(1);
			proto.superclass(this, arguments);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.view().relX(true);
			this.view().constrainChildren(true);
			this.view().addSubView(this._cl_menuView);
			this.view().addSubView(this._cl_contentView);
			
			var self = this;
			
			//check for a menuView or contentView added via ViewDef
			var menuView = this.view().getChildView('menuView'),
				contentView = this.view().getChildView('contentView');
			//if either was found, move them into the proper parent view
			if(menuView)
				this._cl_menuView.addSubView(menuView);
			if(contentView)
				this._cl_contentView.addSubView(contentView);
			//remove all other extraneous child views
			var viewsToRemove = [];
			for(var x = 0, y = this.view().subViewCount(); x < y; x++){
				var thisView = this.view().subViewAtIndex(x);
				if(thisView !== this._cl_contentView && thisView !== this._cl_menuView)
					viewsToRemove.push(thisView);
			}
			for(x = 0, y = viewsToRemove.length; x < y; x++){
				this.view().removeSubView(viewsToRemove[x]);
			}
			viewsToRemove = null;
		}
		
		proto.contentView = function(){
			return this._cl_contentView;
		}
		
		proto.menuView = function(){
			return this._cl_menuView;
		}
});



/**
 * @class 
 * @name a5.cl.ui.UITabViewController
 * @extends a5.cl.ui.UIController
 */
a5.Package('a5.cl.ui.controllers')
	.Import('a5.cl.ui.*',
			'a5.cl.ui.events.UIMouseEvent',
			'a5.cl.*')
	.Extends('UIController')
	.Static(function(UITabViewController){
		UITabViewController.customViewDefNodes = ['Tab'];
	})
	.Prototype('UITabViewController', function(proto, im){
		
		this.Properties(function(){
			this._cl_tabBarView = null;
			this._cl_tabBarBG = null;
			this._cl_tabBarWrapper = null;
			this._cl_contentView = null;
			this._cl_tabs = [];
			this._cl_tabViewClass = im.UIDefaultTabView;
			this._cl_activeTab = -1;
			this._cl_tabBarLocation = 'top';
			this._cl_pendingTabs = 0;
		})
		
		proto.UITabViewController = function(def){
			this._cl_tabBarView = this.create(im.CLViewContainer);
			this._cl_tabBarBG = this.create(im.CLViewContainer);
			this._cl_tabBarWrapper = this.create(im.CLViewContainer);
			this._cl_contentView = this.create(a5.cl.ui.UIFlexSpace);
			
			this._cl_tabBarWrapper.height(25);
			this._cl_tabBarView.relX(true);
			this._cl_contentView.height('-25');
			proto.superclass(this, [def || this.create(a5.cl.ui.UIContainer)]);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.view().relY(true);
			this._cl_tabBarWrapper.addSubView(this._cl_tabBarBG);
			this._cl_tabBarWrapper.addSubView(this._cl_tabBarView);
			this.view().addSubView(this._cl_tabBarWrapper);
			this.view().addSubView(this._cl_contentView);
			this._cl_viewReady();
			/*
			var self = this;
			this.view().childrenReady = function(initial){
				//Check for views that were added by a view definition, and create tabs for them
				var viewsToMove = [];
				for(var x = 0, y = this.subViewCount(); x < y; x++){
					var thisView = this.subViewAtIndex(x);
					if (thisView !== self._cl_tabBarWrapper && thisView !== self._cl_contentView) {
						viewsToMove.push(thisView);
					}
				}
				for(var x = 0, y = viewsToMove.length; x < y; x++){
					self.addTab(viewsToMove[x]);
				}
				
				self.tabsReady(initial);
			}
			
			//override removeSubView on contentView to allow the ViewDefParser to manipulate the tabs
			this._cl_contentView.removeSubView = function(view){
				self.removeTab(view);
			}
			*/
		}
		
		proto.Override._cl_viewReady = function(){
			//TODO: This may not be the most reliable way to listen for the tabs to be added.  This should be extensively tested.
			if(this._cl_viewReadyPending)
				proto.superclass()._cl_viewReady.call(this);
			else if(this._cl_pendingTabs <= 0 && this._cl_view._cl_pendingChildren <= 0)
				this.tabsReady();
		}
		
		proto.tabsReady = function(){
			
		}
		
		proto._cl_eTabClickHandler = function(e){
			for(var x = 0, y = this._cl_tabs.length; x < y; x++){
				var thisTab = this._cl_tabs[x];
				if(thisTab.tabView === e.target())
					return this.activateTabAtIndex(x);
			}
		}
		
		/**
		 * Appends a tab.
		 * 
		 * @param {a5.cl.CLView} contentView The view to display when this tab is activated.
		 * @param {String} [tabLabel] The label for this tab. Defaults to the 'tabLabel' property on the contentView, or the string "Tab #", where # is the current number of tabs.
		 * @param {a5.cl.ui.interfaces.ITabView} [tabView] A view instance to use as the tab. (must implement ITabView). Defaults to a new instance of of this.tabViewClass().
		 */
		proto.addTab = function(contentView, tabLabel, tabView){
			this.addTabAtIndex(contentView, this.tabCount(), tabLabel, tabView);
		}
		
		/**
		 * Appends a tab at the specified index.
		 * 
		 * @param {a5.cl.CLView} contentView contentView The view to display when this tab is activated.
		 * @param {Number} index The index at which to place this tab.
		 * @param {String} [tabLabel] The label for this tab. Defaults to the 'tabLabel' property on the contentView, or the string "Tab #", where # is the current number of tabs.
		 * @param {a5.cl.ui.interfaces.ITabView} [tabView] A view instance to use as the tab. (must implement ITabView). Defaults to a new instance of of this.tabViewClass().
		 */
		proto.addTabAtIndex = this.Attributes(
		["a5.Contract", { contentView:'a5.cl.CLView', index:'number', tabLabel:'string=""', tabView:'a5.cl.ui.interfaces.ITabView=null'}], 
		function(args){	
			if(args){
				//create or get the tab
				var newTab = args.tabView || this.create(this._cl_tabViewClass);
				//keep a reference to the views
				this._cl_tabs.splice(args.index, 0, {
					tabView: newTab,
					contentView: args.contentView
				});
				//set up the tab
				newTab.label(args.tabLabel || (typeof args.contentView.tabLabel === 'string' ? args.contentView.tabLabel : ('Tab ' + this._cl_tabs.length)));
				if (newTab.staticWidth()) {
					newTab.width(newTab.staticWidth());
				} else {
					//divide the tabs evenly across the width of the tabBarView
					for(var x = 0, y = this._cl_tabs.length; x < y; x++){
						var thisTab = this._cl_tabs[x].tabView;
						thisTab.width((100 / this._cl_tabs.length) + '%');
					}
				}
				newTab.deactivated();
				newTab.clickEnabled(true);
				newTab.usePointer(true);
				newTab.addEventListener(im.UIMouseEvent.CLICK, this._cl_eTabClickHandler, false, this);
				this._cl_tabBarView.addSubViewAtIndex(newTab, args.index);
				//add the content view
				args.contentView.visible(false);
				this._cl_contentView.addSubViewAtIndex(args.contentView, args.index);
				//if no tab is active, activate this one
				if(this._cl_activeTab === -1)
					this.activateTabAtIndex(0);
			}
		})
		
		/**
		 * Removes the tab with the specified view as its content.
		 * 
		 * @param {a5.cl.CLView} contentView The content view of the tab to remove.
		 */
		proto.removeTab = function(contentView){
			for(var x = 0, y = this._cl_tabs.length; x < y; x++){
				var thisTab = this._cl_tabs[x];
				if(thisTab.contentView === contentView)
					return this.removeTabAtIndex(x);
			}
			return null;
		}
		
		/**
		 * Removes the tab at the specified index
		 * 
		 * @param {Number} index The index of the tab to remove.
		 * @param {Boolean} destroy Whether the views should be destroyed once they're removed. Defaults to true.
		 * @return {Object} Returns an object with a tabView property, and a contentView property.
		 */
		proto.removeTabAtIndex = function(index, destroy){
			if(this._cl_activeTab === index)
				this._cl_activeTab = -1;
			var dyingTab = this._cl_tabs.splice(index, 1)[0];
			dyingTab.tabView.removeEventListener(im.UIMouseEvent.CLICK, this._cl_eTabClickHandler);
			this._cl_contentView.removeSubView(dyingTab.contentView, destroy !== false);
			this._cl_tabBarView.removeSubView(dyingTab.tabView, destroy !== false);
			return destroy === false ? dyingTab : null;
		}
		
		/**
		 * Activate the tab with the specified content view.
		 * 
		 * @param {a5.cl.CLView} contentView The content view of the tab to activate.
		 * @return {a5.cl.CLView} Returns the contentView of the tab that is active after executing this method. If this doesn't match the view that was passed in, then no corresponding tab was found for that view.
		 */
		proto.activateTab = function(contentView){
			for(var x = 0, y = this._cl_tabs.length; x < y; x++){
				var thisTab = this._cl_tabs[x];
				if(thisTab.contentView === contentView)
					return this.activateTabAtIndex(x);
			}
		}
		
		/**
		 * Activate the tab at the specified index.
		 * 
		 * @param {Number} index The index of the tab to activate.
		 * @return {a5.cl.CLView} Returns the contentView of the tab that was selected, or null if an invalid index was specified.
		 */
		proto.activateTabAtIndex = function(index){
			if(index < 0 || index >= this._cl_tabs.length) return null;
			
			for(var x = 0, y = this._cl_tabs.length; x < y; x++){
				var thisTab = this._cl_tabs[x];
				var isActive = x === index;
				thisTab.contentView.visible(isActive);
				thisTab.contentView.suspendRedraws(!isActive);
				if (isActive) {
					thisTab.tabView.activated();
					this._cl_activeTab = x;
				} else {
					thisTab.tabView.deactivated();
				}
			}
			this.view().redraw();
			return this._cl_tabs[this._cl_activeTab].contentView;
		}
		
		/**
		 * Gets a reference to the tab at the specified index.
		 * 
		 * @param {Number} index The index of the tab to retrieve.
		 * @param {Boolean=false} [getTabView] If true, the tabView and the contentView are returned.  Otherwise, just the contentView is returned.
		 * @return {a5.cl.CLView|Object} If getTabView is true, an object with contentView and tabView properties is returned, otherwise the contentView instance is returned.
		 */
		proto.getTabAtIndex = function(index, getTabView){
			if(index < 0 || index >= this._cl_tabs.length) return null;
			return getTabView === true ? this._cl_tabs[index].tabView : this._cl_tabs[index].contentView;
		}
		
		proto.getTabByLabel = function(label, getTabView){
			for(var x = 0, y = this._cl_tabs.length; x < y; x++){
				var thisTab = this._cl_tabs[x];
				if(thisTab.tabView.label() === label)
					return getTabView === true ? thisTab.tabView : thisTab.contentView;
			}
			return null;
		}
		
		/**
		 * The location of the tab bar.  Acceptable values are 'top' and 'bottom'. The default is 'top'.
		 * 
		 * @param {String} [value] Where to place the tab bar ('top' or 'bottom').
		 * @return {String|a5.cl.ui.controllers.UITabViewController} Returns the current value of tabBarLocation if no value is specified.  Otherwise, returns this instance to allow chaining.
		 */
		proto.tabBarLocation = function(value){
			if(typeof value === 'string'){
				if((value === 'top' || value === 'bottom') && value !== this._cl_tabBarLocation){
					if(value === 'bottom')
						this._cl_tabBarWrapper.toTop();
					else
						this._cl_tabBarWrapper.toBottom();
				}
				return this;
			}
			return this._cl_tabBarLocation;
		}
		
		/**
		 * The height of the tab bar.
		 * 
		 * @param {Number|String} [value] The value to set the height of the tab bar to.
		 */
		proto.tabBarHeight = function(value){
			if(typeof value === 'number' || typeof value === 'string'){
				this._cl_tabBarWrapper.height(value);
				return this;
			}
			return this._cl_tabBarWrapper.height();
		}
		
		/**
		 * Returns the contentView of the currently active tab, or null if no tab is currently active.
		 */
		proto.activeContentView = function(){
			return this._cl_activeTab >= 0 ? this._cl_tabs[this._cl_activeTab].contentView : null;
		}
		
		/**
		 * Returns the total number of tabs.
		 */
		proto.tabCount = function(){
			return this._cl_tabs.length;
		}
		
		/**
		 * Returns the view which holds the content views.
		 */
		proto.contentView = function(){
			return this._cl_contentView;
		}
		
		/**
		 * Returns the view which holds the tab views.
		 */
		proto.tabBar = function(){
			return this._cl_tabBarWrapper;
		}
		
		proto.tabBarBG = function(){
			return this._cl_tabBarBG;
		}
		
		/**
		 * The class to use when creating new tab views.  This class must implement ITabView.  The default is UIDefaultTabView.
		 * @param {function} [value] The class to use when creating new tab views.
		 */
		proto.tabViewClass = function(value){
			if(typeof value === 'function'){
				this._cl_tabViewClass = value;
				return this;
			}
			return this._cl_tabViewClass;
		}
		
		/**
		 * Shortcut to this.contentView().scrollXEnabled().
		 */
		proto.scrollXEnabled = function(){
			this._cl_contentView.scrollXEnabled.apply(this._cl_contentView, arguments);
		}
		
		/**
		 * Shortcut to this.contentView().scrollYEnabled().
		 */
		proto.scrollYEnabled = function(){
			this._cl_contentView.scrollYEnabled.apply(this._cl_contentView, arguments);
		}
		
		/**
		 * @private
		 */
		proto.Override.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			if(nodeName === 'Tab'){
				var children = a5.cl.mvc.core.XMLUtils.children(node.node);
				if(children.length > 0) {
					var builder = this.create(a5.cl.core.viewDef.ViewBuilder, [this, children[0], defaults, imports, rootView]),
						targetIndex = this.tabCount();
					this._cl_pendingTabs++;
					builder.build(function(view){
						this.addTabAtIndex(view, targetIndex, node.label);
						this._cl_pendingTabs--;
					}, null, this);
				}
			} else
				proto.superclass().processCustomViewDefNode.apply(this, arguments);
		}
});



a5.Package('a5.cl.ui.form')
	.Static('UIValidationStates', function(UIValidationStates){
		
		UIValidationStates.TOO_LONG = "Value exceeds the maximum length.";
		UIValidationStates.TOO_SHORT = "Value does not meet the minimum length requirement.";
		UIValidationStates.PATTERN_MISMATCH = "Value does not match the specified pattern.";
		UIValidationStates.REQUIRED = "This field is required.";
});



a5.Package('a5.cl.ui.form')
	.Import('a5.cl.ui.events.UIEvent',
			'a5.cl.ui.mixins.UIGroupable',
			'a5.cl.core.Utils')
	.Extends('a5.EventDispatcher')
	.Prototype('UIOptionGroup', function(proto, im, UIOptionGroup){
		
		UIOptionGroup._ui_instanceRef = [];
		
		UIOptionGroup._ui_addRef = function(inst){
			UIOptionGroup._ui_instanceRef.push(inst);
		}
		
		UIOptionGroup._ui_removeRef = function(inst){
			for(var i = 0, i = UIOptionGroup._ui_instanceRef.length; i<l; i++){
				if(UIOptionGroup._ui_instanceRef[i] === inst){
					UIOptionGroup._ui_instanceRef.splice(i, 1);
					return;
				}
			}
		}
		
		UIOptionGroup.getGroupByName = function(groupName){
			for(var x = 0, y = UIOptionGroup._ui_instanceRef.length; x < y; x++){
				var thisRef = UIOptionGroup._ui_instanceRef[x];
				if(thisRef.groupName() === groupName)
					return thisRef;
			}
			return a5.Create(UIOptionGroup, [groupName]);
		}
		
		this.Properties(function(){
			this._cl_groupName = null;
			this._cl_name = null;
			this._cl_options = [];
			this._cl_selectedOption = null;
			this._cl_required = false;
			this._cl_allowMultiple = false;
		});
		
		proto.UIOptionGroup = function($groupName){
			proto.superclass(this);
			UIOptionGroup._ui_addRef(this);
			this._cl_groupName = $groupName || this.instanceUID();
		}
		
		proto.allowMultiple = function(value){
			if(typeof value === 'boolean'){
				this._cl_allowMultiple = value;
				if(value)
					this._cl_selectedOption = this._cl_selectedOption ? [this._cl_selectedOption] : [];
				else
					this._cl_selectedOption = this._cl_selectedOption.length > 0 ? this._cl_selectedOption[0] : null;
				return this;
			}
			return this._cl_allowMultiple;
		}
		
		proto.groupName = function(){
			return this._cl_groupName;
		}
		
		proto.addOption = function(option){
			var wasAdded = this._cl_addOption(option);
			if(wasAdded)
				option.optionGroup(this);
		}
		
		proto._cl_addOption = function(option){
			if(!this.hasOption(option)){
				this._cl_options.push(option);
				option.addEventListener(im.UIEvent.CHANGE, this._cl_eOptionChangedHandler, false, this);
				if(option.selected())
					this._cl_selectOption(option);
				return true;
			}
			return false;
		}
		
		proto.removeOption = function(option){
			var wasRemoved = this._cl_removeOption(option);
			if(wasRemoved)
				option.optionGroup(null);
		}
		
		proto._cl_removeOption = function(option){
			var optionIndex = a5.cl.core.Utils.arrayIndexOf(this._cl_options, option);
			if (optionIndex > -1) {
				var removed = this._cl_options.splice(optionIndex, 1);
				removed[0].removeEventListener(im.UIEvent.CHANGE, this._cl_eOptionChangedHandler);
				return true;
			}
			return false;
		}
		
		proto.hasOption = function(option){
			for(var x = 0, y = this._cl_options.length; x < y; x++){
				if(this._cl_options[x] === option)
					return true;
			}
			return false;
		}
		
		proto.selectedOption = function(value){
			if(value !== undefined){
				if(this.hasOption(value) || value === null || value === false)
					this._cl_selectOption(value);
				return this;
			}
			return this._cl_selectedOption;
		}
		
		proto.optionAtIndex = function(index){
			if(typeof index === 'number')
				return this._cl_options[index];
			return null;
		}
		
		proto.optionCount = function(){
			return this._cl_options.length;
		}
		
		proto.name = function(value){
			if(typeof value === 'string'){
				this._cl_name = value;
				return this;
			}
			return this._cl_name || this._cl_groupName;
		}
		
		proto.value = function(){
			var selOpt = this.selectedOption();
			if(this._cl_allowMultiple){
				var values = [],
					x, y, thisOption, thisValue;
				for(x = 0, y = selOpt.length; x < y; x++){
					thisOption = selOpt[x];
					thisValue = thisOption.value();
					values.push(thisValue === undefined || thisValue === null ? thisOption.name() : thisValue);
				}
				return values;
			}
			return selOpt ? (selOpt.value() || selOpt.name()) : null;
		}
		
		proto.required = function(value){
			if(typeof value === 'boolean'){
				this._cl_required = value;
				return this;
			}
			return this._cl_required;
		}
		
		proto._cl_eOptionChangedHandler = function(e){
			var target = e.target();
			if (target.doesMix(im.UIGroupable)) {
				if(target.selected())
					target.optionGroup()._cl_selectOption(target);
				else if(this._cl_allowMultiple)
					target.optionGroup()._cl_deselectOption(target);
			}
		}
		
		proto._cl_selectOption = function(option){
			if (this._cl_allowMultiple) {
				if (!im.Utils.arrayContains(this._cl_selectedOption, option)) {
					this._cl_selectedOption.push(option);
					this.dispatchEvent(this.create(im.UIEvent, [im.UIEvent.CHANGE]));
				}
			} else {
				var prevSelection = this._cl_selectedOption;
				this._cl_selectedOption = null;
				for (var x = 0, y = this._cl_options.length; x < y; x++) {
					var thisOption = this._cl_options[x], selected = thisOption === option
					if (selected) 
						this._cl_selectedOption = thisOption;
					thisOption.selected(selected);
				}
				if (this._cl_selectedOption !== prevSelection) 
					this.dispatchEvent(this.create(im.UIEvent, [im.UIEvent.CHANGE]));
			}
		}
		
		proto._cl_deselectOption = function(option){
			if(this._cl_allowMultiple){
				var idx = im.Utils.arrayIndexOf(this._cl_selectedOption, option);
				if(idx >= 0){
					this._cl_selectedOption.splice(idx, 1);
					this.dispatchEvent(this.create(im.UIEvent, [im.UIEvent.CHANGE]));
				}
			}
		}
		
		proto.dealloc = function(){
			UIOptionGroup._ui_removeRef(this);
		}
		
});


/**
 * @class Base class for all form elements.
 * @name a5.cl.ui.form.UIFormElement
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui.form')
	.Import('a5.cl.ui.UIHTMLControl',
			'a5.cl.ui.UITextField',
			'a5.cl.core.Utils',
			'a5.cl.ui.events.UIEvent')
	.Extends('a5.cl.ui.UIControl')
	.Prototype('UIFormElement', 'abstract', function(proto, im, UIFormElement){
		
		UIFormElement.customViewDefNodes = ['Label', 'Input'];
			
		this.Properties(function(){
			this._cl_element = null;
			this._cl_inputView = this.create(im.UIHTMLControl).height('auto').width('100%').clickHandlingEnabled(false);
			this._cl_labelView = this.create(im.UITextField);
			this._cl_labelViewAdded = false;
			this._cl_required = false;
			this._cl_validation = null;
			this._cl_validateOnChange = false;
			this._cl_validateOnBlur = false;
			this._cl_value = null;
			this._cl_form = null;
			this._cl_changeEvent = this.create(im.UIEvent, [im.UIEvent.CHANGE]).shouldRetain(true);
			this._cl_validationStates = [];
			this._cl_errorColor = null;
			this._cl_defaultColor = null;
		});
		
		proto.UIFormElement = function(){
			proto.superclass(this);
			this.width('100%');
			this.addSubView(this._cl_inputView);
			this.addEventListener(im.UIEvent.CHANGE, this._cl_eChangeEventHandler, false, this);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			this._cl_labelView.isLabelFor(this);
		}
		
		proto.name = function(value){
			if(typeof value === 'string'){
				this._cl_name = value;
				return this;
			}
			return this._cl_name || this.id().replace(/[^a-z0-9_]/gi, '');
		}
		
		proto.value = function(value){
			if(value !== undefined){
				this._cl_value = value;
				return this;
			}
			return this._cl_value;
		}
		
		proto.reset = function(){
			this.value("");
			this.validityChanged(true);
		}
		
		proto.form = function(){
			return this._cl_form;
		}
		
		/**
		 * Gets or sets the validation method, or RegExp to use when validating this field.
		 * @name validation
		 * @param value {String|RegExp|Function} The validation method, or RegExp which determines if the field has valid data.
		 */
		proto.validation = function(value){
			if(typeof value === 'string')
				value = new RegExp(value);
			if(value instanceof RegExp || typeof value === 'function'){
				this._cl_validation = value;
				return this;
			}
			return this._cl_validation;
		}
		
		proto.validateOnChange = function(value){
			if(typeof value === 'boolean'){
				this._cl_validateOnChange = value;
				return this;
			}
			return this._cl_validateOnChange;
		}
		
		proto.validateOnBlur = function(value){
			if(typeof value === 'boolean'){
				this._cl_validateOnBlur = value;
				return this;
			}
			return this._cl_validateOnBlur;
		}
		
		proto.required = function(value){
			if(typeof value === 'boolean'){
				this._cl_required = value;
				return this;
			}
			return this._cl_required;
		}
		
		proto.validate = function(){
			this._cl_validationStates = [];
			var isValid = true;
			if(this.required())
				isValid = this._cl_validateRequired();
			if(isValid && (this.required() || !this.required() && this.value()))
				isValid = this._cl_validate();
			this.validityChanged(isValid);
			return isValid;
		}
		
		proto._cl_validate = function(){
			var isValid = true;
			if(this._cl_validation instanceof RegExp)
				isValid = this._cl_validation.test(this.value());
			else if(typeof this._cl_validation === 'function')
				isValid = this._cl_validation.call(this, this.value());
			if(!isValid)
				this.addValidationState(im.UIValidationStates.PATTERN_MISMATCH);
			return isValid;
		}
		
		proto._cl_validateRequired = function(){
			return true;
		}
		
		proto.validityChanged = function(isValid){
			if(this._cl_labelView)
				this._cl_labelView.textColor(isValid ? '#000' : '#f00');
		}
		
		proto.validationStates = function(){
			return this._cl_validationStates.slice(0);
		}
		
		proto.addValidationState = function(state){
			this._cl_validationStates.push(state);
		}
		
		proto._cl_eChangeEventHandler = function(e){
			if(this._cl_validateOnChange)
				this.validate();
		}
		
		proto._cl_addFocusEvents = function(elem){
			var self = this;
			im.Utils.addEventListener(elem, 'focus', function(e){
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.FOCUS, e]));
			});
			im.Utils.addEventListener(elem, 'blur', function(e){
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.BLUR, e]));
				if(self._cl_validateOnBlur)
					self.validate();
			});
		}
		
		/**
		 * Sets the label for this form element.  Can either be a string, in which case a new UITextField is created and placed within this form element.  Or a UITextField, in which case the isLabelFor() method will be called, passing this form element.
		 * 
		 * @param {a5.cl.ui.UITextField|String} value Either a string to be shown as the label, or a UITextField element that should act as the label for this form element.
		 * @param {Boolean} [labelAfterInput=false] If true, the label will be added after the input, so it will appear to the right or below the input when relX or relY is set to true.  By default, the label will be added before the input.
		 * @return {String} The text value of the UITextField acting as the label for this form element.  Or null if none was specified.
		 */
		proto.label = function(value, labelAfterInput, nonBreaking){
			if (typeof value !== 'undefined') {
				if (typeof value === 'string') {
					//if a string was passed, and the label hasn't been added, do so now
					if (!this._cl_labelViewAdded) {
						if (labelAfterInput === true) 
							this.addSubView(this._cl_labelView);
						else
							this.addSubViewBelow(this._cl_labelView, this._cl_inputView);
					}
					//update the text
					this._cl_labelView.nonBreaking(nonBreaking !== false).text(value);
				} else if (value instanceof im.UITextField) {
					//if a UITextField was passed, make it a label for this item
					this._cl_labelView = value
						.isLabelFor(this)
						.nonBreaking(nonBreaking !== false);
				}
				this._cl_labelViewAdded = true;
				return this;
			}
			return this._cl_labelView ? this._cl_labelView.text() : '';
		}
		
		/**
		 * @return {a5.cl.CLViewContainer} The CLViewContainer which contains the actual form element.  The form element is nested within this view so that a label can be grouped with it.
		 */
		proto.inputView = function(){ return this._cl_inputView; }
		
		/**
		 * @return {a5.cl.ui.UITextField} The UIInputField which is acting as the label for this form element (if there is one).
		 */
		proto.labelView = function(){ return this._cl_labelView; }
		
		proto.element = function(){
			return this._cl_element;
		}
		
		
		
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.inputViewWidth = function(value){
			if(typeof value !== 'undefined'){
				this._cl_inputView.width(value);
				return this;
			}
			return this._cl_inputView.width();
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.inputViewHeight = function(value){
			if(typeof value !== 'undefined'){
				this._cl_inputView.height(value);
				return this;
			}
			return this._cl_inputView.height();
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.labelViewWidth = function(value){
			if(typeof value !== 'undefined'){
				this._cl_labelViewWidth = value;
				if(this._cl_labelView)
					this._cl_labelView.width(value);
				return this;
			}
			return this._cl_labelView ? this._cl_labelView.width() : this._cl_labelViewWidth;
		}
		
		/**
		 * 
		 * @param {Object} value
		 */
		proto.labelViewHeight = function(value){
			if(typeof value !== 'undefined'){
				this._cl_labelViewHeight = value;
				if(this._cl_labelView)
					this._cl_labelView.height(value);
				return this;
			}
			return this._cl_labelView ? this._cl_labelView.height() : this._cl_labelViewHeight;
		}
		
		proto.labelTextColor = function(value){
			return this._cl_labelView.textColor(value);
		}
		
		proto.labelTextAlign = function(value){
			return this._cl_labelView.textAlign(value);
		}
		
		proto.labelTextDecoration = function(value){
			return this._cl_labelView.textDecoration(value);
		}
		
		proto.labelFontSize = function(value){
			return this._cl_labelView.fontSize(value);
		}
		
		proto.labelFontWeight = function(value){
			return this._cl_labelView.fontWeight(value);
		}
		
		proto.labelFontStyle = function(value){
			return this._cl_labelView.fontStyle(value);
		}
		
		proto.labelBold = function(value){
			return this._cl_labelView.bold(value);
		}
		
		proto.labelItalic = function(value){
			return this._cl_labelView.italic(value);
		}
		
		proto.labelUnderline = function(value){
			return this._cl_labelView.underline(value);
		}
		
		
		proto.focus = function(){
			this.element().focus();
		}
		
		proto.blur = function(){
			this.element().blur();
		}
		
		/*proto.width = function(value){
			var returnVal = proto.superclass().width.call(this, value);
			if(value === 'scroll' || value === 'content'){
				var inputWidth = this._cl_inputView.width(this._cl_inputView._cl_width.auto ? 'scroll' : undefined) + this._cl_inputView.x(true),
					labelWidth = this._cl_labelView ? (this._cl_labelView.width(this._cl_labelView._cl_width.auto ? 'scroll' : undefined) + this._cl_labelView.x(true)) : 0;
				return Math.max(inputWidth, labelWidth) + this._cl_calculatedOffset.width + this._cl_calculatedClientOffset.width;
			}
			return returnVal;
		}
		
		proto.height = function(value){
			var returnVal = proto.superclass().height.call(this, value);
			if(value === 'scroll' || value === 'content'){
				var inputHeight = this._cl_inputView.height(this._cl_inputView._cl_height.auto ? 'scroll' : undefined) + this._cl_inputView.y(true),
					labelHeight = this._cl_labelView ? (this._cl_labelView.height(this._cl_labelView._cl_height.auto ? 'scroll' : undefined) + this._cl_labelView.y(true)) : 0;
				return Math.max(inputHeight, labelHeight) + this._cl_calculatedOffset.height + this._cl_calculatedClientOffset.height;
			}
			return returnVal;
		}*/
		
		proto.Override.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			proto.superclass().processCustomViewDefNode.apply(this, arguments);
			switch(nodeName){
				case 'Label':
				case 'Input':
					var builder = this.create(a5.cl.core.viewDef.ViewBuilder, [this._cl_controller, node.node, defaults, imports, rootView]);
					builder.build(null, null, null, nodeName === 'Label' ? this._cl_labelView : this._cl_inputView);
					break;
			}
		}
		
		proto.dealloc = function(){
			this._cl_changeEvent.cancel();
			this._cl_changeEvent.destroy();
		}
	
});


/**
 * @class 
 * @name a5.cl.ui.form.UIInputField
 * @extends a5.cl.ui.form.UIFormElement
 */
a5.Package('a5.cl.ui.form')
	.Import('a5.cl.ui.events.*',
			'a5.cl.core.Utils',
			'a5.cl.ui.core.Keyboard',
			'a5.cl.ui.core.UIUtils',
			'a5.cl.ui.modals.UIInputHistoryList')
	.Extends('UIFormElement')
	.Mix('a5.cl.ui.mixins.UIKeyboardEventDispatcher')
	.Prototype('UIInputField', function(proto, im){
		
		this.Properties(function(){
			this._cl_element = null;
			this._cl_multiline = false;
			this._cl_defaultValue = '';
			this._cl_textColor = '#000';
			this._cl_defaultTextColor = '#666';
			this._cl_password = false;
			this._cl_imitateLabel = false;
			this._cl_historyEnabled = false;
			this._cl_dataStore = null;
			this._cl_history = null;
			this._cl_userEnteredValue = "";
			this._cl_historyInsertedValue = "";
			this._cl_minLength = 0;
			this._cl_maxLength = Infinity;
			this._cl_textAlign = 'left';
		})
		
		proto.UIInputField = function(text){
			proto.superclass(this);
			this.multiline(false, true); //creates the input element
			
			this._cl_dataStore = this.create(a5.cl.ui.form.InputFieldDataStore);
			
			this.inputView().border(1, 'solid', '#C8C6C4').backgroundColor('#fff');
			this.height('auto').relX(true);
			if(typeof text === 'string') this.value(text);
			
			this.addEventListener(im.UIEvent.FOCUS, this._cl_eFocusHandler, false, this);
			this.addEventListener(im.UIEvent.BLUR, this._cl_eBlurHandler, false, this);
			this.cl().addEventListener(a5.cl.CLEvent.APPLICATION_WILL_CLOSE, this._cl_persistHistory, false, this);
			
			this.addEventListener(im.UIKeyboardEvent.KEY_UP, this._cl_eKeyUpHandler, false, this);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			//add the input element to the html view
			this.inputView().htmlWrapper().appendChild(this._cl_element);
			var self = this;
			this._cl_element.onchange = function(){
				self.dispatchEvent(self._cl_changeEvent);
			}
		}
		
		proto.Override.id = function(value){
			if (typeof value === 'string')
				this._cl_dataStore.keyPrefix(value);
			return proto.superclass().id.call(this, value);
		}
		
		proto.Override._cl_validate = function(){
			var isValid = true,
				superIsValid = proto.superclass()._cl_validate.call(this),
				value = this.value();
			if (value.length < this._cl_minLength) {
				isValid = false;
				this.addValidationState(im.UIValidationStates.TOO_SHORT);
			} else if (value.length > this._cl_maxLength) {
				isValid = false;
				this.addValidationState(im.UIValidationStates.TOO_LONG);
			}
			return isValid && superIsValid;
		}
		
		proto.Override._cl_validateRequired = function(){
			if(this.value().length === 0 || /^\s$/.test(this.value())){
				this.addValidationState(im.UIValidationStates.REQUIRED);
				return false;
			}
			return true;
		}
		
		proto.minLength = function(value){
			if(typeof value === 'number'){
				this._cl_minLength = value;
				return this;
			}
			return this._cl_minLength;
		}
		
		proto.maxLength = function(value){
			if(typeof value === 'number'){
				this._cl_maxLength = value;
				return this;
			}
			return this._cl_maxLength;
		}
		
		/**
		 * 
		 * @param {String} [value]
		 */
		proto.Override.value = function(value){
			if(value !== undefined && value !== null){
				value = value + ''; //force to a string
				this._cl_element.value = value;
				this._cl_element.setAttribute('value', value);
				if(this._cl_imitateLabel)
					this.label(value);
				if(value == '' && this._cl_defaultValue)
					this._cl_eBlurHandler();
				return this;
			}
			return this._cl_element.value;
		}
		
		/**
		 * 
		 * @param {String} value
		 */
		proto.defaultValue = function(value){
			if(typeof value === 'string'){
				this._cl_defaultValue = value;
				this._cl_eBlurHandler();
				return this;
			}
			return this._cl_defaultValue;
		}
		
		/**
		 * 
		 * @param {Boolean} [value]
		 */
		proto.multiline = function(value, force){
			if(typeof value === 'boolean' && (value !== this._cl_multiline || force === true)){
				this._cl_multiline = value;
				var previousValue = this._cl_element ? this._cl_element.value : '';
				this.inputView().clearHTML();
				if(value){
					this._cl_element = document.createElement('textarea');
					this._cl_element.style.resize = 'none';
					this.inputView().height('100%');
				} else {
					this.inputView().clearHTML();
					this._cl_element = document.createElement('input');
					this._cl_element.type = this._cl_password ? 'password' : 'text';
					this.inputView().height(22);
				}
				this._cl_element.id = this.instanceUID() + '_field';
				this._cl_element.style.width = this._cl_element.style.height = '100%';
				this._cl_element.style.padding = this._cl_element.style.margin = '0px';
				this._cl_element.style.border = 'none';
				this._cl_element.style.backgroundColor = 'transparent';
				this._cl_element.style.minHeight = '1em';
				this._cl_element.style.textAlign = this._cl_textAlign;
				this._cl_addFocusEvents(this._cl_element);
				this.keyboardEventTarget(this._cl_element);
				this.inputView().appendChild(this._cl_element);
				this._cl_element.value = previousValue;
				return this;
			}
			return this._cl_multiline;
		}
		
		proto.Override.enabled = function(value){
			if(typeof value === 'boolean'){
				this._cl_enabled = value;
				this._cl_element.readOnly = !value;
				return this;
			}
			return this._cl_enabled;
		}
		
		proto.historyEnabled = function(value){
			if(typeof value === 'boolean'){
				this._cl_historyEnabled = value;
				this._cl_history = this.getHistory();
				if (value)
					this._cl_element.setAttribute('autocomplete', 'off');
				else
					this._cl_element.removeAttribute('autocomplete');
				return this;
			}
			return this._cl_historyEnabled;
		}
		
		proto.storeValue = function(){
			var value = this.value();
			if(value != '' && this._cl_historyEnabled){
				var idx = im.Utils.arrayIndexOf(this._cl_history, value);
				if(idx > -1)
					this._cl_history.splice(idx, 1);
				this._cl_history.unshift(value);
			}
		}
		
		proto.getHistory = function(filtered){
			if(this._cl_history === null)
				this._cl_history = this._cl_dataStore.getValue('history') || [];
			return filtered === true ? this._cl_filterHistory() : this._cl_history;
		}
		
		proto.clearHistory = function(){
			return this._cl_dataStore.clearValue('history');
		}
		
		proto.imitateLabel = function(value){
			if(typeof value === 'boolean'){
				if(value !== this._cl_imitateLabel){
					if(value){
						this.relX(false).relY(false);
						this.label(this.value());
						this._cl_inputView.visible(false);
						this._cl_labelView.clickEnabled(true)
							.cursor('text')
							.addEventListener(im.UIMouseEvent.CLICK, this._cl_eLabelClickHandler, false, this);
						var self = this
						this.addEventListener(im.UIKeyboardEvent.ENTER_KEY, this._cl_eBlurHandler, false, this)
					} else {
						this._cl_inputView.visible(true);
						if (this._cl_labelView) {
							this._cl_labelView.visible(true)
								.clickEnabled(false)
								.usePointer(false);
							this._cl_labelView.removeEventListener(im.UIMouseEvent.CLICK, this._cl_eLabelClickHandler);
						}
					}
					this._cl_imitateLabel = value;
				}
				return this;
			}
			return this._cl_imitateLabel;
		}
		
		proto.Override.element = function(){
			return this._cl_element;
		}
		
		proto.textColor = function(value){
			if(typeof value !== 'undefined'){
				this._cl_textColor = value;
				if(this._cl_defaultValue)
					this._cl_element.onblur();
				else
					this._cl_element.style.color = value; 
				return this;
			}
			return this._cl_textColor;
		}
		
		proto.textAlign = function(value){
			if(typeof value === 'string'){
				this._cl_textAlign = value;
				this._cl_element.style.textAlign = value;
				return this;
			}
			return this._cl_textAlign;
		}
		
		proto.password = function(value){
			if(typeof value === 'boolean'){
				if(value !== this._cl_password){
					this._cl_password = value;
					this.multiline(this._cl_multiline, true);
				}
				return this;
			}
		}
		
		proto.defaultTextColor = function(value){
			if(typeof value !== 'undefined'){
				this._cl_defaultTextColor = value;
				if(this._cl_defaultValue && this.value() === this._cl_defaultValue)
					this._cl_element.style.color = value; 
				return this;
			}
			return this._cl_defaultTextColor;
		}
		
		proto._cl_eFocusHandler = function(e){
			if (this._cl_defaultValue && this.value() === this._cl_defaultValue) {
				this._cl_element.value = '';
				this._cl_element.style.color = this._cl_textColor;
			}
			if(this._cl_imitateLabel)
				this._cl_eLabelClickHandler();
		}
		
		proto._cl_eBlurHandler = function(e){
			if (this._cl_defaultValue && this.value() === this._cl_defaultValue) {
				this._cl_element.value = '';
				this._cl_element.style.color = this._cl_textColor;
			} else if(this._cl_imitateLabel){
				this.label(this.value());
				this._cl_inputView.visible(false);
				this._cl_labelView.visible(true);
			} else if(this._cl_historyEnabled && im.UIInputHistoryList.isOpen()){
				im.UIInputHistoryList.close();
			}
		}
		
		proto._cl_eLabelClickHandler = function(e){
			this._cl_labelView.visible(false);
			this._cl_inputView.visible(true);
			this.value(this.label());
			this.focus();
		}
		
		proto.Override._cl_eKeyUpHandler = function(e){
			if(im.Keyboard.isVisibleCharacter(e.keyCode()) || e.keyCode() === im.Keyboard.BACKSPACE || e.keyCode() === im.Keyboard.DELETE)
				this.dispatchEvent(this._cl_changeEvent);
			if(this._cl_historyEnabled && this._cl_history.length > 0){
				switch(e.keyCode()){
					case im.Keyboard.DOWN_ARROW:
						if(im.UIInputHistoryList.isOpen())
							im.UIInputHistoryList.nextItem();
						else
							this._cl_openHistoryList();
						break;
					case im.Keyboard.UP_ARROW:
						if(im.UIInputHistoryList.isOpen())
							im.UIInputHistoryList.previousItem();
						break;
					case im.Keyboard.ESCAPE:
						this.value(this._cl_userEnteredValue);
					case im.Keyboard.BACKSPACE:
					case im.Keyboard.DELETE:
						this._cl_userEnteredValue = this.value();
					case im.Keyboard.ENTER:
					case im.Keyboard.TAB:
					case im.Keyboard.RIGHT_ARROW:
						im.UIInputHistoryList.close();
						break;
					default:
						if(im.Keyboard.isVisibleCharacter(e.keyCode())){
							this._cl_userEnteredValue = this.value();
							//if(this._cl_userEnteredValue.substr(this._cl_userEnteredValue.length - this._cl_historyInsertedValue.length) === this._cl_historyInsertedValue)
							//	this._cl_userEnteredValue = this._cl_userEnteredValue.substr(0, this._cl_userEnteredValue.length - this._cl_historyInsertedValue.length);
							if(im.UIInputHistoryList.isOpen())
								im.UIInputHistoryList.update(this.getHistory(true));
							else
								this._cl_openHistoryList();
						}
				}
			}
		}
		
		proto._cl_openHistoryList = function(){
			im.UIInputHistoryList.instance().addEventListener(im.UIEvent.CHANGE, this._cl_eHistoryListChangeHandler, false, this);
			im.UIInputHistoryList.instance().addEventListener(im.UIEvent.CLOSE, this._cl_eHistoryListCloseHandler, false, this);
			im.UIInputHistoryList.open(this);
			var self = this;
			setTimeout(function(){
				var value = self.value();
				im.UIUtils.selectTextRange(value.length, value.length, self._cl_element);
			}, 0);
		}
		
		proto._cl_filterHistory = function(){
			var inputHistory = this.getHistory(),
				value = this.value(),
				filtered = [];
			for(var x = 0, y = inputHistory.length; x < y; x++){
				var thisItem = inputHistory[x];
				if(thisItem.substr(0, value.length) === value)
					filtered.push(thisItem)
			}
			return filtered;
		}
		
		proto._cl_eHistoryListChangeHandler = function(e){
			if(e.target() !== im.UIInputHistoryList.instance())
				return;
			
			var selectedOption = im.UIInputHistoryList.selectedItem();
			this.value(selectedOption);
			
			//this._cl_historyInsertedValue = selectedOption.substr(this._cl_userEnteredValue.length);
			
			// THIS IS A WORKAROUND FOR IE.  IT WON'T SELECT THE TEXT UNLESS WE BREAK OUT INTO ANOTHER THREAD
			var self = this;
			setTimeout(function(){
				//im.UIUtils.selectTextRange(self._cl_userEnteredValue.length, selectedOption.length, self._cl_element);
				im.UIUtils.selectTextRange(selectedOption.length, selectedOption.length, self._cl_element);
			}, 0);
		}
		
		proto._cl_eHistoryListCloseHandler = function(e){
			im.UIInputHistoryList.instance().removeEventListener(im.UIEvent.CHANGE, this._cl_eHistoryListChangeHandler);
			im.UIInputHistoryList.instance().removeEventListener(im.UIEvent.CLOSE, this._cl_eHistoryListCloseHandler);
		}
		
		proto._cl_persistHistory = function(){
			this._cl_dataStore.storeValue('history', this._cl_history);
		}
		
		proto.dealloc = function(){
			this.cl().removeEventListener(a5.cl.CLEvent.APPLICATION_WILL_CLOSE, this._cl_persistHistory);
			if(this._cl_historyEnabled)
				this._cl_persistHistory();
			this._cl_destroyElement(this._cl_element);
			this._cl_element = null;
			this._cl_dataStore.destroy();
		}
	});
	
a5.Package('a5.cl.ui.form').Mix('a5.cl.mixins.DataStore').Class('InputFieldDataStore', function(self){
	self.InputFieldDataStore = function(){}
});


a5.Package('a5.cl.ui.form')
	.Import('a5.cl.ui.*')
	.Extends('UIFormElement')
	.Mix('a5.cl.ui.mixins.UIGroupable')
	.Prototype('UIOptionButton', function(proto, im){
		proto.UIOptionButton = function(type){
			proto.superclass(this);
			this._cl_value = null;
			this._cl_input = this._cl_createInput((type === 'radio') ? 'radio' : 'checkbox');
			this.height('auto')
				.inputViewWidth(25)
				.labelViewWidth('auto')
				.relX(true);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this._cl_inputView.htmlWrapper().appendChild(this._cl_input);
		}
		
		proto.type = function(value){
			if ((value === 'radio' || value === 'checkbox') && value !== this._cl_input.type) {
				try {
					this._cl_inputView.htmlWrapper().removeChild(this._cl_input);
				} catch(e){
					//do nothing
				}
				this._cl_input = this._cl_createInput(value);
				this._cl_inputView.htmlWrapper().appendChild(this._cl_input);
			}
			return this._cl_input.type;
		}
		
		proto.Override.selected = function(value, suppressEvent){
			if (typeof value === 'boolean') {
				this._cl_input.checked = value;
			}
			return this.mixins().selected.call(this, value, suppressEvent === true);
		}
		
		proto.Override.label = function(value, labelAfterInput, nonBreaking){
			labelAfterInput = labelAfterInput !== false; //default to true
			return im.UIOptionButton.superclass().label.call(this, value, labelAfterInput, nonBreaking);
		}
		
		proto.Override.element = function(){
			return this._cl_input;
		}
		
		proto.Override.required = function(value){
			if(this._cl_optionGroup)
				return this._cl_optionGroup.required(value);
			else
				return proto.superclass().required.call(this, value); 
		}
		
		proto.Override.reset = function(){
			this.selected(false);
			this.validityChanged(true);
		}
		
		proto.Override._cl_validateRequired = function(){
			var isValid = true;
			if((this._cl_optionGroup && !this._cl_optionGroup.selectedOption()) || (!this._cl_optionGroup && !this.selected())){
				isValid = false;
				this.addValidationState(im.UIValidationStates.REQUIRED);
			}
			return isValid;
		}
		
		proto._cl_createInput = function(type, checked){
			var input = document.createElement('input');
			input.id = this.instanceUID() + '_input';
			input.type = type;
			input.name = this.instanceUID();
			input.checked = checked === true;
			var self = this;
			input.onchange = function(){
				self.selected(this.checked);
			}
			//If this is IE < 9, use this nice little hack to make onchange fire immediately
			if (this.cl()._core().envManager().clientPlatform() === 'IE' && this.cl()._core().envManager().browserVersion() < 9) {
				var inputOnClick = function(){
					this.blur();
					this.focus();
				}
				
				input.onclick = inputOnClick;
			}
			return input;
		}
		
		proto.dealloc = function(){
			if(this.optionGroup())
				this.optionGroup().removeOption(this);
			this._cl_destroyElement(this._cl_input);
			this._cl_input = null;
		}
	});



/**
 * @class A selection menu.
 * @name a5.cl.ui.form.UISelect
 * @extends a5.cl.ui.form.UIFormElement
 */
a5.Package('a5.cl.ui.form')
	.Extends('UIFormElement')
	.Prototype('UISelect', function(proto, im, UISelect){
		
		UISelect.customViewDefNodes = ['Option', 'Group'];
	
		proto.UISelect = function(options){
			proto.superclass(this);
			
			this._cl_select = null;
			this._cl_selectMultiple = false;
			this._cl_selectSize = null;
			this._cl_options = [];
			this._cl_minValidIndex = 0;
			
			this.height('auto');
			this.inputView().width(200).height('auto').border(1, 'solid', '#C8C6C4').backgroundColor('#fff');
			
			//if options were passed in a5.Create, add them now.
			if(options instanceof Array)
				this._cl_addOptionsFromData(options);
		}
		
		proto.Override.viewReady = function(){
			//force a redraw of the select
			this._cl_redrawSelect();
			im.UISelect.superclass().viewReady.call(this);
		}
		
		/** @private */
		proto._cl_redrawSelect = function(){
			//remove the existing select, if necessary
			var selectedIndex = -1;
			if (this._cl_select) {
				selectedIndex = this._cl_select.selectedIndex;
				this._cl_select.onchange = null;
				this.inputView().clearHTML();
			}
			//create a new select element
			var sel = document.createElement('select');
			sel.id = this.instanceUID() + '_select';
			sel.style.width = '100%';
			sel.style.border = 'none';
			sel.disabled = !this._cl_enabled ? 'disabled' : null;
			sel.style.backgroundColor = 'transparent';
			sel.multiple = this._cl_selectMultiple;
			this._cl_addFocusEvents(sel);
			if(typeof this._cl_selectSize === 'number') sel.size = this._cl_selectSize;
			//add the options to the select
			for(var x = 0, xl = this._cl_options.length; x < xl; x++){
				var item = this._cl_options[x];
				var opt;
				if(item.isGroup){
					//if this item is a group, create an optgroup
					opt = document.createElement('optgroup');
					opt.label = item.label;
					//and then loop through all of the options within the group
					for(var y = 0, yl = item.options.length; y < yl; y++){
						var grpItem = item.options[y];
						var grpOpt = document.createElement('option');
						grpOpt.innerHTML = grpItem.label;
						grpOpt.value = grpItem.value + '';
						opt.appendChild(grpOpt);
					}
				} else {
					//otherwise just create an option
					opt = document.createElement('option');
					opt.innerHTML = item.label;
					opt.value = item.value + '';
				}
				//add the item to the select
				sel.appendChild(opt);
				opt = null;
			}
			//add the select to the html view
			this.inputView().htmlWrapper().appendChild(sel);
			sel.selectedIndex = selectedIndex;
			var self = this;
			sel.onchange = function(e){
				self.dispatchEvent(self.create(a5.cl.ui.events.UIEvent, [a5.cl.ui.events.UIEvent.CHANGE, e || window.event]));
			};
			this._cl_select = sel;
			sel = null;
		}
		
		proto._cl_findGroup = function(group){
			for(var x = 0, y = this._cl_options.length; x < y; x++){
				var item = this._cl_options[x];
				if(item.isGroup && item.label === group)
					return item;
			}
			return undefined;
		}
		
		// Manipulation Methods
		
		/**
		 * Adds multiple options from an array of objects.  The format is as follow:
		 * <br /><code>
		 * [
		 *   {isGroup:true, label:'Group 1', options:[
		 *     {label:'Option 1', value:1},
		 *     {label:'Option 2', value:2},
		 *     {label:'Option 3', value:3}
		 *   ]}
		 * ]
		 * </code>
		 * 
		 * @param {Object[]} options The options and/or groups to be added.
		 */
		proto.addOptionsFromData = function(options){
			//call the internal method
			this._cl_addOptionsFromData(options);
			//redraw the select
			this._cl_redrawSelect();
		}
		
		/** @private */
		proto._cl_addOptionsFromData = function(options){
			if(options instanceof Array){
				for(var x = 0, y = options.length; x < y; x++){
					var opt = options[x];
					if(opt.isGroup !== undefined && opt.isGroup === true)
						this._cl_addGroup(opt.label, -1, opt.options);
					else
						this.addOption(opt.label, opt.value);
				}
			}
		}
		
		/**
		 * Adds an option to the UISelect, optionally within a group.
		 * 
		 * @param {String} label	The text to be displayed by the option.
		 * @param {Object} value	The value of the option.  Can be any type.
		 * @param {String} [group]	The label of the group that this option should be added to.
		 */
		proto.addOption = function(label, value, group){
			//call the internal method
			this._cl_addOptionAtIndex(label, value, -1, group);
			//redraw the select
			this._cl_redrawSelect();
		}
		
		/**
		 * Adds an option to the UISelect at a specified index, optionally within a group.
		 * 
		 * @param {String} label	The text to be displayed by the option.
		 * @param {Object} value	The value of the option.  Can be any type.
		 * @param {Number} index	The index at which this option should be inserted (relative to the group, if one is specified).
		 * @param {String} [group]	The label of the group that this option should be added to.
		 */
		proto.addOptionAtIndex = function(label, value, index, group){
			//call the internal method
			this._cl_addOptionAtIndex(label, value, index, group);
			//redraw the select
			this._cl_redrawSelect();
		}
		
		/** @private */
		proto._cl_addOptionAtIndex = function(label, value, index, group){
			if(typeof group === 'string' && typeof index === 'number'){
				//if a group was specified, add the option to that group
				var grp = this._cl_findGroup(group);
				//if a group with that label wasn't found, create one now
				if (grp === undefined) {
					this.addGroup(group);
					grp = this._cl_options[this._cl_options.length - 1];
				}
				//validate the index
				if(index < 0 || index > grp.options.length) index = grp.options.length;
				//add the option to the group
				grp.options.splice(index, 0, {label:label, value:value});
			} else {
				//validate the index
				if(index < 0 || index > this._cl_options.length) index = this._cl_options.length;
				//add it to the array at the specified index
				this._cl_options.splice(index, 0, {label:label, value:value});
			}
		}
		
		/**
		 * Removes all options from the UISelect that have the specified label and value.
		 * 
		 * @param	{String} label	The label of the option to be removed.
		 * @param	{Object} value	The value of the option to be removed.
		 * @return	{Number} The number of options that were removed.
		 */
		proto.removeOption = function(label, value){
			var removed = 0;
			var toBeRemoved = [];
			//loop through each option
			for(var x = 0, xl = this._cl_options.length; x < xl; x++){
				var item = this._cl_options[x];
				if(item.isGroup){
					//if it's a group, loop through each option in the group
					var grpToBeRemoved = [];
					for(var y = 0, yl = item.options.length; y < yl; y++){
						var grpItem = item.options[y];
						//if this item matches the label and value passed, mark it for deletion 
						if(grpItem.label === label && grpItem.value === value)
							grpToBeRemoved.push(y);
					}
					//remove all of the items that were flagged
					for(var z = 0, zl = grpToBeRemoved.length; z < zl; z++){
						item.options.splice(z, 1);
						removed++;
					}
				} else {
					//if this item matches the label and value passed, mark it for deletion
					if(item.label === label && item.value === value)
						toBeRemoved.push(x);
				}
			}
			for(var x = 0, xl = toBeRemoved.length; x < xl; x++){
				this._cl_options.splice(x, 1);
				removed++;
			}
			//redraw the select
			this._cl_redrawSelect();
			//return the array of options that were removed;
			return removed;
		}
		
		/**
		 * Removes an option from the UISelect at the specified index, optionally within a specified group.
		 * 
		 * @param  {Number} index	The index of the option that should be removed.
		 * @param  {String} [group]	The label of the group that this option should be added to.
		 * @return {Object} The option that was removed.
		 */
		proto.removeOptionAtIndex = function(index, group){
			if(typeof group === 'string'){
				//if a group was specified, remove the specified option from the group
				var grp = this._cl_findGroup(group);
				if (grp === undefined) {
					return null;
				} else {
					var removed = grp.options.splice(index, 1)[0];
					this._cl_redrawSelect();
					return removed;
				}
			} else {
				//traverse the options until we hit the specified index
				var i = -1;
				for(var x = 0, xl = this._cl_options.length; x < xl; x++){
					var item = this._cl_options[x];
					if(item.isGroup){
						//if it's a group, loop through each option in the group
						for(var y = 0, yl = item.options.length; y < yl; y++){
							var grpItem = item.options[y];
							i++;
							if(i === index)
								var removed = item.options.splice(y, 1)[0];
								this._cl_redrawSelect();
								return removed;
						}
					} else {
						i++;
						if(i === index){
							var removed = this._cl_options.options.splice(x, 1)[0];
							this._cl_redrawSelect();
							return removed;
						}
					}
				}
			}
		}
		
		/**
		 * Removes all of the options.
		 */
		proto.removeAll = function(){
			this._cl_options = [];
			this._cl_redrawSelect();
		}
		
		/**
		 * Adds a group to the UISelect.  If an array of options are passed, those options will be added to the group.
		 * 
		 * @param {String}	 label		The text to be displayed for this group.
		 * @param {Number}	 [index]	The global index at which to add this group.
		 * @param {Object[]} [options]	An array of options to be placed within this group.
		 */
		proto.addGroup = function(label, index, options){
			//call teh internal method
			this._cl_addGroup(label, index, options);
			//redraw the select
			this._cl_redrawSelect();
		}
		
		/** @private */
		proto._cl_addGroup = function(label, index, options){
			if(typeof label === 'string'){
				//validate the index
				if(typeof index !== 'number') index = -1;
				if(index < 0 || index > this._cl_options.length) index = this._cl_options.length;
				//create the group
				var grp = {isGroup:true, label:label, options:[]};
				//add options to the group if necessary
				if(options instanceof Array){
					for(var x = 0, y = options.length; x < y; x++){
						var opt = options[x];
						grp.options.push({label:opt.label, value:opt.value});
					}
				}
				//add the group to the array
				this._cl_options.splice(index, 0, grp);
			}
		}
		
		/**
		 * Removes a group from the UISelect.  By default, the options within that group will also be removed. Pass false as a second param to keep the options.
		 * 
		 * @param  {String}		group					The label of the group to be removed
		 * @param  {Boolean}	[removeOptions=true]	If false, the options within the specified group will not be removed from the select.
		 * @return {Object[]}	Returns an array of options that were in the removed group. 
		 */
		proto.removeGroup = function(group, removeOptions){
			var grp;
			var index;
			for(var x = 0, y = this._cl_options.length; x < y; x++){
				var item = this._cl_options[x];
				if (item.isGroup && item.label === group) {
					grp = item;
					index = x;
					break;
				}
			}
			if(typeof index === 'number'){
				this._cl_options.splice(index, 1);
				if(removeOptions === false){
					for(var x = 0, y = grp.options.length; x < y; x++){
						this._cl_options.splice(index + x, 0, grp.options[x]);
					}
				}
			}
			this._cl_redrawSelect();
			return grp.options;
		}
		
		
		// Informational Methods
		
		/**
		 * Gets or sets the option that is currently selected, or null if none is selected.
		 * 
		 * @param value {Object} An object with 'value' and/or 'label' properties corresponding to the option that should be selected.
		 * @return {Object}	The currently selected option.
		 */
		proto.selectedOption = function(value){
			var setting = (typeof value === 'object' && (value.hasOwnProperty('value') || value.hasOwnProperty('label')));
			var checkLabel = setting && value.hasOwnProperty('label');
			var checkValue = setting && value.hasOwnProperty('value');
				
			var selectedIndex = this._cl_select.selectedIndex;
			if(selectedIndex < 0 && !setting) return null;
			
			var i = -1;
			for (var x = 0, xl = this._cl_options.length; x < xl; x++) {
				var item = this._cl_options[x];
				if (item.isGroup) {
					for (var y = 0, yl = item.options.length; y < yl; y++) {
						i++;
						var grpItem = item.options[y];
						if (setting) {
							var labelMatch = checkLabel ? (grpItem.label === value.label) : true;
							var valueMatch = checkValue ? (grpItem.value === value.value) : true;
							if(labelMatch && valueMatch){
								this._cl_select.selectedIndex = i;
								return this;
							}
						} else if (i === selectedIndex) {
							return grpItem;
						}
					}
				} else {
					i++
					if (setting) {
						var labelMatch = checkLabel ? (item.label === value.label) : true;
						var valueMatch = checkValue ? (item.value === value.value) : true;
						if(labelMatch && valueMatch){
							this._cl_select.selectedIndex = i;
							return this;
						}
					} else if (i === selectedIndex) {
						return item;
					}
				}
			}
			return null;
		}
		
		proto.Override.value = function(){
			var selectedOpt = this.selectedOption();
			return selectedOpt ? (selectedOpt.value || selectedOpt.label) : null ;
		}
		
		proto.Override._cl_validateRequired = function(){
			if(this._cl_select.selectedIndex < this._cl_minValidIndex){
				this.addValidationState(im.UIValidationStates.REQUIRED);
				return false;
			}
			return true;
		}
		
		/**
		 * Select the option at the specified index.
		 * 
		 * @param {Number} index The index of the option to select.
		 */
		proto.selectOptionAtIndex = function(index){
			var opt = this.getOptionAtIndex(index);
			if(opt)
				this.selectedOption(opt);
			this._cl_select.onchange();
		}
		
		/**
		 * Returns the option at the specified index, or an array of options if a group is at the specified index.  Pass a group label to search within that specified group.
		 * 
		 * @param {Number} index The index of the option to retrieve.
		 * @return {Object|Object[]} The option at the specified index.
		 */
		proto.getOptionAtIndex = function(index, group){
			if(typeof group === 'string'){
				//if a group was specified, just return the index within that group
				var grp = this._cl_findGroup(group);
				if (grp === undefined)
					return null;
				else
					return grp.options[index];
			} else {
				//traverse the options until we hit the specified index
				var i = -1;
				for(var x = 0, xl = this._cl_options.length; x < xl; x++){
					var item = this._cl_options[x];
					if(item.isGroup){
						//if it's a group, loop through each option in the group
						for(var y = 0, yl = item.options.length; y < yl; y++){
							var grpItem = item.options[y];
							i++;
							if(i === index)
								return grpItem;
						}
					} else {
						i++;
						if(i === index)
							return item;
					}
				}
			}
		}
		
		/**
		 * Returns an array of options that are within the specified group. 
		 * 
		 * @param {String} group The label of the group to retrieve.
		 * @return {Object[]} An array of options that are in the specified group.
		 */
		proto.getGroup = function(group){
			var grp = this._cl_findGroup(group);
			if(grp)
				return grp.options;
			else
				return null;
		}
		
		proto.Override.reset = function(){
			this.selectOptionAtIndex(0);
			this.validityChanged(true);
		}
		
		/**
		 * Whether the UISelect should allow multiple selections.  Defaults to false.
		 * 
		 * @param {Boolean} [value] Whether the UISelect should allow multiple selections.
		 * @return {Boolean} Whether the UISelect allows multiple selections.
		 */
		proto.allowMultiple = function(value){
			if (typeof value === 'boolean') {
				if(this._cl_select) this._cl_select.multiple = value;
				this._cl_selectMultiple = value;
			}
			return this._cl_select.multiple;
		}
		
		/**
		 * 
		 * @param {Number} value The maximum number of options to display at one time.
		 */
		proto.size = function(value){
			if(typeof value === 'boolean'){
				if(this._cl_select) this._cl_select.size = value;
				this._cl_selectSize = value;
			}
			return this._cl_selectSize;
		}
		
		proto.minValidIndex = function(value){
			if(typeof value === 'number'){
				this._cl_minValidIndex = value;
				return this;
			}
			return this._cl_minValidIndex;
		}
		
		proto.Override.enabled = function(value){
			if (typeof value === 'boolean') {
				if(this._cl_select) this._cl_select.disabled = !value;
				this._cl_enabled = value;
			}
			return this._cl_enabled;
		}
		
		proto.Override.element = function(){
			return this._cl_select;
		}
		
		proto.Override.processCustomViewDefNode = function(nodeName, node, imports, defaults, rootView){
			proto.superclass().processCustomViewDefNode.apply(this, arguments);
			switch(nodeName){
				case 'Option':
					this.addOption(node.label, node.value, node.group);
					break;
				case 'Group':
					this.addGroup(node.label);
					break;
			}
		}
		
		proto.dealloc = function(){
			this._cl_select.onchange = null;
			this._cl_destroyElement(this._cl_select);
			this._cl_select = null;
		}

});


a5.Package('a5.cl.ui.form')

	.Extends('UIFormElement')
	.Prototype('UIRange', function(proto, im){
		
		proto.UIRange = function(){
			proto.superclass(this, arguments);
			this._cl_element = document.createElement('input');
			this._cl_element.type = 'range';
			this._cl_element.min = 0;
			this._cl_element.max = 100;
			this._cl_element.style.width = '100%';
			this.inputView().appendChild(this._cl_element);
		}
		
		
		proto.minValue = function(value){
			if(value !== undefined){
				this._cl_element.min = value;
				return this;
			}
			return this._cl_element.min;
		}
		
		proto.maxValue = function(value){
			if(value !== undefined){
				this._cl_element.max = value;
				return this;
			}
			return this._cl_element.max;
		}
		
		proto.Override.value = function(value){
			proto.superclass().value.call(this, arguments);
			if(value !== undefined){
				this._cl_element.value = value;
				return this;
			}
			return this._cl_element.value;
		}		
})


a5.Package('a5.cl.ui.form')
	.Extends('UIFormElement')
	.Prototype('UIFileInput', function(proto, im, UIFileInput){
		
		proto.UIFileInput = function(){
			proto.superclass(this);
			
			this._cl_element = document.createElement('input');
			this._cl_element.type = 'file';
			this._cl_element.id = this.instanceUID() + '_field';
			this._cl_element.style.width = '100%';
		}
		
		proto.Override.viewReady = function(){
			this._cl_inputView.appendChild(this._cl_element);
		}
		
		proto.Override.value = function(){
			return this._cl_element.files ? this._cl_element.files[0] : this._cl_element.value;
		}
});



a5.Package('a5.cl.ui.form')
	.Import('a5.cl.core.Utils',
			'a5.cl.CLEvent')
	.Extends('a5.cl.CLViewContainer')
	.Prototype('UIForm', function(proto, im, UIForm){
	
		this.Properties(function(){
			this._cl_elements = [];
			this._cl_action = null;
			this._cl_method = 'POST';
			this._cl_validateOnSubmit = true;
		});
		
		proto.UIForm = function(){
			this._cl_viewElementType = 'form';
			proto.superclass(this);
			
			this.addEventListener(im.CLEvent.ADDED_TO_PARENT, this._cl_eChildViewHandler, false, this);
			this.addEventListener(im.CLEvent.REMOVED_FROM_PARENT, this._cl_eChildViewHandler, false, this);
		}
		
		proto.validate = function(){
			var invalid = [],
				x, y, thisElem;
			for(x = 0, y = this._cl_elements.length; x < y; x++){
				thisElem = this._cl_elements[x];
				if (!thisElem.validate()) {
					if(thisElem instanceof im.UIOptionButton && thisElem.optionGroup())
						thisElem = thisElem.optionGroup();
					if(im.Utils.arrayIndexOf(invalid, thisElem) === -1)
						invalid.push(thisElem);
				}
			}
			return invalid.length === 0 ? true : invalid;
		}
		
		proto.getData = function(){
			var data = {},
				x, y, thisElem, optGroup;
			for(x = 0, y = this._cl_elements.length; x < y; x++){
				thisElem = this._cl_elements[x];
				if(thisElem instanceof im.UIOptionButton){
					optGroup = thisElem.optionGroup();
					if(optGroup)
						thisElem = optGroup;
					else {
						data[thisElem.name()] = thisElem.selected();
						continue;
					}
				}
				data[thisElem.name()] = thisElem.value();
			}
			return data;
		}
		
		proto.submit = function(onSuccess, onError){
			var validity = this._cl_validateOnSubmit ? this.validate() : true,
				data = this.getData(),
				supportsFormData = "FormData" in window;
			if(validity !== true) return validity;
			if(typeof this._cl_action === 'function'){
				this._cl_action.call(this, data);
			} else if(typeof this._cl_action === 'string'){
				a5.cl.core.RequestManager.instance().makeRequest({
					url: this._cl_action,
					method: this._cl_method,
					formData: supportsFormData,
					data: data,
					isJson: !supportsFormData,
					success: typeof onSuccess === 'function' ? onSuccess : null,
					error: typeof onError === 'function' ? onError : null
				});
			}
			return true;
		}
		
		proto.reset = function(){
			for(var x = 0, y = this._cl_elements.length; x < y; x++)
				this._cl_elements[x].reset();
		}
		
		proto.elements = function(){
			return this._cl_elements.slice(0);
		}
		
		proto.validateOnSubmit = function(value){
			if(typeof value === 'boolean'){
				this._cl_validateOnSubmit = value;
				return this;
			}
			return this._cl_validateOnSubmit;
		}
		
		/**
		 * Gets or sets the action associated with this form.
		 * If a URL is specified, the submit() method will send the form's data to that URL.
		 * If a function is specified, the submit() method will pass the form's data to that function. 
		 * @name action
		 * @param {String|Function} value The URL to send the forms' data to, or the function to call when submit() is triggered.
		 */
		proto.action = function(value){
			if(typeof value === 'string' || typeof value === 'function'){
				this._cl_action = value;
				return this;
			}
			return this._cl_action;
		}
		
		/**
		 * Gets or sets the method by which to send data on submit when a URL is specified for action. (GET or POST)
		 * @name method
		 * @param {String} value
		 */
		proto.method = function(value){
			if(typeof value === 'string'){
				this._cl_method = value.toUpperCase();
				return this;
			}
			return this._cl_method;
		}
		
		proto._cl_eChildViewHandler = function(e){
			var view = e.target(), 
				index = -1;
			if(view instanceof UIForm && view !== this){
				this.throwError("UIForms cannot be nested within other UIForms.  Consider a different view structure.");
				return;
			}
			if(view instanceof im.UIFormElement) {
				switch (e.type()) {
					case im.CLEvent.ADDED_TO_PARENT:
						view._cl_form = this;
						this._cl_elements.push(view);
						break;
					case im.CLEvent.REMOVED_FROM_PARENT:
						index = im.Utils.arrayIndexOf(this._cl_elements, view);
						if (index > -1) {
							this._cl_elements.splice(index, 1);
							view._cl_form = null;
						}
						break;
				}
			} else if(view instanceof a5.cl.CLViewContainer && e.type() === im.CLEvent.ADDED_TO_PARENT){
				//if the child added is a container, check its children
				for(var x = 0, y = view.subViewCount(); x < y; x++){
					view.subViewAtIndex(x).dispatchEvent(this.create(im.CLEvent, [im.CLEvent.ADDED_TO_PARENT]));
				}
			}
		}
});



/**
 * @class 
 * @name a5.cl.ui.buttons.UIButton
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui.buttons')
	.Import('a5.cl.ui.events.UIMouseEvent',
			'a5.cl.ui.UITextField',
			'a5.cl.ui.form.UIOptionGroup')
	.Extends('a5.cl.ui.UIControl')
	.Mix('a5.cl.ui.mixins.UIGroupable')
	.Prototype('UIButton', function(proto, im, UIButton){
		
		UIButton.themeDefaults = {
			//width:100,
			//height:25,
			padding:{left:5, right:5},
			backgroundColor:['#FFF', '#CCC'],
			border:[1, 'solid', '#AAA', 5],
			_states_:{
				over:{
					backgroundColor:['#CCC', '#FFF'],
					border:[1, 'solid', '#AAA', 5]
				},
				down:{
					backgroundColor:['#CCC', '#FFF'],
					border:[1, 'solid', '#AAA', 5]
				},
				selected:{
					backgroundColor:['#CCC', '#FFF'],
					border:[1, 'solid', '#666', 5]
				}
			}
		};
		
		proto.UIButton = function(label){
			proto.superclass(this);
			this._cl_labelView = this.create(im.UITextField);
			this._cl_data = null;
			this._cl_state = 'up';
			
			this._cl_labelView.width('100%')
				.textAlign('center')
				.alignY('middle')
				.nonBreaking(true);
			this.usePointer(true);
			this.clickEnabled(true);
			this.width(100).height(25);
			
			if(typeof label === 'string')
				this.label(label);
				
			this.themeState('up');
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.addSubView(this._cl_labelView);
			
			var self = this;
			this.addEventListener(im.UIMouseEvent.CLICK, this._cl_onMouseClick, false, this);
			this.addEventListener(im.UIMouseEvent.MOUSE_DOWN, this._cl_onMouseDown, false, this);
			this.addEventListener(im.UIMouseEvent.MOUSE_UP, this._cl_onMouseUp, false, this);
			
			this._cl_viewElement.onmouseover = function(e){
				self._cl_onMouseOver.call(self, e || window.event);
				return false;
			}
			this._cl_viewElement.onmouseout = function(e){
				self._cl_onMouseOut.call(self, e || window.event);
				return false;
			}
		}
		
		proto._cl_onMouseClick = function(e){
			if(this.optionGroup() instanceof im.UIOptionGroup)
				this.selected(true);
		}
		
		proto._cl_onMouseOver = function(e){
			if (this._cl_enabled){
				this._cl_state = 'over';
				//update the colors
				if(!this._cl_selected)
					this.themeState('over')
				//dispatch the event
				var evt = this.create(im.UIMouseEvent, [im.UIMouseEvent.MOUSE_OVER, e]);
				this.dispatchEvent(evt);
			}
		}
		
		proto._cl_onMouseOut = function(e){
			//update the bg color with the up color(s)
			if (this._cl_enabled) {
				this._cl_state = 'up';
				//update the colors
				if(!this._cl_selected)
					this.themeState('up');
				//dispatch the event
				var evt = this.create(im.UIMouseEvent, [im.UIMouseEvent.MOUSE_OUT, e]);
				this.dispatchEvent(evt);
			}
		}
		
		proto._cl_onMouseUp = function(e){
			//update the bg color with the up color(s)
			if (this._cl_enabled) {
				this._cl_state = 'up';
				//update the colors
				if(!this._cl_selected)
					this.themeState('up');
			}
		}
		
		proto._cl_onMouseDown = function(e){
			if (this._cl_enabled) {
				this._cl_state = 'down';
				//update the colors
				if(!this._cl_selected)
					this.themeState('down');
			}
		}
		
		proto.Override.selected = function(value){
			var returnVal = this.mixins().selected.call(this, value);
			if (typeof value === 'boolean') {
				this.themeState(value ? 'selected' : this._cl_state);
				return this;
			}
			return returnVal;
		}
		
		proto.Override.enabled = function(value){
			proto.superclass().enabled.call(this, value);
			if(typeof value === 'boolean'){
				this.themeState(value ? this._cl_state : 'disabled');
				this._cl_viewElement.style.cursor = value ? this._cl_cursor : 'default';
				return this;
			}
			return this._cl_enabled;
		}
		
		proto.element = function(){
			return this._cl_viewElement;
		}
		
		/**
		 * 
		 * @param {String} str
		 */
		proto.label = function(str){
			if(typeof str === 'string'){
				this._cl_labelView.text(str);
				return this;
			}
			return this._cl_labelView.text();
		}
		
		proto.labelView = function(){
			return this._cl_labelView;
		}
		
		proto.data = function(value){
			if(typeof value !== 'undefined'){
				this._cl_data = value;
				return this;
			}
			return this._cl_data;
		}
		
		proto.textAlign = function(value){
			return this._cl_labelView.textAlign(value);
		}
		
		proto.fontSize = function(value){
			return this._cl_labelView.fontSize(value);
		}
		
		proto.fontWeight = function(value){
			return this._cl_labelView.fontWeight(value);
		}
		
		proto.dealloc = function(){
			this._cl_viewElement.onmouseover = this._cl_viewElement.onmouseout = null;
		}	
});


a5.Package('a5.cl.ui.buttons')

	.Extends('UIButton')
	.Prototype('UIToggleButton', function(proto, im, UIToggleButton){
		
		UIToggleButton.themeDefaults = {
			padding:{left:5, right:5},
			backgroundColor:'transparent',
			border:0
		};
		
		
		var Private = this.PrivateProperties(function(){
			this.toggled = false;
		})
		
		proto.UIToggleButton = function(toggled){
			proto.superclass(this);
			Private(this).toggled = toggled;
		}
		
		proto.Override.childrenReady = function(){
			this._cl_setToggle(Private(this).toggled);
		}
		
		proto.Override._cl_onMouseClick = function(e){
			this._cl_setToggle(!Private(this).toggled);
			proto.superclass()._cl_onMouseClick.call(this, e);
		}
		
		proto.toggled = function(value){
			if(value !== undefined){
				this._cl_setToggle(value);
			}
			//TODO: forced ! because events are not fired here first
			return !Private(this).toggled;
		}
		
		proto._cl_setToggle = function(value){
			Private(this).toggled = value;
			this.toggledView().visible(value);
			this.untoggledView().visible(!value);
		}
		
		proto.untoggledView = function(){
			return this.subViewAtIndex(0);
		}
		
		proto.toggledView = function(){
			return this.subViewAtIndex(1);
		}
})


a5.Package('a5.cl.ui.modals')
	.Extends('a5.cl.CLWindow')
	.Prototype('UIModal', function(proto, im){
		
		this.Properties(function(){
			this._cl_destroyOnClose = true;
		})
			
		proto.UIModal = function(){
			proto.superclass(this);
			this._cl_windowLevel = a5.cl.CLWindowLevel.MODAL;
		}
		
		proto.open = function(){
			this.MVC().application().addWindow(this);
		}
		
		proto.Override.show = function(){
			this.open();
		}
		
		proto.close = function(){
			if(this.isOpen())
				this.MVC().application().removeWindow(this, this._cl_destroyOnClose);
		}
		
		proto.Override.hide = function(){
			this.close();
		}
		
		proto.isOpen = function(){
			return this.MVC().application().containsWindow(this);
		}
		
		proto.destroyOnClose = function(value){
			if(typeof value === 'boolean'){
				this._cl_destroyOnClose = value;
				return this;
			}
			return this._cl_destroyOnClose;			
		}
	})


/**
 * @class Presents the user with a modal lightbox style display overlay of content.
 * @name a5.cl.ui.UILightBox
 * @extends a5.cl.CLWindow
 */
a5.Package('a5.cl.ui.modals')
	.Import('a5.cl.ui.*',
			'a5.cl.*',
			'a5.cl.ui.events.UIMouseEvent')
	.Extends('UIModal')
	.Static(function(UILightBox, im){
		
		UILightBox.show = function(_inst){
			return UILightBox.open(_inst);
		}
		
		UILightBox.open = function(_inst){
			var inst = _inst instanceof UILightBox ? _inst : UILightBox.instance(true);
			inst.open();
			return inst;
		}
		
		UILightBox.close = function(_inst){
			var inst = _inst instanceof UILightBox ? _inst : UILightBox.instance(true);
			inst.close();
		}	
	})
	.Prototype('UILightBox', function(proto, im){
		
		this.Properties(function(){
			this._cl_bgView = null;
			this._cl_contentView = null;
			this._cl_userCanClose = true;
		})
		
		proto.UILightBox = function(){
			proto.superclass(this);
			
			this._cl_bgView = this.create(im.UIControl).width('100%').height('100%')
				.clickEnabled(true).usePointer(true).backgroundColor('#000').alpha(.5);
			this._cl_contentView = this.create(im.CLViewContainer)
				.height('auto').width('auto').alignX('center').alignY('middle').backgroundColor('#fff');
		}
		
		proto.Override.draw = function(){
			proto.superclass().draw.apply(this, arguments);
			proto.superclass().backgroundColor.call(this, 'transparent');
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.constrainChildren(true);
			this._cl_bgView.addEventListener(im.UIMouseEvent.CLICK, this._cl_eBGClickedHandler, false, this);
			this.addSubView(this._cl_bgView);
			this.addSubView(this._cl_contentView);
			this._cl_locked(true);
		}
		
		proto.userCanClose = function(value){
			if(typeof value === 'boolean'){
				this._cl_userCanClose = value;
				return this;
			}
			return this._cl_userCanClose;			
		}
		
		proto.setWidth = function(value){
			this._cl_contentView.width(value);
			return this;
		}
		
		proto.setHeight = function(value){
			this._cl_contentView.height(value);
			return this;
		}
		
		proto.contentView = function(){
			return this._cl_contentView;
		}
		
		proto.contentWidth = function(){ 
			if (arguments.length) {
				this._cl_contentView.width.apply(this._cl_contentView, arguments);
				return this;
			} else {
				return this._cl_contentView.width();
			}
		}
		
		proto.contentHeight = function(){ 
			if (arguments.length) {
				this._cl_contentView.height.apply(this._cl_contentView, arguments);
				return this;
			} else {
				return this._cl_contentView.height();
			}
		}
		
		proto.Override.backgroundColor = function(){ 
			if (arguments.length) {
				this._cl_bgView.backgroundColor.apply(this._cl_bgView, arguments);
				return this;
			} else {
				return this._cl_bgView.backgroundColor();
			} 
		}	
		
		proto.Override.alpha = function(){ 
			if (arguments.length) {
				this._cl_bgView.alpha.apply(this._cl_bgView, arguments);
				return this;
			} else {
				return this._cl_bgView.alpha();
			}
		}
		
		proto.Override.border = function(){ 
			if (arguments.length) {
				this._cl_contentView.border.apply(this._cl_contentView, arguments);
				return this;
			} else {
				return this._cl_contentView.border();
			}
		}
		
		proto._cl_eBGClickedHandler = function(e){
			if (this._cl_userCanClose) {
				e.cancel();
				this.close();
			}
		}
});




a5.Package('a5.cl.ui.modals')
	.Import('a5.cl.ui.UIControl',
			'a5.cl.core.Utils')
	.Extends('a5.cl.CLWindow')
	.Prototype('UIContextMenuWindow', function(proto, im){
		
		proto.UIContextMenuWindow = function(){
			proto.superclass(this, arguments);
			this._cl_windowLevel = a5.cl.CLWindowLevel.CONTEXT;
			this._cl_menuView = null;
			
			var self = this;
			this._cl_globalClickHandler = function(){
				self.close();
			}
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.call(this);
			this.backgroundColor('transparent');
		}
		
		proto.menuView = function(view){
			if(view instanceof a5.cl.CLView){
				this._cl_removeMenuView();
				this.addSubView(view);
				this._cl_menuView = view;
				return this;
			} else if(view === null || view === false){
				this._cl_removeMenuView();
				return this;
			}
			return this._cl_menuView;
		}
		
		proto.open = function(mouseEvent){
			var rootView = this.cl().application().view();
			if(this._cl_menuView && mouseEvent.clientX && mouseEvent.clientY){
				var outerX = mouseEvent.clientX + this._cl_menuView.width(),
					outerY = mouseEvent.clientY + this._cl_menuView.height();
				this._cl_menuView.x(outerX > rootView.width() ? (rootView.width() - this._cl_menuView.width() - 3) : mouseEvent.clientX);
				this._cl_menuView.y(outerY > rootView.height() ? (rootView.height() - this._cl_menuView.height() - 3) : mouseEvent.clientY);
			}
			rootView.addWindow(this);
			im.Utils.addEventListener(window, 'click', this._cl_globalClickHandler);
		}
		
		proto.close = function(){
			this.cl().application().removeWindow(this, false);
			im.Utils.removeEventListener(window, 'click', this._cl_globalClickHandler);
		}
		
		proto._cl_removeMenuView = function(){
			if (this._cl_menuView)
				this.removeSubView(this._cl_menuView, false);
			this._cl_menuView = null;
		}
		
		proto._cl_eBGClickHandler = function(e){
			this.close();
		}
});



a5.Package('a5.cl.ui.modals')
	.Import('a5.cl.ui.events.UIEvent',
			'a5.cl.ui.events.UIMouseEvent',
			'a5.cl.ui.buttons.UIButton',
			'a5.cl.ui.core.UIUtils')
	.Extends('a5.cl.CLWindow')
	.Static(function(UIInputHistoryList){
		UIInputHistoryList.open = function(input){
			return UIInputHistoryList.instance(true).open(input);
		}
		
		UIInputHistoryList.close = function(){
			return UIInputHistoryList.instance(true).close();
		}
		
		UIInputHistoryList.update = function(historyArray){
			return UIInputHistoryList.instance(true).update(historyArray);
		}
		
		UIInputHistoryList.nextItem = function(){
			return UIInputHistoryList.instance(true).nextItem();
		}
		
		UIInputHistoryList.previousItem = function(){
			return UIInputHistoryList.instance(true).previousItem();
		}
		
		UIInputHistoryList.selectedItem = function(){
			return UIInputHistoryList.instance(true).selectedItem();
		}
		
		UIInputHistoryList.isOpen = function(){
			return UIInputHistoryList.instance(true).isOpen();
		}
	})
	.Class('UIInputHistoryList', 'singleton', function(self, im){
		var optionGroup = this.create(a5.cl.ui.form.UIOptionGroup, ['inputHistoryList']),
			historyArray = [],
			input = null,
			isOpen = false,
			buttonCache = {},
			maxItems = 5;
		
		self.UIInputHistoryList = function(){
			self.superclass(this);
			this._cl_windowLevel = a5.cl.CLWindowLevel.CONTEXT;
			
			optionGroup.addEventListener(im.UIEvent.CHANGE, function(e){
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.CHANGE]));
			});
		}
		
		self.viewReady = function(){
			self.superclass().viewReady.apply(this, arguments);
			
			this.relY(true)
				.border(1)
				.backgroundColor('transparent')
				.height('auto');
		}
		
		self.open = function(_input){
			input = _input;
			//populate the list
			this.update(input.getHistory(true));
			
			if(!isOpen && historyArray.length > 0){
				//add the window to the view stack
				var rootView = this.cl().application().view(),
					globalPosition = im.UIUtils.getGlobalPosition(input.inputView(), rootView);
				this.x(globalPosition.left)
						.y(globalPosition.top + input.height())
						.width(input.inputView().width());
				rootView.addWindow(this);
				isOpen = true;
			}
		}
		
		self.close = function(){
			if (isOpen) {
				this.cl().application().removeWindow(this, false);
				isOpen = false;
				this.dispatchEvent(this.create(im.UIEvent, [im.UIEvent.CLOSE]));
			}
		}
		
		self.update = function(_history){
			historyArray = _history
			if (historyArray.length > 0) {
				this.removeAllSubViews(false);
				for (var x = 0, y = historyArray.length; x < y; x++) {
					this.addSubView(getListButton(historyArray[x]).data(x).selected(/*x === 0*/false));
				}
				//this.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.CHANGE]));
				optionGroup.selectedOption(null);
			} else {
				this.close();
			}
		}
		
		self.nextItem = function(){
			var curIndex = optionGroup.selectedOption() ? optionGroup.selectedOption().data() : -1;
			if(curIndex < historyArray.length - 1)
				buttonCache[historyArray[curIndex + 1]].selected(true);
		}
		
		self.previousItem = function(){
			var curIndex = optionGroup.selectedOption() ? optionGroup.selectedOption().data() : 0;
			//if on first one, close
			if (curIndex === 0) 
				this.close();
			else
				buttonCache[historyArray[curIndex - 1]].selected(true);
		}
		
		self.maximumVisibleItems = function(value){
			if(typeof value === 'number'){
				maxItems = value;
				return this;
			}
			return maxItems;
		}
		
		self.selectedItem = function(){
			return optionGroup.selectedOption().label();
		}
		
		self.isOpen = function(){
			return isOpen;
		}
		
		var getListButton = function(label){
			//if there's already a button with that label, return it from teh cache
			if(buttonCache[label])
				return buttonCache[label];
			//otherwise, create a new one
			var button = self.create(im.UIButton, [label]);
			button.width('100%').height(25)
				.upBorder({top:0, right:0, left:0, bottom:1}).overBorder({bottom:1}).downBorder({bottom:1}).selectedBorder({bottom:1})
				.upColor('#fff').overColor('#aaa').downColor('#aaa').selectedColor('#aaa')
				.optionGroup(optionGroup)
				.labelView()
					.width('100%')
					.alignX('left');
			//button.addEventListener(im.UIMouseEvent.MOUSE_OVER, eButtonHandler);
			button.addEventListener(im.UIMouseEvent.MOUSE_DOWN, eButtonHandler);
			buttonCache[label] = button;
			return button;
		}
		
		var eButtonHandler = function(e){
			e.target().selected(true);
		}
		
		self.dealloc = function(){
			this.removeAllSubViews(false);
			for(var prop in buttonCache){
				buttonCache[prop].destroy();
				delete buttonCache[prop];
			}
		}

});



/**
 * @class Presents the user with a modal text dialogue.
 * @name cl.mvc.ui.modals.UIAlert
 * @extends cl.mvc.ui.modals.UIModal
 */
a5.Package('a5.cl.ui.modals')
	.Import('a5.cl.ui.events.UIMouseEvent',
			'a5.cl.ui.buttons.UIButton',
			'a5.cl.ui.UITextField',
			'a5.cl.ui.UIContainer',
			'a5.cl.ui.UIFlexSpace')
	.Extends('UILightBox')
	.Prototype('UIAlert', function(proto, im, UIAlert){
		
		UIAlert.open = function(message, onContinue, onCancel){
			var inst = a5.Create(UIAlert);
			inst.open(message, onContinue, onCancel);
			return inst;
		}
		
		this.Properties(function(){
			this._cl_onContinue = null;
			this._cl_onCancel = null;
			this._cl_message = '';
			this._cl_callbackScope = null;
			
			this._cl_messageField = null;
			this._cl_continueButton = null;
			this._cl_cancelButton = null;
			this._cl_buttonHolder = null;
			this._cl_flexSpace = null;
		});
		
		proto.UIAlert = function(){
			proto.superclass(this);
			
			this.userCanClose(false)
				.border(1, 'solid', '#666', 5)
				.alpha(.25)
				.contentView()
					.relY(true)
					.padding(10)
					.height('auto')
					.width('100%').maxWidth(300);
			
			this._cl_messageField = this.create(im.UITextField).width('100%').height('auto').textAlign('center');
			this._cl_continueButton = this.create(im.UIButton).label("OK");
			this._cl_cancelButton = this.create(im.UIButton).label("Cancel");
			this._cl_buttonHolder = this.create(im.UIContainer).relX(true).width('100%').height('auto').y(15);
			this._cl_flexSpace = this.create(im.UIFlexSpace);
			
			this._cl_continueButton.addEventListener(im.UIMouseEvent.CLICK, this._cl_eContinueButtonHandler, false, this);
			this._cl_cancelButton.addEventListener(im.UIMouseEvent.CLICK, this._cl_eCancelButtonHandler, false, this);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			
			this._cl_contentView.addSubView(this._cl_messageField);
			this._cl_buttonHolder.addSubView(this._cl_flexSpace);
			this._cl_buttonHolder.addSubView(this._cl_cancelButton);
			this._cl_buttonHolder.addSubView(this.create(im.UIFlexSpace));
			this._cl_buttonHolder.addSubView(this._cl_continueButton);
			this._cl_buttonHolder.addSubView(this.create(im.UIFlexSpace));
			this._cl_contentView.addSubView(this._cl_buttonHolder);
		}
		
		proto.Override.open = function(message, onContinue, onCancel){
			proto.superclass().open.call(this);
			
			if(typeof message === 'string')
				this._cl_messageField.text(message);
			if(onContinue !== undefined)
				this._cl_onContinue = onContinue;
			if(onCancel !== undefined)
				this._cl_onCancel = onCancel;
			if(this._cl_onCancel === true || typeof this._cl_onCancel === 'function'){
				if(!this._cl_buttonHolder.containsSubView(this._cl_cancelButton))
					this._cl_buttonHolder.addSubViewAtIndex(this._cl_cancelButton, 0);
				if(!this._cl_buttonHolder.containsSubView(this._cl_flexSpace))
					this._cl_buttonHolder.addSubViewAtIndex(this._cl_flexSpace, 0);
			} else {
				if(this._cl_buttonHolder.containsSubView(this._cl_flexSpace))
					this._cl_buttonHolder.removeSubView(this._cl_flexSpace);
				if(this._cl_buttonHolder.containsSubView(this._cl_cancelButton))
					this._cl_buttonHolder.removeSubView(this._cl_cancelButton);
			}
		}
		
		proto.message = function(value){
			if(value !== undefined){
				this._cl_message = value;
				return this;
			}
			return this._cl_message;
		}
		
		proto.onContinue = function(value){
			if(value !== undefined){
				this._cl_onContinue = value;
				return this;
			}
			return this._cl_onContinue;
		}
		
		proto.onCancel = function(value){
			if(value !== undefined){
				this._cl_onCancel = value;
				return this;
			}
			return this._cl_onCancel;
		}
		
		proto.continueLabel = function(value){
			if(value !== undefined){
				this._cl_continueButton.label(value);
				return this;
			}
			return this._cl_continueButton.label();
		}
		
		proto.cancelLabel = function(value){
			if(value !== undefined){
				this._cl_cancelButton.label(value);
				return this;
			}
			return this._cl_cancelButton.label();
		}
		
		proto.callbackScope = function(value){
			if(value !== undefined){
				this._cl_callbackScope = value;
				return this;
			}
			return this._cl_callbackScope;
		}
		
		proto.messageField = function(){
			return this._cl_messageField;
		}
		
		proto.continueButton = function(){
			return this._cl_continueButton;
		}
		
		proto.cancelButton = function(){
			return this._cl_cancelButton;
		}
		
		proto._cl_eContinueButtonHandler = function(e){
			if(typeof this._cl_onContinue === 'function')
				this._cl_onContinue.call(this._cl_callbackScope);
			this.close();
		}
		
		proto._cl_eCancelButtonHandler = function(e){
			if(typeof this._cl_onCancel === 'function')
				this._cl_onCancel.call(this._cl_callbackScope);
			this.close();
		}
});



a5.Package('a5.cl.ui.list')
	.Import('a5.cl.ui.*',
			'a5.cl.ui.events.*',
			'a5.cl.ui.core.UIUtils',
			'a5.cl.*')
	.Extends('a5.cl.ui.UIAccordionPanel')
	.Prototype('UIListItem', function(proto, im){
		
		this.Properties(function(){
			this._cl_data = null;
			this._cl_subList = null;
			this._cl_expandable = false;
			this._cl_expandedSize = 40;
			this._cl_collapsedSize = 40;
			this._cl_pendingSubList = null;
		})
		
		proto.UIListItem = function(label, data){
			proto.superclass(this);
		}
				
		proto.Override.initHandle = function(){
			//create the clickable handle
			this._cl_handle = this.create(im.UIControl)
				.clickEnabled(true)
				.usePointer(true)
				.backgroundColor('#FFF', '#CCC')
				.border(1, 'solid', '#AAA')
				.width('100%')
				.height(this._cl_collapsedSize);
			this.addSubView(this._cl_handle);
			
			var self = this;
			this._cl_handle.addEventListener(im.UIMouseEvent.CLICK, function(e){
				self.dispatchEvent(self.create(im.UIEvent, [im.UIEvent.SELECT]));
			});
			
			//add the label to the handle
			this._cl_labelView = this.create(im.UITextField).x(15).width('-15').alignY('middle').nonBreaking(true);
			this._cl_handle.addSubView(this._cl_labelView);
			
			//add the twisty arrow for expandable sections
			this._cl_arrow = this.create(im.CLHTMLView).width(6).height(6).x(5).alignY('middle');
			this._cl_handle.addSubView(this._cl_arrow);
		}
		
		proto.Override.childrenReady = function(){
			for(var x = 0, y = this.subViewCount(); x < y; x++){
				var thisView = this.subViewAtIndex(x);
				if (thisView instanceof a5.cl.ui.list.UIListView && !this.subList()) {
					if(this._cl_accordion)
						this.subList(thisView);
					else
						this._cl_pendingSubList = thisView;
				}
			}
		}
		
		proto.Override.addedToParent = function(parent){
			if(!this._cl_accordion && parent instanceof a5.cl.ui.list.UIListView)
				this._cl_accordion = parent;
			if (this._cl_pendingSubList) {
				this.subList(this._cl_pendingSubList);
				this._cl_pendingSubList = null;
			}
		}
		
		proto.Override.expanded = function(){
			this._cl_updateArrow();
			if(this._cl_accordion && this._cl_accordion._cl_isSubList)
				this._cl_accordion._cl_parentList._cl_updatePanels();
		}
		
		proto.Override.collapsed = function(){
			this._cl_updateArrow();
			if(this._cl_accordion && this._cl_accordion._cl_isSubList)
				this._cl_accordion._cl_parentList._cl_updatePanels();
		}
		
		proto.Override.collapsible = function(value){
			var returnVal = proto.superclass().collapsible.call(this, value);
			if(typeof value === 'boolean'){
				this._cl_handle.clickEnabled(value).usePointer(value);
			}
			return returnVal;
		}
		
		proto.data = function(value){
			if (typeof value !== 'undefined') {
				this._cl_data = value;
				return this;
			}
			return this._cl_data;
		}
		
		proto.subList = function(value){
			if(value instanceof a5.cl.ui.list.UIListView){
				this._cl_subList = value;
				this.addSubView(value);
				value._cl_isSubList = true;
				value._cl_parentList = this._cl_accordion;
				value.y(this._cl_collapsedSize)
					.x(this._cl_accordion._cl_subListIndent)
					.subListIndent(this._cl_accordion._cl_subListIndent);
				value.width((0 - value.x()) + '');
				value.handleSize(this._cl_collapsedSize);
				this._cl_expandedSize = null; //flag the expandedSize so it's calculated on the fly
				this.collapsible(!!this._cl_accordion._cl_collapsibleSubLists);
			} else if(value === null || value === false){
				this.removeSubView(this._cl_subList);
				this._cl_expandedSize = this._cl_collapsedSize;
				this._cl_subList = null;
			}
			this._cl_updateArrow();
			return this._cl_subList;
		}
		
		proto.label = function(value){
			if(typeof value === 'string'){
				this._cl_labelView.text(value);
				return this;
			}
			return this._cl_labelView.text();
		}
		
		proto.expandable = function(){
			return (this._cl_subList instanceof a5.cl.ui.list.UIListView);
		}
		
		proto.Override.expandedSize = function(value){
			if(typeof value !== 'undefined' || this._cl_expandedSize !== null)
				return proto.superclass().expandedSize.call(this, value);
			else
				return (this._cl_collapsedSize + this._cl_subList.currentHeight());
		}
		
		proto.Override.collapsedSize = function(value){
			if(typeof value === 'undefined' && this._cl_collapsedSize === null)
				return this.expandedSize();
			var returnVal = proto.superclass().collapsedSize.call(this, value);
			if(value){
				this._cl_handle.height(this._cl_collapsedSize);
				if (this._cl_subList) {
					this._cl_subList.y(this._cl_collapsedSize);
					this._cl_subList.handleSize(this._cl_collapsedSize);
				} else this._cl_expandedSize = this._cl_collapsedSize;
			}
			return returnVal;
		}
		
		proto.handle = function(){
			return this._cl_handle;
		}
		
		proto.labelView = function(){
			return this._cl_labelView;
		}
		
		proto._cl_updateArrow = function(){
			this._cl_arrow.clearHTML();
			if(this.expandable() && this.collapsible()){
				var direction = this._cl_expanded ? 'down' : 'right';
				var triangle = im.UIUtils.drawTriangle(direction, '#666', 6, 6);
				this._cl_arrow.appendChild(triangle);
			}
		}
		
		proto.dealloc = function(){
			if(this._cl_subList)
				this._cl_subList._cl_isSubList = false;
			this._cl_destroyElement(this._cl_arrow);
			this._cl_subList = this._cl_arrow = null;
		}	
});


/**
 * @class 
 * @name a5.cl.ui.list.UIListView
 * @extends a5.cl.ui.UIAccordionView
 */
a5.Package('a5.cl.ui.list')
	.Import('a5.cl.ui.*',
			'a5.cl.ui.events.*')
	.Extends('UIAccordionView')
	.Prototype('UIListView', function(proto, im){
		
		proto.UIListView = function(){
			proto.superclass(this);
			this.direction(im.UIAccordionView.VERTICAL); //TODO: possibly make this an option
			this.fillView(false);
			this.singleSelection(false);
			this._cl_subListIndent = 15;
			this._cl_isSubList = false;
			this._cl_parentList = null;
			this._cl_collapsibleSubLists = true; 
			
			var self = this;
			this.addEventListener(im.UIEvent.SELECT, function(e){
				var targetItem = e.target();
				if(targetItem.subList() instanceof im.UIListView)
					self.dispatchEvent(self.create(im.UIListEvent, [targetItem.isExpanded() ? im.UIListEvent.ITEM_EXPANDED : im.UIListEvent.ITEM_COLLAPSED, true, targetItem]));
				else
					self.dispatchEvent(self.create(im.UIListEvent, [im.UIListEvent.ITEM_SELECTED, true, targetItem]));
				if(self._cl_isSubList)
					e.cancel();
			});
		}
		
		proto.Override.childrenReady = function(){
			//this._cl_locked(true);
			proto.superclass().childrenReady.call(this);
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				var thisPanel = this._cl_panels[x];
				thisPanel._cl_accordion = this;
				if(thisPanel._cl_subList)
					thisPanel._cl_subList._cl_parentList = this;
			}
		}
		
		/**
		 * 
		 * @param {a5.cl.ui.list.UIListItem} listItem
		 */
		proto.addItem = function(listItem){
			this.addItemAtIndex(listItem, this.subViewCount());
		}
		
		/**
		 * 
		 * @param {a5.cl.ui.list.UIListItem} listItem
		 * @param {Number} index
		 */
		proto.addItemAtIndex = function(listItem, index){
			if(listItem instanceof im.UIListItem){
				this._cl_locked(false);
				this.addPanelAtIndex(listItem, index);
				this._cl_locked(true);
			}
		}
		
		/**
		 * 
		 * @param {a5.cl.ui.list.UIListItem} listItem
		 */
		proto.removeItem = function(listItem, shouldDestroy){
			if(listItem instanceof im.UIListItem){
				this._cl_locked(false);
				this.removeSubView(listItem, shouldDestroy);
				this._cl_locked(true);
			}
		}
		
		/**
		 * 
		 * @param {Number} index
		 */
		proto.removeItemAtIndex = function(index, shouldDestroy){
			this.removeItem(this.subViewAtIndex(index), shouldDestroy);
		}
		
		/**
		 * 
		 */
		proto.removeAllItems = function(shouldDestroy){
			this._cl_locked(false);
			this.removeAllSubViews(shouldDestroy);
			this._cl_locked(true);
		}
		
		proto.currentHeight = function(){
			var h = 0;
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				var thisPanel = this._cl_panels[x];
				h += thisPanel.isExpanded() ? thisPanel.expandedSize() : thisPanel.collapsedSize();
			}
			if(this._cl_isSubList)
				this.height(h);
			return h;
		}
		
		/**
		 * How much to indent sub-lists.
		 * @param {Number} value
		 */
		proto.subListIndent = function(value){
			if(typeof value === 'number'){
				this._cl_subListIndent = value;
				return this;
			}
			return this._cl_subListIndent;
		}
		
		/**
		 * Whether or not sub-lists can be collapsed.  If false, the parent list item will not show the twirldown arrow, and will be locked in the expanded position.
		 * @param {Boolean} value
		 */
		proto.collapsibleSubLists = function(value){
			if(typeof value === 'boolean'){
				this._cl_collapsibleSubLists = value;
				return this;
			}
			return this._cl_collapsibleSubLists;
		}
		
		proto.Override.expandAllPanels = function(recursive){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				this.expandPanelAtIndex(x, recursive);
			}
		}
		
		proto.Override.expandPanelAtIndex = function(index, recursive){
			var expandedPanel = proto.superclass().expandPanelAtIndex.call(this, index);
			if(recursive === true && expandedPanel && expandedPanel.subList())
				expandedPanel.subList().expandAllPanels(true);
		}
		
		proto.Override.collapseAllPanels = function(recursive){
			for(var x = 0, y = this._cl_panels.length; x < y; x++){
				this.collapsePanelAtIndex(x, recursive);
			}
		}
		
		proto.Override.collapsePanelAtIndex = function(index, recursive){
			var collapsedPanel = proto.superclass().collapsePanelAtIndex.call(this, index);
			if(recursive === true && collapsedPanel && collapsedPanel.subList())
				collapsedPanel.subList().collapseAllPanels(true);
		}
		
		proto.dealloc = function(){
			
		}
});


/**
 * @class Represents a column within a UITableView. Note that UITableColumn is not a view, and will not be rendered.  It is used for accessing the properties of a column.
 * @name a5.cl.ui.table.UITableColumn
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.ui.*')
	
	.Prototype('UITableColumn', function(proto){
		
		proto.UITableColumn = function(){
			this._cl_resizable = true;
			this._cl_width = 'auto';
			this._cl_minWidth = 0;
		}
		
		proto.resizable = function(value){
			if(typeof value === 'boolean'){
				this._cl_resizable = value;
				return this;
			}
			return this._cl_resizable;
		}
		
		proto.width = function(value){
			if(typeof value === 'number' || typeof value === 'string'){
				this._cl_width = value;
				return this;
			}
			return this._cl_width;
		}
	});



/**
 * @class A view representing a single cell within a table.
 * @name a5.cl.ui.table.UITableCell
 * @extends a5.cl.CLViewContainer
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.*',
			'a5.cl.ui.*')
	.Extends('UIControl')
	.Prototype('UITableCell', function(proto, im){
		
		this.Properties(function(){
			this._cl_viewElementType = 'td';
			this._cl_defaultDisplayStyle = '';
			this._cl_contentWrapper = this.create(im.CLViewContainer);
		})
		
		proto.UITableCell = function(){
			proto.superclass(this);
			this._cl_rowIndex = -1;
			this._cl_columnIndex = -1;
			
			//TODO: add spanning
			this._cl_rowSpan = 1;
			this._cl_colSpan = 1;
			
			this._cl_viewElement.style.padding = '0';
			this._cl_contentWrapper.width('100%').height('auto');
			this._cl_contentWrapper._cl_defaultDisplayStyle = '';
			this._cl_viewElement.style.position = this._cl_contentWrapper._cl_viewElement.style.position = 'relative';
			this.addSubView(this._cl_contentWrapper);
			this._cl_childViewTarget = this._cl_contentWrapper;
		}
		
		proto.rowIndex = function(){
			return this._cl_rowIndex;
		}
		
		proto.columnIndex = function(){
			return this._cl_columnIndex;
		}
		
		proto.sortValue = function(){
			return 0; //default cell cannot be sorted.  Override this to enable sorting.
		}
		
		proto.Override._cl_render = function(){
			//proto.superclass()._cl_render.call(this);
		}
		
		proto.Override.padding = function(value){
			if (value !== undefined) {
				this._cl_contentWrapper.padding(value);
				return this;
			}
			return proto.superclass().padding.call(this, value);
		}
	});


/**
 * @class Acts as a cell within a UITableHeader.
 * @name a5.cl.ui.table.UITableHeaderCell
 * @extends a5.cl.ui.UIResizable
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.ui.*',
			'a5.cl.ui.events.*')
	.Extends('a5.cl.ui.table.UITableCell')
	.Static(function(UITableHeaderCell){
		UITableHeaderCell.ASCENDING = 'asc';
		UITableHeaderCell.DESCENDING = 'desc';
		
		UITableHeaderCell.sortAlpha = function(a, b){
			if(a === null || typeof a === 'undefined') a = "";
			if(b === null || typeof b === 'undefined') b = "";
			a = a + '';
			b = b + '';
			if(a < b) return -1;
			if(a > b) return 1;
			return 0;
		};
		
		UITableHeaderCell.sortAlphaCaseInsensitive = function(a, b){
			if(a === null || typeof a === 'undefined') a = "";
			if(b === null || typeof b === 'undefined') b = "";
			a = (a + '').toLowerCase();
			b = (b + '').toLowerCase();
			if(a < b) return -1;
			if(a > b) return 1;
			return 0;
		};
		
		UITableHeaderCell.sortNumeric = function(a, b){
			var returnVal = a - b;
			return (isNaN(returnVal) ? -1 : returnVal);
		}
	})
	.Prototype('UITableHeaderCell', function(proto, im, UITableHeaderCell){
		
		proto.UITableHeaderCell = function(label){
			this._cl_viewElementType = 'th';
			proto.superclass(this);
			this._cl_resizable = true;
			this._cl_sortable = false;
			this._cl_sortFunction = UITableHeaderCell.sortAlpha;
			this._cl_sortDirection = UITableHeaderCell.ASCENDING;
			this._cl_textField = this.create(im.UITextField);
			this._cl_sortArrow = this.create(a5.cl.CLHTMLView).width(8).height(8).alignX('right').alignY('middle').visible(false);
			this._cl_column = null;
			this._cl_columnIndex = 0;
			
			this.backgroundColor('#ddd').minWidth(5).minHeight(0).padding(3);
			
			this._cl_textField.width('100%').height('auto').alignY('middle').textAlign('center');
			this._cl_textField.addEventListener('CONTENT_UPDATED', function(e){
				this.redraw();
			}, false, this);
			if(typeof label === 'string')
				this._cl_textField.text(label);
				
			this.addSubView(this._cl_textField);
			this.addSubView(this._cl_sortArrow);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			//this.setCoordinates(['e']);
			
			this.addEventListener(im.UIMouseEvent.CLICK, function(e){
				//If we're already sorting on this column, flip the sort direction
				if(this._cl_sortArrow.visible())
					this._cl_sortDirection = (this._cl_sortDirection === UITableHeaderCell.ASCENDING ? UITableHeaderCell.DESCENDING : UITableHeaderCell.ASCENDING);
				this.dispatchEvent(this.create(im.UITableEvent, [im.UITableEvent.SORT_ROWS, false, this, this._cl_sortDirection]));
			}, false, this);
		}
		
		proto._cl_showSortArrow = function(direction){
			var arrowElement = a5.cl.ui.core.UIUtils.drawTriangle(direction === UITableHeaderCell.ASCENDING ? 'up' : 'down', '#aaa', 8, 8);
			this._cl_sortArrow.clearHTML().appendChild(arrowElement);
			this._cl_sortArrow.visible(true);
			this._cl_textField.width('-5');
		}
		
		proto._cl_hideSortArrow = function(){
			this._cl_sortArrow.visible(false);
			this._cl_textField.width('100%');
		}
		
		/**
		 * Gets or sets the column associated with this header cell.
		 * 
		 * @param {a5.cl.ui.table.UITablecolumn} value The column associated with this header cell.
		 */
		proto.column = function(value){
			if(value instanceof im.UITableColumn){
				this._cl_column = value;
				return this;
			}
			return this._cl_column;
		}
		
		/**
		 * Get or set the text label for this header cell.
		 * 
		 * @param {String} value The text label for this header cell.
		 */
		proto.label = function(value){
			if(typeof value === 'string'){
				this._cl_textField.text(value);
				return this;
			}
			return this._cl_textField.text();
		}
		
		/**
		 * Get or set the function used for sorting.
		 * <br />This function follows the same rules as sort functions for Array.sort(), but should always sort in ascending order.
		 * <br />The function takes two parameters, representing two items.
		 * If the first item should come before the second, return a number >= 1.
		 * If the first item should come after the second, return a number <= -1.
		 * If the order of these items is irrelevant, return 0.
		 * 
		 * @param {Function} value The function used for sorting
		 */
		proto.sortFunction = function(value){
			if(typeof value === 'function'){
				this._cl_sortFunction = value;
				return this;
			}
			return this._cl_sortFunction;
		}
		
		/**
		 * Get or set the direction in which this column is being sorted.
		 * <br /> Possible values are a5.cl.ui.table.UITableHeaderCell.ASCENDING and a5.cl.ui.table.UITableHeaderCell.DESCENDING.
		 * 
		 * @param {string} value The direction to sort in.  Possible values are a5.cl.ui.table.UITableHeaderCell.ASCENDING and a5.cl.ui.table.UITableHeaderCell.DESCENDING.
		 */
		proto.sortDirection = function(value){
			if(value === UITableHeaderCell.ASCENDING || value === UITableHeaderCell.DESCENDING){
				this._cl_sortDirection = value;
				return this;
			}
			return this._cl_sortDirection;
		}
		
		/**
		 * Get or set whether this header cell is user-resizable.
		 * 
		 * @param {Boolean} value If true, the user can resize the column associated with this header.
		 */
		proto.resizable = function(value){
			if(typeof value === 'boolean'){
				this._cl_resizable = value;
				//proto.superclass().enabled.call(this, value);
				return this;
			}
			return this._cl_resizable;
		}
		
		/**
		 * Get or set whether this header cell allows sorting.
		 * 
		 * @param {Boolean} value If true, the user can sort the table rows by clicking on this cell.
		 */
		proto.sortable = function(value){
			if(typeof value === 'boolean'){
				this._cl_sortable = value;
				this.usePointer(value).clickEnabled(value);
				return this;
			}
			return this._cl_sortable;
		}
		
		/**
		 * Retrieves the index of the column for which this cell is a header.
		 */
		proto.Override.columnIndex = function(){
			return this._cl_columnIndex;
		}
		
		proto.Override._cl_render = function(){
			
		}
		
		proto.Override.backgroundColor = function(value){
			return this._cl_contentWrapper.backgroundColor(value);
		}
		
		proto.dealloc = function(){
			this._cl_sortFunction = this._cl_textField = null;
		}
	});



/**
 * @class A table view, similar to an HTML table.
 * @name a5.cl.ui.table.UITableView
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.CLView',
			'a5.cl.ui.*',
			'a5.cl.ui.events.UITableEvent')
	.Extends('UIControl')
	
	.Prototype('UITableView', function(proto, im){
		
		this.Properties(function(){
			this._cl_viewElementType = 'table';
			this._cl_defaultDisplayStyle = '';
		})
		
		proto.UITableView = function(){
			proto.superclass(this);
			this._cl_rows = [];
			this._cl_cols = [];
			this._cl_header = null;
			this._cl_resizable = true;
			this._cl_defaultSortColumn = -1;
			this._cl_defaultSortDirection = im.UITableHeaderCell.ASCENDING;
			this._cl_defaultSortFunction = im.UITableHeaderCell.sortAlphaCaseInsensitive;
			this._cl_cellDividerColor = '#000';
			this._cl_cellDividerWidth = 1;
			
			this.border(1);
			this._cl_viewElement.style.borderCollapse = "collapse";
			
			this.width('100%').height('auto');//.relY(true);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			
			//listen for sort events
			this.addEventListener(im.UITableEvent.SORT_ROWS, this._cl_eSortHandler, true, this);
		}
		
		proto.Override.childrenReady = function(){
			proto.superclass().childrenReady.apply(this, arguments);
			//TODO: look for rows that were added by the ViewDef, and add them properly
			
		}
		
		proto._cl_eSortHandler = function(e){
			this.suspendRedraws(true);
			var rows = this._cl_rows.slice(this._cl_header ? 1 : 0);
			var columnIndex = e.headerCell().columnIndex();
			var sortFunction = e.headerCell().sortFunction();
			var sortDirection = e.sortDirection();
			if(this._cl_header){
				for(var x = 0, y = this._cl_header.cellCount(); x < y; x++){
					var thisCell = this._cl_header.getCellAtIndex(x);
					if(x === columnIndex)
						thisCell._cl_showSortArrow(sortDirection);
					else
						thisCell._cl_hideSortArrow();
				}
			}
			this._cl_sortRowArray(rows, sortFunction, columnIndex, sortDirection);
			this.removeAllRows(false, false);
			for(var x = 0, y = rows.length; x < y; x++){
				this.addRowAtIndex(rows[x], this._cl_rows.length);
			}
			this._cl_defaultSortColumn = columnIndex;
			this._cl_defaultSortFunction = sortFunction;
			this._cl_defaultSortDirection = sortDirection;
			this.suspendRedraws(false);
		}
		
		proto._cl_sortRowArray = function(rows, sortFunction, columnIndex, sortDirection){
			rows.sort(function(a, b){
				return sortFunction.call(
					null,
					a.getCellAtIndex(columnIndex).sortValue(),
					b.getCellAtIndex(columnIndex).sortValue()
				);
			});
			if(sortDirection === a5.cl.ui.table.UITableHeaderCell.DESCENDING)
				rows.reverse();
		}
		
		proto.Override._cl_redraw = function(force, suppressRender){
			var redrawVals = proto.superclass()._cl_redraw.call(this, true, false);
			im.CLView._cl_updateWH(this, this._cl_viewElement.offsetWidth, 'width', this.x(true), this._cl_minWidth, this._cl_maxWidth, this._cl_width);
			im.CLView._cl_updateWH(this, this._cl_viewElement.offsetHeight, 'height', this.y(true), this._cl_minHeight, this._cl_maxHeight, this._cl_height);
			
			/*if(redrawVals.shouldRedraw){
				var autoHeights = false;
				for(var x = 0, xl = this._cl_rows.length; x < xl; x++){
					var thisRow = this._cl_rows[x];
					if(thisRow._cl_autoHeight){
						autoHeights = true;
						var maxRowHeight = 0;
						for(var y = 0, yl = thisRow.cellCount(); y < yl; y++){
							var cellHeight = thisRow.getCellAtIndex(y).height('scroll');
							if(cellHeight > maxRowHeight)
								maxRowHeight = cellHeight;
						}
						thisRow._cl_height.auto = thisRow._cl_height.percent = thisRow._cl_height.relative = false;
						thisRow._cl_height.value = maxRowHeight;
					}
				}
				if(autoHeights){
					for (var i = 0, l = this.subViewCount(); i < l; i++) 
						this.subViewAtIndex(i)._cl_redraw(true, true);
					proto.superclass()._cl_redraw.call(this, force, true);
				}
				
				if(suppressRender !== true) 
					this._cl_render();
			}*/
		}
		
		proto._cl_updateColumnWidths = function(){
			var defaultWidth = 100 / this._cl_cols.length + '%',
				thisCell, thisColummn, thisRow, x, xl, y, yl;
			for(x = 0, xl = this._cl_rows.length; x < xl; x++){
				thisRow = this._cl_rows[x];
				for(y = 0, yl = thisRow.cellCount(); y < yl; y++){
					thisCell = thisRow.getCellAtIndex(y);
					thisColummn = this._cl_cols[y];
					thisCell.width(defaultWidth);
					thisCell.border({top:x > 0 ? this._cl_cellDividerWidth : 0, left:y > 0 ? this._cl_cellDividerWidth : 0, right:0, bottom:0}, 'solid', this._cl_cellDividerColor);
				}
			}
		}
		
		/**
		 * Add a UITableHeader row to the table.  If a header has already been added, the existing header will be replaced with the new one.
		 * 
		 * @param {a5.cl.ui.table.UITableHeader} header The header row to add to the table.
		 */
		proto.addHeader = function(header){
			this.addRowAtIndex(header, 0);
		}
		
		/**
		 * Removes the header row from the table
		 * 
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 * @return {a5.cl.ui.table.UITableHeader} Returns the header that was removed.
		 */
		proto.removeHeader = function(shouldDestroy){
			this.removeRow(this._cl_header, shouldDestroy);
		}
		
		/**
		 * Retrieves the UITableHeader for this table.
		 * 
		 * @return {a5.cl.ui.table.UITableHeader} The current header for this table.
		 */
		proto.getHeader = function(){
			return this._cl_header;
		}
				
		/**
		 * Add a UITableRow to this table.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to add.
		 */
		proto.addRow = function(row){
			var index = this._cl_rows.length,
				rows, x, y;
			//if there's a default sort column, determine where to add the new row
			if(this._cl_defaultSortColumn >= 0 && (this._cl_defaultSortColumn < this._cl_cols.length || this._cl_defaultSortColumn < row.cellCount())){
				rows = this._cl_rows.slice(this._cl_header ? 1 : 0);
				rows.push(row);
				this._cl_sortRowArray(rows, this._cl_defaultSortFunction, this._cl_defaultSortColumn, this._cl_defaultSortDirection);
				for(x = 0, y = rows.length; x < y; x++){
					if(rows[x] === row){
						index = x;
						break;
					}
				}
			}
			this.addRowAtIndex(row, index);
		}
		
		/**
		 * Add a UITableRow to this table, at the specified index.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to add.
		 * @param {Number} index The index at which to add to the row.
		 */
		proto.addRowAtIndex = this.Attributes(
		["a5.Contract", {row:'a5.cl.ui.table.UITableRow', index:'number'}], 
		function(args){
			if(!args) return;
			var row = args.row,
				index = args.index;
			//add the row
			if(row instanceof a5.cl.ui.table.UITableHeader){
				var isHeader = true;
				index = 0;
			} else if(this._cl_header){
				index++;
			}
			this._cl_rows.splice(index, 0, row);
			this.addSubViewAtIndex(row, index);
			if(isHeader){
				if(this._cl_header)
					this.removeHeader();
				this._cl_header = row;
				for(var x = 0, y = row.cellCount(); x < y; x++){
					var thisCell = row.getCellAtIndex(x);
					if(thisCell.column())
						this._cl_cols.splice(x, 1, thisCell.column());
					else if(this._cl_cols[x])
						thisCell.column(this._cl_cols[x]);
					if(!this._cl_resizable)
						thisCell.resizable(false);
				}
			}
			//add any columns that are needed
			for(var x = this._cl_cols.length, y = row.cellCount(); x < y; x ++){
				var newCol = a5.Create(a5.cl.ui.table.UITableColumn);
				this.addColumn(newCol);
			}
			this._cl_updateColumnWidths();
		})
		
		/**
		 * Remove a row from this table.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to remove.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeRow = function(row, shouldDestroy){
			for(var x = 0, y = this._cl_rows.length; x < y; x++){
				var thisRow = this._cl_rows[x];
				if(thisRow === row)
					return this.removeRowAtIndex(x, shouldDestroy);
			}
		}
		
		/**
		 * Remove a row from this table, at the specified index.
		 * 
		 * @param {Number} index The index of the row to remove.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeRowAtIndex = function(index, shouldDestroy){
			if(index < 0 || index >= this._cl_rows.length) return;
			
			this._cl_rows.splice(index, 1);
			this.removeViewAtIndex(index, shouldDestroy !== false);
		}
		
		/**
		 * Removes all of the rows from the table.  By default, the headers are not removed.  To remove the headers, set the removeHeaders parameter to true.
		 * 
		 * @param {Boolean} [removeHeaders=false] If set to true, the headers are removed as well.  Defaults to false.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeAllRows = function(removeHeaders, shouldDestroy){
			for(var x = this._cl_rows.length - 1, y = this._cl_header ? 1 : 0; x >= y; x--){
				this.removeRowAtIndex(x, shouldDestroy);
			}
			if(removeHeaders === true && this._cl_header){
				this.removeHeader(shouldDestroy);
			}
		}
		
		/**
		 * Add a column to this table. Note that this is purely informational, and does not actually add any cells.
		 * 
		 * @param {a5.cl.ui.table.UITableColumn} column The column to add.
		 */
		proto.addColumn = this.Attributes(
		["a5.Contract", {column:'a5.cl.ui.table.UITableColumn'}], 
		function(args){
			if (args) {
				if(this._cl_header && this._cl_header.getCellAtIndex(this._cl_cols.length))
					this._cl_header.getCellAtIndex(this._cl_cols.length).column(args.column);
				this._cl_cols.push(args.column);
			}
		})
		
		/**
		 * Remove a column from this table. This will remove the cells associated with the specified column.
		 * 
		 * @param {a5.cl.ui.table.UITableColumn} column The column to remove.
		 */
		proto.removeColumn = function(column){
			
		}
		
		/**
		 * Remove a column from this table, at the specified index. This will remove the cells associated with the specified column.
		 * 
		 * @param {Number} index The index of the column to remove.
		 */
		proto.removeColumnAtIndex = function(index){
			
		}
		
		
		/**
		 * Retrieve the row at the specified index.
		 * 
		 * @param {Number} index The index of the row to retrieve.
		 * @return {a5.cl.ui.table.UITableRow} The row that was retrieved.
		 */
		proto.getRowAtIndex = function(index){
			return this._cl_rows[index];
		}
		
		/**
		 * Retrieve the column at the specified index.
		 * 
		 * @param {Number} index The index of the column to retrieve.
		 * @return {a5.cl.ui.table.UITableColumn} The column that was retrieved.
		 */
		proto.getColumnAtIndex = function(index){
			return this._cl_cols[index];
		}
		
		/**
		 * Get the total number of rows in the table.
		 * 
		 * @return {Number} The total number of rows in the table.
		 */
		proto.rowCount = function(){
			return this._cl_rows.length;
		}
		
		/**
		 * Get the total number of columns in the table.
		 * 
		 * @return {Number} The total number of columns in the table.
		 */
		proto.columnCount = function(){
			return this._cl_cols.length;
		}
		
		/**
		 * Disables column resizing for all columns.
		 */
		proto.disableResize = function(){
			this._cl_resizable = false;
			if(this._cl_header){
				for(var x = 0, y = this._cl_header.cellCount(); x < y; x++){
					this._cl_header.getCellAtIndex(x).resizable(false);
				}
			}
			return this;
		}
		
		/**
		 * Allows columns to be resizable.  Note that this does not explicitly set resizable to true for any of the columns.
		 */
		proto.enableResize = function(){
			this._cl_resizable = true;
			return this;
		}
		
		/**
		 * Get or Set the default column index to sort on. Defaults to -1, which is no default sorting.
		 * 
		 * @param {Number} value The index of the column to sort on by default.
		 */
		proto.defaultSortColumn = function(value){
			if(typeof value === 'number'){
				this._cl_defaultSortColumn = Math.floor(value);
				return this;
			}
			return this._cl_defaultSortColumn;
		}
		
		/**
		 * Get or Set the default sort direction.  Defaults to ascending.
		 * 
		 * @param {Number} value The direction to sort by default.
		 */
		proto.defaultSortDirection = function(value){
			if(value === a5.cl.ui.table.UITableHeaderCell.ASCENDING || value === a5.cl.ui.table.UITableHeaderCell.DESCENDING){
				this._cl_defaultSortDirection = value;
				return this;
			}
			return this._cl_defaultSortDirection;
		}
		
		/**
		 * Get or Set the default sort function. Defaults to a case-insensitive alphabetical sort.
		 * 
		 * @param {Number} value The sort function to use.
		 */
		proto.defaultSortFunction = function(value){
			if(typeof value === 'function'){
				this._cl_defaultSortFunction = value;
				return this;
			}
			return this._cl_defaultSortFunction;
		}
	});



a5.Package('a5.cl.ui.table')
	.Extends('a5.cl.ui.UIHTMLControl')
	.Prototype('UIHtmlTable', function(proto, im){
		
		proto.UIHtmlTable = function(){
			proto.superclass(this);
			this._cl_rows = [];
			this._cl_cols = [];
			this._cl_header = null;
			this._cl_cellDividerColor = '#000';
			this._cl_cellDividerWidth = 1;
			this._cl_table = document.createElement('table');
			this._cl_table.setAttribute('border', '1');
			this._cl_table.style.borderCollapse = "collapse";
			
			this.width('auto').height('auto');//.border(1, 'solid', '#000');
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			
			this.appendChild(this._cl_table);
		}
		
		/**
		 * Add a UITableHeader row to the table.  If a header has already been added, the existing header will be replaced with the new one.
		 * 
		 * @param {a5.cl.ui.table.UITableHeader} header The header row to add to the table.
		 */
		proto.addHeader = function(header){
			this.addRowAtIndex(header, 0);
		}
		
		/**
		 * Removes the header row from the table
		 * 
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 * @return {a5.cl.ui.table.UITableHeader} Returns the header that was removed.
		 */
		proto.removeHeader = function(shouldDestroy){
			this.removeRow(this._cl_header, shouldDestroy);
		}
		
		/**
		 * Retrieves the UITableHeader for this table.
		 * 
		 * @return {a5.cl.ui.table.UITableHeader} The current header for this table.
		 */
		proto.getHeader = function(){
			return this._cl_header;
		}
				
		/**
		 * Add a UITableRow to this table.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to add.
		 */
		proto.addRow = function(row){
			this.addRowAtIndex(row, this._cl_rows.length);
		}
		
		/**
		 * Add a UITableRow to this table, at the specified index.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to add.
		 * @param {Number} index The index at which to add to the row.
		 */
		proto.addRowAtIndex = this.Attributes(
		["a5.Contract", {row:'a5.cl.ui.table.UITableRow', index:'number'}], 
		function(args){
			if(!args) return;
			//add the row
			if(args.row instanceof a5.cl.ui.table.UITableHeader){
				var isHeader = true;
				args.index = 0;
			} else if(this._cl_header){
				args.index++;
			}
			var rowElement = args.row.toHTML();
			if(args.index < this._cl_rows.length)
				this._cl_table.insertBefore(rowElement, this._cl_rows[args.index]);
			else
				this._cl_table.appendChild(rowElement);
			this._cl_rows.splice(args.index, 0, rowElement);
			
			this._cl_replaceNodeValue(this._cl_viewElement, this._cl_table);
		})
		
		/**
		 * Remove a row from this table.
		 * 
		 * @param {a5.cl.ui.table.UITableRow} row The row to remove.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeRow = function(row){
			for(var x = 0, y = this._cl_rows.length; x < y; x++){
				var thisRow = this._cl_rows[x];
				if(thisRow === row)
					return this.removeRowAtIndex(x);
			}
		}
		
		/**
		 * Remove a row from this table, at the specified index.
		 * 
		 * @param {Number} index The index of the row to remove.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeRowAtIndex = function(index){
			if(index < 0 || index >= this._cl_rows.length) return;
			
			var removedRow = this._cl_rows.splice(index, 1)[0];
			this._cl_table.removeChild(removedRow);
		}
		
		/**
		 * Removes all of the rows from the table.  By default, the headers are not removed.  To remove the headers, set the removeHeaders parameter to true.
		 * 
		 * @param {Boolean} [removeHeaders=false] If set to true, the headers are removed as well.  Defaults to false.
		 * @param {Boolean} [shouldDestroy=true] If set to false, the rows will not be destroyed after they're removed.
		 */
		proto.removeAllRows = function(removeHeaders){
			for(var x = this._cl_rows.length - 1, y = this._cl_header ? 1 : 0; x >= y; x--){
				this.removeRowAtIndex(x);
			}
			if(removeHeaders === true && this._cl_header){
				this.removeHeader();
			}
		}
		
		/**
		 * Retrieve the row at the specified index.
		 * 
		 * @param {Number} index The index of the row to retrieve.
		 * @return {a5.cl.ui.table.UITableRow} The row that was retrieved.
		 */
		proto.getRowAtIndex = function(index){
			return this._cl_rows[index];
		}
		
		/**
		 * Get the total number of rows in the table.
		 * 
		 * @return {Number} The total number of rows in the table.
		 */
		proto.rowCount = function(){
			return this._cl_rows.length;
		}
});



/**
 * @class Represents a row of cells within a UITableView.
 * @name a5.cl.ui.table.UITableRow
 * @extends a5.cl.ui.UIControl
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.ui.*')
	.Extends('UIControl')
	
	.Prototype('UITableRow', function(proto, im){
		
		this.Properties(function(){
			this._cl_viewElementType = 'tr';
			this._cl_defaultDisplayStyle = '';
		})
		
		proto.UITableRow = function(){
			proto.superclass(this);
			this._cl_cells = [];
			this.height('auto').relX(true);
			this._cl_autoHeight = true;
			
			this._cl_viewElement.style.position = 'relative';
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
		}
		
		proto.toHTML = function(){
			var tr = document.createElement('tr');
			for(var x = 0, y = this._cl_cells.length; x < y; x++){
				var td = document.createElement('td'),
					thisCell = this._cl_cells[x];
				if(thisCell instanceof a5.cl.ui.table.UITextCell)
					td.innerHTML = thisCell.text();
				tr.appendChild(td);
			}
			return tr;
		}
		
		proto.staticHeight = function(value){
			if(typeof value !== 'undefined')
				this._cl_autoHeight = value === 'auto';
			return proto.superclass().height.call(this, value);
		}
		
		/**
		 * Add a cell to the end of this row.
		 * 
		 * @param {a5.cl.ui.list.UITableCell} cell The cell to add.
		 */
		proto.addCell = function(cell){
			this.addCellAtIndex(cell, this._cl_cells.length);
		}
		
		/**
		 * Add a cell to this row, at the specified index.
		 * 
		 * @param {a5.cl.ui.list.UITableCell} cell The cell to add.
		 * @param {Number} index The index at which to add the cell.
		 */
		proto.addCellAtIndex = this.Attributes(
		["a5.Contract", {cell:'a5.cl.ui.table.UITableCell', index:'number'}], 
		function(args){
			if(args){
				this._cl_cells.splice(args.index, 0, args.cell);
				this.addSubViewAtIndex(args.cell, args.index);
			}
		})
		
		/**
		 * Remove a cell from this row.
		 * 
		 * @param {a5.cl.ui.list.UITableCell} cell The cell to remove.
		 * @return {a5.cl.ui.table.UITableCell} Returns the cell that was removed.
		 */
		proto.removeCell = function(cell){
			for(var x = 0, y = this._cl_cells.length; x < y; x++){
				var thisCell = this._cl_cells[x];
				if(thisCell === cell)
					return this.removeCellAtIndex(x);
			}
			return null;
		}
		
		/**
		 * Remove the cell at the specified index.
		 * 
		 * @param {Number} index The index of the cell to be removed.
		 * @return {a5.cl.ui.table.UITableCell} Returns the cell that was removed.
		 */
		proto.removeCellAtIndex = function(index){
			this.removeSubView(this._cl_cells[index]);
			return this._cl_cells.splice(index, 1)[0];
		}
		
		/**
		 * Retrieve the cell at the specified index.
		 * 
		 * @param {Number} index The index of the cell to retrieve.
		 */
		proto.getCellAtIndex = function(index){
			if(index < 0 || index >= this._cl_cells.length) return;
			return this._cl_cells[index];
		}
		
		/**
		 * Returns the total number of cells that are in this row.
		 */
		proto.cellCount = function(){
			return this._cl_cells.length;
		}
		
		proto.Override.addedToParent = function(parentView){
			proto.superclass().addedToParent.apply(this, arguments);
			if(!(parentView instanceof im.UITableView))
				throw 'Error: instances of UITableRow must not be added to a parent view other than an instance of UITableView.';
		}
		
		proto.Override._cl_render = function(){
			//proto.superclass()._cl_render.call(this);
			this._cl_currentViewElementProps = this._cl_pendingViewElementProps;
			this._cl_pendingViewElementProps = {};
			this.viewRedrawn();
		}
	});


/**
 * @class The header row within a UITableView.  This is like a UITableRow, but can only contain UITableHeaderCells.
 * @name a5.cl.ui.table.UITableHeader
 * @extends a5.cl.ui.table.UITableRow
 */
a5.Package('a5.cl.ui.table')
	.Import('a5.cl.ui.*')
	.Extends('UITableRow')
	
	.Prototype('UITableHeader', function(proto, im){
		
		this.Properties(function(){
			this._cl_viewElementType = 'thead';
		})
		
		proto.UITableHeader = function(){
			proto.superclass(this);
		}
		
		proto.Override.toHTML = function(){
			var thead = document.createElement('thead');
			for(var x = 0, y = this._cl_cells.length; x < y; x++){
				var th = document.createElement('th'),
					thisCell = this._cl_cells[x];
				th.innerHTML = thisCell.label();
				th.style.backgroundColor = "#ddd";
				thead.appendChild(th);
			}
			return thead;
		}
		
		/**
		 * Add a header cell to the end of this header row.
		 * 
		 * @param {a5.cl.ui.list.UITableHeaderCell} cell The header cell to add.
		 */
		proto.Override.addCell = function(cell){
			this.addCellAtIndex(cell, this._cl_cells.length);
		}
		
		/**
		 * Add a header cell to this header row, at the specified index.
		 * 
		 * @param {a5.cl.ui.list.UITableHeaderCell} cell The header cell to add.
		 * @param {Number} index The index at which to add the header cell.
		 */
		proto.Override.addCellAtIndex = this.Attributes(
		["a5.Contract", {cell:'a5.cl.ui.table.UITableHeaderCell', index:'number'}], 
		function(args){
			if(args){
				this._cl_cells.splice(args.index, 0, args.cell);
				this.addSubViewAtIndex(args.cell, args.index);
				args.cell._cl_columnIndex = args.index;
			}
		})
	});


a5.Package('a5.cl.ui.table')
	.Import('a5.cl.ui.*')
	.Extends('UITableCell')
	
	.Prototype('UITextCell', function(proto, im){
		
		proto.UITextCell = function(text){
			proto.superclass(this);
			this._cl_textField = this.create(im.UITextField)
				.width('100%').height('auto').alignY('middle');
			this._cl_textField.addEventListener('CONTENT_UPDATED', function(e){
				this.redraw();
			}, false, this);
			if(typeof text === 'string')
				this._cl_textField.text(text);
		}
		
		proto.Override.viewReady = function(){
			proto.superclass().viewReady.apply(this, arguments);
			this.addSubView(this._cl_textField);
		}
		
		proto.text = function(value){
			if (value !== undefined) {
				this._cl_textField.text(value + '');
				return this;
			}
			return this._cl_textField.text();
		}
		
		proto.Override.sortValue = function(){
			return this.text();
		}
		
		proto.textField = function(){
			return this._cl_textField;
		}
		
		proto.dealloc = function(){
			this._cl_textField = null;
		}
	});



})(a5);


a5.Package('apps.docs.controllers')

	.Extends('a5.cl.CLController')
	.Class('ClassListController', function(self){
		
		self.ClassListController = function(){
			self.superclass(this, ['ClassList.xml']);
		}
		
		self.Override.viewReady = function(){
			self.superclass().viewReady.apply(this, arguments);
			self.view().width('100%');
		}
});



a5.Package('apps.docs.controllers')

	.Extends('a5.cl.CLController')
	.Class('ContentController', function(cls, im){
		
		cls.ContentController = function(){
			cls.superclass(this, arguments);
		}
		
		cls.Override.viewReady = function(){
			var inhMethBtn = cls.view().getChildView('inheritedMethodsBtn');
			if(inhMethBtn)
				inhMethBtn.addEventListener(a5.cl.ui.events.UIMouseEvent.CLICK, eInhMethodsHandler);
			cls.MVC().application().view().redraw(true); 
		}
		
		var eInhMethodsHandler = function(e){
			cls.view().getChildView('inheritedMethods').show();
			cls.view().getChildView('inheritedMethodsBtn').hide();
			cls.MVC().application().view().redraw(true); 
		}
		
});


a5.Package('apps.docs.controllers')
	
	.Import('a5.cl.ui.events.*')
	.Extends('a5.cl.ui.controllers.UISplitViewController')
	.Class('MainController', function(cls, im){
		
		var clr = null;
		
		cls.MainController = function(){
			cls.superclass(this, arguments);
		}
		
		this.content = function(id){
			cls.contentView().removeAllSubViews();
			if(clr)
				clr.destroy();
			clr = cls.create(im.ContentController, [id]);
			/*cls.cl().include('views/'+ id, function(xml){
				console.log(xml.replace(/\>/g, '>\n'));
			});*/
			clr.render(function(){
				cls.contentView().addSubView(clr.view());
				cls.view().redraw();
			})
		}
		
		this.Override.viewReady = function(){
			cls.superclass().viewReady.apply(this, arguments);
			var classListController = cls.create(im.ClassListController);
			cls.menuView().scrollYEnabled(true);
			cls.menuView().setCoordinates(['e']);
			cls.contentView().scrollYEnabled(true);
			cls.contentView().addEventListener(im.UIMouseEvent.CLICK, eClickHandler);
			classListController.render(function(){
				cls.menuView().addSubView(classListController.view());
				//TODO: addrress redraw in list view
				setTimeout(function(){ cls.MVC().application().view().redraw(true);}, 500); 
				classListController.view().addEventListener(im.UIListEvent.ITEM_SELECTED, eItemSelectedHandler);
			});
		}
		
		var eClickHandler = function(e){
			if(e.target() instanceof a5.cl.ui.UILink){
				var txt = e.target().text();
				cls.redirect(txt.substring(txt.lastIndexOf(' ') + 1).replace(/\./g, '_'));
			}
		}
		
		var eItemSelectedHandler = function(e){
			cls.redirect(e.listItem().data());
		}
	
});


a5.Package('apps.docs')

	.Extends('a5.cl.CLMain')
	.Class('Main', function(cls, im){
		
		cls.Main = function(){
			cls.superclass(this);
			cls.setConfig({
				dependencies:[
					'views/doc.xml'
				]
			});
			
			cls.setPluginConfig('MVC', {
				rootController:'Main'
			})
		}
		
		cls.Override.pluginsLoaded = function(){
			cls.setMappings({desc:':id', controller:'Main', action:'content'})
		}
})

a5.cl.CreateApplication();