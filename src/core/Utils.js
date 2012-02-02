
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
