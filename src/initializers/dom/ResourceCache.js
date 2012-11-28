a5.Package('a5.cl.initializers.dom')
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
			cacheBreakValue,
			cacheTypes = [
				{type:'html', extension:'html'},
				{type:'html', extension:'htm'},
				{type:'js', extension:'js'},
				{type:'text', extension:'txt'},
				{type:'image', extension:'jpg'},
				{type:'image', extension:'gif'},
				{type:'image', extension:'png'},
				{type:'css', extension:'css'},
				{type:'xml', extension:'xml'}
			];
		
		
		this.ResourceCache = function(){
			this.superclass(this);
			a5.cl.CreateCallback(eAppIntializingHandler);
			resources = {};
		}
		
		var eAppIntializingHandler = function(){
			requestManager = a5.cl.core.RequestManager.instance();
			cacheTypes = cacheTypes.concat(self.config().cacheTypes);
			if(self.config().cacheBreak && typeof self.config().applicationBuild === 'string'){
				var trimVal = im.Utils.trim(self.config().applicationBuild);
				if(trimVal !== "")
					cacheBreakValue = trimVal;
			}
		}
		
		this.initStorageRules = function(){
			var manifestBuild = this.cl().manifestBuild(),
				storedBuild = this.getValue('build') || -1;
			shouldUseCache = (this.cl().isOfflineCapable() && this.cl().environment() === 'PRODUCTION');
			if(manifestBuild && manifestBuild > storedBuild) this.clearScopeValues();
			if(shouldUseCache) this.storeValue('build', manifestBuild);
			else this.clearScopeValues();
		}
		
		this.load = function(value, callback, itemCallback, onerror, asXHR){
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
						url = im.Utils.makeAbsolutePath(checkReplacements(url));
						if(cacheBreakValue)
							url = url + '?a5=' + cacheBreakValue;
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
			var env = self.cl().initializer().environmentManager();
			return url.replace('{CLIENT_ENVIRONMENT}', env.clientEnvironment()).replace('{ENVIRONMENT}', env.environment());
		}
	
})