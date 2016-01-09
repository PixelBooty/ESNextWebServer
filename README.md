ES6WebServer
============

The first open source ecmaNext web server for nodejs.

Work in progress
================
This server started with ECMA6 but has moved to ECMA7 for use of async methods.
The server is stable however lacking in a few features.
Live speed testing has shown that when using the server as intended it is one of the fastest web servers.
This server has been used in a few production environments including our own web server http://www.adaptivelite.com.

Features
========
* Full featured web server that can run hosts using esnext in nodejs.
* Dynamic compiled run-time updater that will allow you to make changes to services without halting the server.
* Built in session manager, and database manager.
* Custom packages within your servers.

Install
=======
`npm install esnextws`

Babel Help
==========
You will have to have babel setup in your project with polyfill to run this server.
If you have never used babel you can following these instructions or visit https://babeljs.io for more details.
To do this you must include the following npm packages to your project:
* babel,
* babel-cli
* babel-core
* babel-polyfill
* babel-preset-es2015
* babel-preset-stage-# you must have at-least stage-2 to run async methods.
Then in your package JSON you must have the following lines.
```
"babel": {
  "presets": [
    "es2015",
    "stage-#"
  ]
}
```

You must also put the following in your file before you require the npm.
```
require("babel-core/register");
require("babel-polyfill");
```
This has been tested with babel 6 only.

Running
=======
```
require( "esnextws" ).init( configuration, services );
```
Where services are an array of locations of servers to boot.

Upcoming Compatibility Notice
=============================
Custom locations for services is going to take over the current service loader.
As of version 1.0.0 you will have to put all your services in a "Services" directory in the root of your project.
As of version 1.1.0 you will that directory will be not be required rather the services array.
So to avoid a breaking change make sure to use both methods of including your service.

Configuration Options
==============
* port: Port to run the web server on.
* adminHost: Host on server that is allowed to see the admin.

Unix based OS only:
* uid: User id or name that will persist the server.
* gid: Group id or name that will persist the server.

Road map
========

0. Custom service locations.
1. Finish Admin host.
2. Working example services and hosts.
3. More mime-types.
4. Session cookie security improvements.
