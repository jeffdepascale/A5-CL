
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

