ESNextWebServer
===============

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
* Dynamic compiled run-time updater that will allow you to make changes to services, hosts, modules, and controllers, without halting or restarting the server.
* Built in session manager, and database manager.

Install
=======
`npm install esnextws`

Babel Help
==========
You will have to have babel setup in your project with polyfill to run this server.
If you have never used babel you can following these instructions or visit https://babeljs.io for more details.
To do this you must include the following npm packages to your project:
* babel
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
Each service path must be relative to the root using / as the path separator on all operating systems, and must end with a '/'.
Additionally each service must have babel and its own package.json with proper babel definitions.

Configuration Options
=====================
* port: Port to run the web server on.

Unix based OS only:
* uid: User id or name that will persist the server.
* gid: Group id or name that will persist the server.

Quick Start Scaffolding
=======================
To get up and running quickly or to scaffold a new service you can use the auto scaffolding service that will build a service for you. From you project root run the following, and follow the prompts.
```
node node_modules/esnextws/scaffolding
```
Note: The Hello World scaffold is the only working option.

Road map
========

1. Finish scaffold options.
2. More mime-types.
3. Session cookie security improvements.
