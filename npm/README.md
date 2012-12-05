A5 CL - Application Framework Library Built on A5 (http://a5js.com)

NOTE: This is an alpha test build of implementing A5 CL for NodeJS. For more info on the framework itself, see http://a5js.com.

Licensed under GPL-3.0

Detailed release notes coming soon, along with wiki implementation guides.

About A5

A5 provides object and aspect oriented uderpinnings to JavaScript development. More info is available here: http://a5js.com/a5-core/ 

About A5 CL

A5 CL is a framework designed to add a logical application structure to JavaScript apps, 
leveraging the code constructs of A5. 

Requiring a5 places the framework in the global context and handles all necessary underpinnings. 
From here, apps in NodeJS and in the browser are coded identically.

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
