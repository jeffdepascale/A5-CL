A5 CL (Core Layer) - Application Framework Library Built on A5 (http://a5js.com)

NOTE: This is an alpha test build of implementing A5 CL in CommonJS. For more info on the framework itself, see a5js.com.

Licensed under GPL-3.0

Detailed release notes coming soon, along with wiki implementation guides.

A5 CL includes A5 directly, no separate script is required to run. Requiring a5 places the framework in the global context and handles all necessary underpinnings. From here, apps in CommonJS and in the browser are coded identically.

Quick Tutorial: Hello World 

```javascript
require("a5")

a5.Package('testApp')

.Extends('a5.cl.CLMain')
.Class('Main', function(cls){

    cls.Main = function(app){
        cls.superclass(this);
    }    

    cls.Override.applicationLaunched = function(e){
        console.log('Hello World!');
    }

})

a5.cl.CreateApplication() 
```
