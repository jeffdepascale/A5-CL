
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
					self.cl().dispatchEvent(im.CLEvent.ERROR_THROWN, e);			
					return false;
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