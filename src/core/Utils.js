
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
