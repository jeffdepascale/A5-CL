//A5, Copyright (c) 2011, Jeff dePascale & Brian Sutliffe. http://www.jeffdepascale.com
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
		 * @name isStableRelease
		 * @type String
		 * @returns The build date of the release of A5.
		 */
		isStableRelease:function(){
			return false;
		},
		
		/**
		 * @name releaseType
		 * @type String
		 * @returns Release type of A5.
		 */
		releaseType:function(){
			return 'alpha';
		},
		
		/**
		 * @name isPublicRelease
		 * @type Boolean
		 * @returns Whether the build is a public release or ongoing development build.
		 */
		isPublicRelease:function(){
			return false;
		},
		
		/**
		 * @name versionInfo
		 * @type String
		 * @returns A string containing version info for A5, comprised of all version related release properties.
		 */
		versionInfo:function(){
			return ('A5 - version ' + this.version() + ', ' + this.releaseType() + ', ' + this.buildDate() + '. ' + (this.isPublicRelease() ? 'Public release':'Development build') + '. ' + (this.isStableRelease() ? 'Stable release':'Unstable release') + '.');
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
	
	createAttribute = function(scope, args){
		var attributes = Array.prototype.slice.call(args),
			method, i, j, k, l, t,
			attrObj = {};
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
					var isError = false;
					if(t !== 'string'){
						if(t === 'function'){
							if(!attr.isA5 || !attr.doesExtend(a5.Attribute))
								isError = true;
						} else
							isError = true;
					} else {
						var cls = a5.GetNamespace(attr, scope.imports());
						if(!cls)
							cls = a5.GetNamespace(attr + 'Attribute', scope.imports());
						if(cls)
							attrDef[j] = cls;
						else
							isError = true;
					}
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
				attrClasses = [], 
				executionScope = this,
				callOriginator,
				count = 0;
			if(method)
				for(var prop in proxyFunc)
					method[prop] = proxyFunc[prop];
			if (proxyFunc.caller.getClassInstance !== undefined)
				callOriginator = proxyFunc.caller;
			for(var i = 0, l = attributes.length; i<l; i++){
				var cls = attributes[i][0],
					clsInst = cls.instance(true),
					props = attributes[i][1];
				attrClasses.push({cls:clsInst, props:props});
			}
			
			var processCB = function(args, isPost, preArgs){
				processAttribute(count, args, isPost, preArgs);
			},
			
			processAttribute = function(id, args, isPost, preArgs){
				if (args) {
					if (Object.prototype.toString.call(args) !== '[object Array]') 
						args = [args];
				} else {
					args = [];
				}
				if(!preArgs)
					preArgs = args;
				if (id >= attrClasses.length) {
					if (isPost) {
						return args[0];
					} else 						
						return processPost(args, preArgs);
				}
				var ret, 
					isPost = isPost || false,
					isAsync = false,
					callback = function(_args){
						processCB.call(this, _args || args, isPost, preArgs);	
					}	
					ret = attrClasses[id].cls["method" + (isPost ? "Post" : "Pre")](attrClasses[id].props, args, executionScope, proxyFunc, callback, callOriginator, preArgs);
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
					return a5.ThrowError(308, null, {prop:prop, method:isPost ? 'methodPost' : 'methodPre'});
				count = id+1;
				if(!isAsync)
					return processAttribute(count, ret, isPost, args, preArgs);
			},
			
			processPost = function(args, preArgs){
				count = 0;
				var postRet = method ? method.apply(executionScope, args) : args.length ? args[0] : undefined;
				return processAttribute(0, postRet, true, preArgs);
			},		
			
			preRet = processAttribute(count, Array.prototype.slice.call(arguments));
			return preRet;
		}
		proxyFunc._a5_attributes = attrObj;
		return proxyFunc;
	},
	
	createAttribs = function(){
		for(i = 0, l=a5.Attribute._extenderRef.length; i<l; i++)
			a5.Create(a5.Attribute._extenderRef[i]);
	},
	
	processInstance = function(cls){
		var attrs = cls.getClass().getAttributes();
		//process instanceProcess, return
		return cls;
	}
	
	return {
		createAttribute:createAttribute,
		processInstance:processInstance
	}
});


a5.SetNamespace('a5.core.classBuilder', true, function(){
	
	var packageQueue = [],
		delayProtoCreation = false,
		queuedPrototypes = [],
		queuedImplementValidations = [],
		prop;
	
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
		
		Mixin = function(str, $cls){
			clsName = str;
			cls = $cls,
			isMixin = true;
			process();
		},
		
		Enum = function(name, func){
			clsName = name;
			enumDeclaration = func;
			process();			
		},
		
		Class = function(str, $cls, $prop3){
			clsName = str;
			var hasType = (typeof $cls === 'string');
			cls = hasType ? $prop3:$cls;
			type = hasType ? $cls:undefined;
			process();
		},
		
		Prototype = function(str, $cls, $prop3){
			isProto = true;
			clsName = str;
			var hasType = (typeof $cls === 'string');
			proto = hasType ? $prop3:$cls;
			type = hasType ? $cls:undefined;
			process();
		}
		
		a5.SetNamespace(pkg);
		
		return {Enum:Enum, Static:Static, Import:Import, Extends:Extends, Mixin:Mixin, Mix:Mix, Implements:Implements, Class:Class, Prototype:Prototype, Interface:Interface};
	},
	
	Extend = function(namespace, base, clsDef, type, isInterface, isProto, imports, mixins){
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
			obj = Extend(pkgObj.pkg + '.' + pkgObj.clsName, base, pkgObj.cls, pkgObj.type, pkgObj.isInterface, pkgObj.isProto, imports, pkgObj.mixins),
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
					if (typeof obj === 'function' && obj.namespace != undefined && retObj[prop] === undefined) retObj[prop] = obj;
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
						processObj(pkg);
					} else {
						clsName = dotIndex > -1 ? str.substr(dotIndex + 1) : str;
						var obj = a5.GetNamespace(str);
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
		instance:function(autoCreate){
			if (autoCreate === true)
				return this._a5_instance || a5.Create(this);
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
					if (descenderRef.constructor._a5_protoProps !== undefined) {
						var ref = {};
						descenderRef.constructor._a5_protoProps.call(ref);
						if (ref[prop] !== undefined)
							return true;
					}
					descenderRef = descenderRef.constructor.superclass && 
									descenderRef.constructor.superclass().constructor.namespace ? 
									descenderRef.constructor.superclass() : null;
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
					mixinRef,					prop,
					i, l;
				while (descenderRef !== null) {
					mixinRef = descenderRef.constructor._mixinRef;
					if(mixinRef && mixinRef.length){
						for (i = 0, l = mixinRef.length; i < l; i++)
							if(mixinRef[i]._mixinDef.dealloc != undefined)
								mixinRef[i]._mixinDef.dealloc.call(this);
					}
					if (descenderRef.constructor.namespace) {
						nextRef = descenderRef.constructor.superclass ? descenderRef.constructor.superclass() : null;
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
					if (descenderRef.constructor._a5_protoPrivateProps !== undefined) {
						this._a5_privatePropsRef[descenderRef.namespace()] = {};
						descenderRef.constructor._a5_protoPrivateProps.call(this._a5_privatePropsRef[descenderRef.namespace()]);
					}
					if(descenderRef.constructor._a5_protoProps !== undefined)
						protoPropRef.unshift(descenderRef.constructor._a5_protoProps);
						
					descenderRef = descenderRef.constructor.superclass && 
									descenderRef.constructor.superclass().constructor.namespace ? 
									descenderRef.constructor.superclass() : null;
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
				if (typeof mixinRef[i].mixinReady === 'function') 
					mixinRef[i].mixinReady.call(scope);
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
		
		Attribute.RETURN_NULL = '_a5_attributeReturnsNull';
		Attribute.SUCCESS = '_a5_attributeSuccess';
		Attribute.ASYNC = '_a5_attributeAsync';
		Attribute.FAILURE = '_a5_attributeFailure';
		
		Attribute.processInstance = function(cls){
			return a5.core.attributes.processInstance(cls);
		}
		
		this.Properties(function(){
			this.target = a5.AttributeTarget.ALL;
		});
		
		proto.Attribute = function($target){
			if($target)
				this.target = $target;
		}
		
		proto.instanceCreate = function(rules, instance){ return Attribute.SUCCESS; }
		
		proto.instanceDestroy = function(rules, instance){ return Attribute.SUCCESS; }
		
		proto.instanceProcess = function(rules, instance){ return Attribute.SUCCESS; }
		
		proto.methodPre = function(){ return Attribute.SUCCESS; }
		
		proto.methodPost = function(scope, method){ return Attribute.SUCCESS; }

})

a5.Package('a5')

	.Static('AttributeTarget', function(AttributeTarget){
		
		AttributeTarget.ALL = '_a5_attTargAll';
		AttributeTarget.METHOD = '_a5_attTargMethod';
		AttributeTarget.CLASS = '_a5_attTargClass';
			
})	


a5.Package('a5')

	.Extends('Attribute')
	.Class('ContractAttribute', function(cls, im, Contract){
		
		cls.ContractAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback){
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
						return a5.Attribute.FAILURE;
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
					return a5.Attribute.FAILURE;
				}
			}
			if (!foundTestRule || retObj === false) {
				cls.throwError(processError(cls.create(a5.ContractException, ['no matching overload found'])));
				return a5.Attribute.FAILURE;
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

	.Extends('Attribute')
	.Class('PropertyMutatorAttribute', function(cls){
		
		cls.PropertyMutatorAttribute = function(){
			cls.superclass(this);
		}
		
		cls.Override.methodPre = function(typeRules, args, scope, method, callback, callOriginator){
			if(args.length){
				var typeVal = typeRules[0].validate,
					isCls = false;
				if(typeVal){
					if (typeVal.indexOf('.') !== -1) {
						isCls = true;
						var typeVal = a5.GetNamespace(typeVal);
						if(!typeVal)
							return a5.Attribute.FAILURE;
					}
					var isValid = isCls ? (args[0] instanceof typeVal) : (typeof args[0] === typeVal);
					if(!isValid)
						return a5.Attribute.FAILURE;
				}
				scope[typeRules[0].property] = args[0];
				return a5.Attribute.SUCCESS;
			}
			var retVal = scope[typeRules[0].property];
			return retVal === null ? a5.Attribute.RETURN_NULL : retVal;
		}	
		
		cls.Override.methodPost = function(typeRules, args, scope, method, callback, callOriginator, preArgs){
			if (preArgs.length) 
				return scope;
			else 				
				return a5.Attribute.SUCCESS;
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
		proto.removeEventListener = function(type, method, useCapture){
			var types = type.split('|'),
				i, l, listArray, j, m;
			useCapture = useCapture === true;
			for (i = 0, l = types.length; i < l; i++) {
				listArray = this._a5_getListenerArray(types[i]);
				if (listArray) {
					for (j = 0, m = listArray.length; j < m; j++) {
						if (listArray[j].method == method && listArray[j].type == types[i] && listArray[j].useCapture === useCapture) {
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
		
		proto._a5_addEventListener = function(type, method, useCapture, $scope, $isOneTime){
			var scope = $scope || null,
				types = type.split('|'),
				isOneTime = $isOneTime || false,
				shouldPush = true,
				i, l, listArray, j, m;
			if (types.length != 0 && method != undefined) {
				for (i = 0, l = types.length; i < l; i++) {
					listArray = this._a5_getListenerArray(types[i], true);
					for (j = 0, m = listArray.length; j < m; j++) {
						if (listArray[j].method === method && listArray[j].type === types[i] && listArray[j].useCapture === useCapture) {
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