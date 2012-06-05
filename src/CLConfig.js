
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
	 * @type String
	 * @default null
	 */
	applicationBuild:null,
	
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
	 * @type Boolean
	 * @default false
	 */
	cacheBreak:false,
	
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
