a5.Package('a5.cl.intializers')

    .Extends('a5.cl.CLInitializer')
    .Class('DOMInitializer', function (cls, im) {

        cls.DOMInitializer = function () {
            cls.superclass(this);
        }

        cls.Override.intialize = function (callback) {
            var initialized = false,

            onDomReady = function () {
                if (!initialized) {
                    initialized = true;
                    callback();
                }
            },

            domContentLoaded = function () {
                if (document.addEventListener) {
                    document.removeEventListener("DOMContentLoaded", domContentLoaded, false);
                    onDomReady();
                } else if (document.attachEvent) {
                    if (document.readyState === "complete") {
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
        }

});
