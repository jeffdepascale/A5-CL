a5.Package('a5.cl.intializers')

    .Extends('a5.cl.CLInitializer')
    .Class('CommonJSInitializer', function (cls, im) {

        cls.CommonJSInitializer = function () {
            cls.superclass(this);
            a5.RegisterNamespaceResolver(requireHandler);
            a5.RegisterClassCreateHandler(exportHandler);
        }

        cls.Override.intialize = function (callback) {
            callback();
        }

        var exportHandler = function (cls) {
            for (var prop in cls)
                if(prop.indexOf("_" != 0))
                    exports[prop] = cls[prop];
        }

        var requireHandler = function (namespace) {
            return require(namespace);
        }
});